-- GrowthPro platform schema.
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

-- Auto-creates a public.profiles row whenever someone signs up, using the
-- full_name they entered on the sign-up form.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', 'New Member'));
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
  description text not null,
  website text,
  phone text,
  city text,
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
