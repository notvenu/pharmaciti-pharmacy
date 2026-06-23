-- ═══════════════════════════════════════════════════════════════════════════
--  Pharmaciti Pharmacy · Supabase schema
--  Paste this whole file into the Supabase SQL editor and run it, then run
--  supabase/seed.sql to load the catalogue. Re-running is safe (idempotent).
--
--  Security model
--  • Every table has Row Level Security ON. RLS is the real boundary — the app
--    never trusts the client.
--  • Public (anon) can only READ active products / category tiles / banners.
--  • A user can only see and create their OWN orders / prescriptions.
--  • Writes to the catalogue and any order status change require an ADMIN, i.e.
--    a row in `profiles` with role = 'admin' (checked via is_admin()).
--  • Orders are placed through the SECURITY DEFINER function place_order(), so
--    pricing, totals and stock are computed on the server and never trusted
--    from the client.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Tables ─────────────────────────────────────────────────────────────────

-- Mirror of auth.users with app-specific fields. Auto-created by a trigger.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  role        text not null default 'customer' check (role in ('customer', 'admin')),
  created_at  timestamptz not null default now()
);

create table if not exists public.categories (
  id          text primary key,
  name        text not null,
  icon_key    text not null,
  href        text not null default '/products',
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.products (
  id           text primary key,
  name         text not null,
  brand        text not null default '',
  category     text not null,
  subcategory  text,
  pack         text not null default '',
  price        int  not null check (price >= 0),
  mrp          int  not null check (mrp >= 0),
  rx           boolean not null default false,
  tag          text,
  rating       numeric(2,1) not null default 4.5 check (rating >= 0 and rating <= 5),
  description  text not null default '',
  highlights   text[] not null default '{}',
  tint         text not null default '#E6F4F1',
  stock        int  not null default 0 check (stock >= 0),
  active       boolean not null default true,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_active_idx   on public.products (active);

create table if not exists public.banners (
  id            text primary key,
  badge         text not null default '',
  title_top     text not null default '',
  title_bottom  text not null default '',
  subtitle      text not null default '',
  cta_label     text not null default 'Shop now',
  cta_href      text not null default '/products',
  active        boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_no        bigint generated always as identity,
  user_id         uuid not null references auth.users (id) on delete cascade,
  customer        text not null default 'Customer',
  phone           text not null default '',
  address         text not null default '',
  total           int  not null default 0,
  status          text not null default 'placed'
                  check (status in ('placed','packed','shipped','delivered','cancelled')),
  payment_method  text not null default 'COD' check (payment_method in ('COD','Online')),
  placed_at       timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id);

create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  product_id  text references public.products (id) on delete set null,
  name        text not null,
  price       int  not null,
  qty         int  not null check (qty > 0)
);
create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.prescriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  file_path   text not null,
  note        text not null default '',
  status      text not null default 'submitted'
              check (status in ('submitted','verified','rejected','fulfilled')),
  created_at  timestamptz not null default now()
);
create index if not exists prescriptions_user_idx on public.prescriptions (user_id);

-- One-time codes for phone sign-in. Written/read only by the server (service
-- role) — RLS is on with no policies, so anon/authenticated can never touch it.
create table if not exists public.phone_otps (
  phone       text primary key,
  code_hash   text not null,
  expires_at  timestamptz not null,
  attempts    int not null default 0,
  created_at  timestamptz not null default now()
);

-- Uploaded artwork (admin can replace the icon with a real photo). Added via
-- ALTER so existing databases pick up the columns on re-run.
alter table public.products   add column if not exists image_url text;
alter table public.categories add column if not exists image_url text;

-- ── Helper functions ───────────────────────────────────────────────────────

-- SECURITY DEFINER so it can read profiles without tripping RLS recursion.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- Keep products.updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

