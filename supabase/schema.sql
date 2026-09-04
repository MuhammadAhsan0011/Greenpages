-- Green Pages platform schema.
-- Run this once in your Supabase project's SQL Editor (Dashboard > SQL Editor > New query)
-- after creating the project, before using sign-up/business profiles/comments/articles.

-- ---------------------------------------------------------------
-- profiles: one row per signed-up user, auto-created on sign-up.
-- ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------------------------------------------------------------
-- user_emails: emails live in the private auth.users table (not exposed
-- via the API), and Postgres RLS can't restrict a single COLUMN to one
-- viewer — only rows. So email is denormalized into its own table where
-- normal row-level policies apply cleanly: only the user themselves and
-- the admin can read it. Used by /admin's user list.
-- ---------------------------------------------------------------
create table public.user_emails (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null
);

alter table public.user_emails enable row level security;

create policy "Users can read their own email"
  on public.user_emails for select
  using (auth.uid() = id);

create policy "Admin can read all emails"
  on public.user_emails for select
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

-- Auto-creates a public.profiles row (and a user_emails row) whenever
-- someone signs up, using the full_name they entered on the sign-up form.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', 'New Member'));

  insert into public.user_emails (id, email)
  values (new.id, new.email);

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------
-- businesses: one business profile per user.
-- ---------------------------------------------------------------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade unique,
  name text not null,
  category text not null,
  subcategory text,
  description text not null,
  website text,
  phone text,
  city text,
  -- Listing tier. Never exposed as a field in the business profile form —
  -- the app has no code path that lets an owner set their own plan.
  -- Upgrade it yourself in the Supabase Table Editor after collecting
  -- payment manually (bank transfer / JazzCash / Easypaisa) for the
  -- "verified" (Rs. 2000) or "featured" (Rs. 4500) package.
  plan text not null default 'free' check (plan in ('free', 'verified', 'featured')),
  -- Set when the owner clicks "Choose Verified/Featured" on /pricing while
  -- signed in. Shows up in /admin as a pending request; approving it there
  -- copies this into `plan` and clears it back to null.
  requested_plan text check (requested_plan in ('verified', 'featured')),
  logo_url text,
  cover_image_url text,
  -- Comma-separated gallery photo URLs (max 5, enforced in the Add Listing
  -- wizard) — separate from logo_url/cover_image_url, and never includes
  -- the logo: this is only real uploaded photos of the business.
  photos text,
  -- Comma-separated — same convention as articles.tags.
  tags text,
  -- Comma-separated feature keys (e.g. "24/7 Service, Free Wi-Fi") chosen
  -- from a fixed checkbox list in the Add Listing wizard.
  features text,
  -- Contact person's role at the business (e.g. "Owner", "Manager").
  position text,
  address_line1 text,
  address_line2 text,
  state text,
  country text,
  postal_code text,
  -- Social links + the rich "About" editor are Verified/Featured-only,
  -- enforced server-side in app/account/actions.js — not just hidden in
  -- the form.
  facebook_url text,
  instagram_url text,
  linkedin_url text,
  whatsapp_url text,
  about_html text,
  -- Structured per-day hours, e.g.
  -- {"monday": {"open": "09:00", "close": "18:00", "closed": false}, ...}
  -- — only days the owner actually set appear as keys.
  business_hours jsonb,
  -- Incremented by the increment_business_view() function below, called
  -- from the public listing page — never written to directly, since plain
  -- UPDATE is restricted to the owner by RLS (see "Users can update their
  -- own business profile").
  view_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.businesses enable row level security;

create policy "Businesses are publicly readable"
  on public.businesses for select
  using (true);

create policy "Users can create their own business profile"
  on public.businesses for insert
  with check (auth.uid() = owner_id);

create policy "Users can update their own business profile"
  on public.businesses for update
  using (auth.uid() = owner_id);

create policy "Users can delete their own business profile"
  on public.businesses for delete
  using (auth.uid() = owner_id);

-- Lets the admin account approve/set any business's plan from /admin —
-- update the email here if you ever change which account is the admin.
create policy "Admin can update any business"
  on public.businesses for update
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

create policy "Admin can delete any business"
  on public.businesses for delete
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

-- Lets the public listing page bump view_count without needing a general
-- UPDATE grant (RLS above only allows the owner/admin to update a row) —
-- security definer runs as the function owner, bypassing RLS, but this
-- function does nothing except that one increment.
create function public.increment_business_view(business_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.businesses set view_count = view_count + 1 where id = business_id;
end;
$$;

grant execute on function public.increment_business_view(uuid) to anon, authenticated;

-- ---------------------------------------------------------------
-- articles: user-submitted blog articles. Published instantly, no
-- review step (per site policy) — moderation happens by the site owner
-- editing/deleting a row directly in the Supabase Table Editor, which
-- uses the project's service role and bypasses these RLS policies.
-- ---------------------------------------------------------------
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique,
  title text not null,
  excerpt text not null,
  content text not null,
  category text not null,
  cover_image_url text,
  -- 'markdown' = the safe lightweight editor (Free tier), rendered via
  -- RichArticleBody.js. 'html' = TipTap output (Verified/Featured),
  -- sanitized server-side before storage and again on render — see
  -- utils/sanitizeHtml.js.
  content_format text not null default 'markdown' check (content_format in ('markdown', 'html')),
  -- Verified/Featured-only fields (enforced server-side in
  -- app/account/articles/actions.js, not just hidden in the form).
  tags text,
  meta_title text,
  meta_description text,
  featured_on_homepage boolean not null default false,
  -- Defaults to "now" (instant publish), but Verified/Featured members can
  -- set a future timestamp to schedule a post — public queries filter on
  -- this so it stays invisible until that time arrives.
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.articles enable row level security;

create policy "Articles are publicly readable"
  on public.articles for select
  using (true);

create policy "Users can publish their own articles"
  on public.articles for insert
  with check (auth.uid() = author_id);

create policy "Users can update their own articles"
  on public.articles for update
  using (auth.uid() = author_id);

create policy "Users can delete their own articles"
  on public.articles for delete
  using (auth.uid() = author_id);

create policy "Admin can delete any article"
  on public.articles for delete
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

-- ---------------------------------------------------------------
-- comments: on any post, identified by its slug. Works for both the
-- site's built-in static posts (app/data/blog.js) and user-submitted
-- articles above, since both use unique slugs.
-- ---------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create index comments_post_slug_idx on public.comments (post_slug);

create policy "Comments are publicly readable"
  on public.comments for select
  using (true);

create policy "Signed-in users can post comments"
  on public.comments for insert
  with check (auth.uid() = author_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = author_id);

-- ---------------------------------------------------------------
-- contact_messages: submissions from the /contact form. Insert-only for
-- the public — no select policy, so only the project owner can read
-- these, via the Supabase Table Editor (which bypasses RLS).
-- ---------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "Anyone can submit a contact message"
  on public.contact_messages for insert
  with check (true);

-- ---------------------------------------------------------------
-- newsletter_subscribers: footer newsletter signup. Insert-only for the
-- public, same reasoning as contact_messages above.
-- ---------------------------------------------------------------
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "Anyone can subscribe to the newsletter"
  on public.newsletter_subscribers for insert
  with check (true);

-- ---------------------------------------------------------------
-- storage: public bucket for business logos and article cover images.
-- Public read; only signed-in users can upload, and only the uploader
-- can update/delete their own files.
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'uploads',
  'uploads',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
);

create policy "Public read access to uploads"
  on storage.objects for select
  using (bucket_id = 'uploads');

create policy "Signed-in users can upload"
  on storage.objects for insert
  with check (bucket_id = 'uploads' and auth.role() = 'authenticated');

-- ---------------------------------------------------------------
-- reviews: testimonials about Green Pages itself (business_id null) and
-- per-business customer reviews (business_id set) — available to every
-- business regardless of plan. Anyone can submit a review (no sign-in
-- required); every submission starts unapproved and only becomes publicly
-- visible once the admin approves it in /admin.
-- ---------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  reviewer_name text not null,
  rating smallint not null check (rating between 1 and 5),
  message text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "Approved reviews are publicly readable"
  on public.reviews for select
  using (approved = true);

create policy "Anyone can submit a review"
  on public.reviews for insert
  with check (approved = false);

-- Matches the admin email used for the "Admin can update any business"
-- policy above — update it here too if that ever changes.
create policy "Admin can update any review"
  on public.reviews for update
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

create policy "Admin can delete any review"
  on public.reviews for delete
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

create policy "Users can update their own uploads"
  on storage.objects for update
  using (bucket_id = 'uploads' and owner = auth.uid());

create policy "Users can delete their own uploads"
  on storage.objects for delete
  using (bucket_id = 'uploads' and owner = auth.uid());
