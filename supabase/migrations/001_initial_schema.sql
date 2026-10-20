-- 001_initial_schema.sql
-- ShopCommerce core schema.
-- Tables: categories, products, profiles, addresses, carts, cart_items, orders, order_items
-- Auth: Supabase auth.users -> profiles (trigger), admin flag on profiles.
-- Checkout is account-only in v1, so carts.user_id is NOT NULL and unique.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.order_status as enum (
  'pending',
  'paid',
  'shipped',
  'cancelled',
  'refunded'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table public.products (
  id               uuid primary key default gen_random_uuid(),
  category_id      uuid references public.categories(id) on delete set null,
  name             text not null,
  slug             text not null unique,
  description      text,
  base_price_cents int  not null check (base_price_cents >= 0),
  images           text[] not null default '{}',
  -- { "sizes": ["S","M","L"], "colors": [{ "name": "Rust", "hex": "#E85D2F" }] }
  variants         jsonb not null default '{"sizes":[],"colors":[]}'::jsonb,
  is_active        boolean not null default true,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now()
);

create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text not null,
  full_name        text,
  default_shipping jsonb,
  is_admin         boolean not null default false,
  created_at       timestamptz not null default now()
);

create table public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  line1       text not null,
  line2       text,
  city        text not null,
  state       text not null,
  postal_code text not null,
  country     text not null default 'US',
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.carts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant    jsonb not null default '{}'::jsonb,
  quantity   int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  -- one row per product+variant; add-to-cart becomes an upsert
  unique (cart_id, product_id, variant)
);

create table public.orders (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid references public.profiles(id) on delete set null,
  email                    text not null,
  status                   public.order_status not null default 'pending',
  subtotal_cents           int not null check (subtotal_cents >= 0),
  shipping_cents           int not null default 0 check (shipping_cents >= 0),
  tax_cents                int not null default 0 check (tax_cents >= 0),
  total_cents              int not null check (total_cents >= 0),
  shipping_address         jsonb not null,
  stripe_session_id        text unique,
  stripe_payment_intent_id text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  product_id       uuid references public.products(id) on delete set null,
  -- denormalised so historical orders survive product edits/deletes
  product_name     text not null,
  product_slug     text not null,
  variant          jsonb not null default '{}'::jsonb,
  unit_price_cents int not null check (unit_price_cents >= 0),
  quantity         int not null default 1 check (quantity > 0),
  total_cents      int not null check (total_cents >= 0)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index products_category_idx on public.products (category_id);
create index products_active_idx   on public.products (is_active) where is_active;
create index orders_user_idx       on public.orders (user_id);
create index orders_status_idx     on public.orders (status);
create index orders_created_idx    on public.orders (created_at desc);
create index order_items_order_idx on public.order_items (order_id);
create index cart_items_cart_idx   on public.cart_items (cart_id);
create index addresses_user_idx    on public.addresses (user_id);

-- at most one default address per user
create unique index addresses_one_default_per_user
  on public.addresses (user_id)
  where is_default;

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER so admin checks do not recurse through profiles RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create trigger carts_set_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.profiles    enable row level security;
alter table public.addresses   enable row level security;
alter table public.carts       enable row level security;
alter table public.cart_items  enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- categories: world-readable, admin-writable
create policy "categories_public_read"
  on public.categories for select
  using (true);

create policy "categories_admin_write"
  on public.categories for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- products: active products are public, inactive visible to admins only
create policy "products_public_read"
  on public.products for select
  using (is_active = true or public.is_admin());

create policy "products_admin_write"
  on public.products for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- profiles: own row or admin; updates restricted at column level below
create policy "profiles_read_own_or_admin"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- addresses: owner CRUD, admin read
create policy "addresses_owner_all"
  on public.addresses for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "addresses_admin_read"
  on public.addresses for select to authenticated
  using (public.is_admin());

-- carts: owner only
create policy "carts_owner_all"
  on public.carts for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- cart_items: visible through an owned cart
create policy "cart_items_owner_all"
  on public.cart_items for all to authenticated
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = auth.uid()
    )
  );

-- orders: read own or admin, admin-only updates, no client inserts
-- (orders are created by the Stripe webhook using the service role)
create policy "orders_read_own_or_admin"
  on public.orders for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "orders_admin_update"
  on public.orders for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- order_items: readable when the parent order is readable
create policy "order_items_read_own_or_admin"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

-- public storefront reads
grant select on public.categories to anon, authenticated;
grant select on public.products   to anon, authenticated;

-- signed-in shopper
grant select on public.profiles to authenticated;
-- column-level UPDATE prevents a user from promoting themselves via is_admin
revoke update on public.profiles from authenticated;
grant update (full_name, default_shipping) on public.profiles to authenticated;

grant select, insert, update, delete on public.addresses  to authenticated;
grant select, insert, update, delete on public.carts      to authenticated;
grant select, insert, update, delete on public.cart_items to authenticated;

grant select, update on public.orders      to authenticated;
grant select          on public.order_items to authenticated;

-- service role (webhooks, admin scripts) bypasses RLS
grant all on all tables in schema public to service_role;