-- Auto-create a profile row when a new auth user signs up (phone OTP).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, full_name)
  values (new.id, new.phone, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Stop a non-admin from promoting themselves by editing their own role.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Allow role changes from the service role / SQL editor (auth.uid() is null
  -- there) so an admin can be provisioned; block self-promotion by ordinary
  -- signed-in users.
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;
drop trigger if exists protect_profile_role_update on public.profiles;
create trigger protect_profile_role_update
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- Place an order atomically. Totals + stock are computed from the DB, never
-- from the client. Runs as definer so it can decrement stock (which customers
-- otherwise cannot update) inside one transaction.
create or replace function public.place_order(
  p_items    jsonb,   -- [{ "id": "dolo-650", "qty": 2 }, ...]
  p_customer text,
  p_phone    text,
  p_address  text,
  p_payment  text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_order   public.orders;
  v_item    jsonb;
  v_product public.products;
  v_qty     int;
  v_total   int := 0;
begin
  if v_uid is null then
    raise exception 'You must be signed in to place an order';
  end if;
  if p_payment not in ('COD','Online') then
    raise exception 'Invalid payment method';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty';
  end if;

  insert into public.orders (user_id, customer, phone, address, total, status, payment_method)
  values (
    v_uid,
    coalesce(nullif(trim(p_customer), ''), 'Customer'),
    coalesce(p_phone, ''),
    coalesce(p_address, ''),
    0, 'placed', p_payment
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(1, coalesce((v_item ->> 'qty')::int, 1));

    select * into v_product from public.products
      where id = (v_item ->> 'id') and active = true
      for update;
    if not found then
      raise exception 'A product in your cart is no longer available';
    end if;
    if v_product.stock < v_qty then
      raise exception 'Not enough stock for %', v_product.name;
    end if;

    insert into public.order_items (order_id, product_id, name, price, qty)
    values (v_order.id, v_product.id, v_product.name, v_product.price, v_qty);

    update public.products set stock = stock - v_qty where id = v_product.id;
    v_total := v_total + v_product.price * v_qty;
  end loop;

  update public.orders set total = v_total
    where id = v_order.id
    returning * into v_order;

  return v_order;
end;
$$;
grant execute on function public.place_order(jsonb, text, text, text, text) to authenticated;

-- ── Row Level Security ─────────────────────────────────────────────────────

alter table public.profiles      enable row level security;
alter table public.categories    enable row level security;
alter table public.products      enable row level security;
alter table public.banners       enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.prescriptions enable row level security;
alter table public.phone_otps    enable row level security;
-- phone_otps intentionally has NO policies: only the service role may use it.

-- profiles: read/update your own; admins read all.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- categories: public read, admin write.
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories
  for select using (true);

drop policy if exists categories_write on public.categories;
create policy categories_write on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- products: anyone reads active ones, admins read everything + write.
drop policy if exists products_read on public.products;
create policy products_read on public.products
  for select using (active = true or public.is_admin());

drop policy if exists products_write on public.products;
create policy products_write on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- banners: anyone reads active ones, admins manage.
drop policy if exists banners_read on public.banners;
create policy banners_read on public.banners
  for select using (active = true or public.is_admin());

drop policy if exists banners_write on public.banners;
create policy banners_write on public.banners
  for all using (public.is_admin()) with check (public.is_admin());

-- orders: owner reads own; admin reads all; only admin changes status.
-- (Inserts go exclusively through place_order(), so there is no insert policy.)
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists orders_update_admin on public.orders;
create policy orders_update_admin on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- order_items: visible to the order's owner or an admin.
drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- prescriptions: owner manages own; admin reads + updates status.
drop policy if exists prescriptions_insert_own on public.prescriptions;
create policy prescriptions_insert_own on public.prescriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists prescriptions_select on public.prescriptions;
create policy prescriptions_select on public.prescriptions
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists prescriptions_update_admin on public.prescriptions;
create policy prescriptions_update_admin on public.prescriptions
  for update using (public.is_admin()) with check (public.is_admin());

-- ── Storage: prescription uploads ──────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('prescriptions', 'prescriptions', false)
on conflict (id) do nothing;

-- Users upload into a folder named after their uid: "<uid>/<file>".
drop policy if exists prescriptions_upload_own on storage.objects;
create policy prescriptions_upload_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'prescriptions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists prescriptions_read_own on storage.objects;
create policy prescriptions_read_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'prescriptions'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ── Storage: catalogue images (product + category photos) ──────────────────
-- Public bucket so the storefront can load images by URL; only admins write.
insert into storage.buckets (id, name, public)
values ('catalog', 'catalog', true)
on conflict (id) do nothing;

drop policy if exists catalog_public_read on storage.objects;
create policy catalog_public_read on storage.objects
  for select using (bucket_id = 'catalog');

drop policy if exists catalog_admin_insert on storage.objects;
create policy catalog_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'catalog' and public.is_admin());

drop policy if exists catalog_admin_update on storage.objects;
create policy catalog_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'catalog' and public.is_admin());

drop policy if exists catalog_admin_delete on storage.objects;
create policy catalog_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'catalog' and public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
--  BOOTSTRAP YOUR FIRST ADMIN
--  After you have signed in once with your phone number (so a row exists in
--  public.profiles), promote yourself by running:
--
--    update public.profiles set role = 'admin'
--    where phone = '+91XXXXXXXXXX';
-- ═══════════════════════════════════════════════════════════════════════════
