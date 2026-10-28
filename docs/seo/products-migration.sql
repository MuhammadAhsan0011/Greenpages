-- Products marketplace (OLX-style feed) — any signed-in user can list a
-- product; no business listing required (same rule as jobs/articles).
--
-- Run this once in the Supabase SQL editor. Same RLS shape as jobs:
-- public can read published products, the seller can read/edit/delete
-- their own regardless of status, admin can read/update/delete anything.
--
-- Images live in the existing public "uploads" Storage bucket under the
-- "product-images/" folder — no bucket/policy change needed. The 5-image
-- cap is enforced here AND in app/products/actions.js; the 1MB-per-image
-- cap is enforced in app/products/actions.js and the upload form (the
-- bucket's own limit stays 5MB because business/article uploads share it).

begin;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text not null unique,
  company_name text not null,
  -- Whole rupees. Nullable would mean "ask for price" — the form requires a
  -- price, so it's not null here too.
  price bigint not null check (price >= 0),
  price_currency text not null default 'PKR',
  availability text not null default 'in_stock' check (
    availability in ('in_stock', 'out_of_stock', 'pre_order')
  ),
  condition text not null default 'new' check (condition in ('new', 'used')),
  -- Slug of a category in app/data/productOptions.js (static list, same
  -- pattern as businesses/blog).
  category text not null,
  description text not null,
  product_link text,
  tags text,
  city text,
  address text,
  contact_whatsapp text,
  contact_phone text,
  image_urls text[] not null default '{}' check (cardinality(image_urls) <= 5),
  -- RLS lets any signed-in user insert straight through the Supabase API,
  -- bypassing the server action's URL validation — so the http(s)-only
  -- rule is repeated here (these values are rendered as links).
  constraint products_product_link_http check (product_link is null or product_link ~* '^https?://'),
  constraint products_contact_whatsapp_http check (contact_whatsapp is null or contact_whatsapp ~* '^https?://'),
  -- 'sold' stays publicly readable (detail page shows a Sold badge) but is
  -- left out of the /products feed; 'hidden' is seller/admin-only.
  status text not null default 'published' check (status in ('published', 'sold', 'hidden')),
  is_featured boolean not null default false,
  view_count integer not null default 0,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Published and sold products are publicly readable"
  on public.products for select
  using (status in ('published', 'sold'));

create policy "Sellers can read their own products"
  on public.products for select
  using (auth.uid() = seller_id);

create policy "Admin can read all products"
  on public.products for select
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

create policy "Sellers can create products"
  on public.products for insert
  with check (auth.uid() = seller_id and status = 'published');

create policy "Sellers can update their own products"
  on public.products for update
  using (auth.uid() = seller_id);

create policy "Sellers can delete their own products"
  on public.products for delete
  using (auth.uid() = seller_id);

create policy "Admin can update any product"
  on public.products for update
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

create policy "Admin can delete any product"
  on public.products for delete
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

create index products_status_published_at_idx on public.products(status, published_at desc);
create index products_seller_id_idx on public.products(seller_id);
create index products_category_idx on public.products(category);
create index products_city_idx on public.products(city);

commit;
