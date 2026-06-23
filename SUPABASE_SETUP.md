# Supabase setup

This app is backed entirely by Supabase (Postgres + Auth + Storage). There is
no mock or demo data anymore — everything reads and writes through the database,
with Row Level Security as the security boundary.

Follow these steps once to get a working backend.

## 1. Create a project

1. Create a project at <https://supabase.com/dashboard>.
2. Open **Project Settings → API** and copy these into `.env.local`
   (copy `.env.example` if you haven't):
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / publishable key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role / secret key** → `SUPABASE_SERVICE_ROLE_KEY`

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   OTP_TEST_MODE=true
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   ```

   > The anon key is safe in the browser — every request is still gated by RLS.
   > The **service_role key is server-only** (used by the OTP + admin server
   > actions) and must never be exposed to the browser or committed.

## 2. Create the schema

1. In the dashboard open **SQL Editor → New query**.
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and **Run**.
   This creates the tables, RLS policies, the `is_admin()` / `place_order()`
   functions, the auth triggers, and the private `prescriptions` storage bucket.
3. New query again, paste [`supabase/seed.sql`](supabase/seed.sql) and **Run** to
   load the product catalogue, category tiles and hero banners.

Both files are idempotent — safe to re-run.

## 3. Customer sign-in / sign-up (phone OTP)

`/login` has two tabs: **Sign in** (existing accounts) and **Create account**
(sign-up requires a name). Both use a mobile number + one-time code. **No SMS
provider is required for testing:** with `OTP_TEST_MODE=true` the code is shown
right on the verification screen (and pre-filled), so you can sign in instantly.

For production, set `OTP_TEST_MODE=false` and send the generated code over SMS
in `sendPhoneOtp` (`lib/actions/auth.ts`) using your provider of choice.

> Identity uses a synthetic email derived from the phone number, so Supabase's
> phone provider does **not** need to be enabled.

## 4. Admin sign-in (username + password)

The `/admin` panel uses a username + password (set by `ADMIN_USERNAME` /
`ADMIN_PASSWORD`, default **admin / admin123**). On the first successful login
the admin account is provisioned automatically and its profile is set to
`role = 'admin'`. Change these credentials in `.env.local` for production.

> To promote any other account to admin, run in the SQL editor:
> ```sql
> update public.profiles set role = 'admin' where phone = '+91XXXXXXXXXX';
> ```

The admin panel keeps its **own session** (separate from the storefront), so you
can stay signed into `/admin` and also sign into a normal customer account on
the storefront at the same time — they don't interfere with each other.

## Editing the home page

Once signed in as admin, go to **Admin → Categories & Banners → Banners** to
edit the three home-page hero slides (badge, title, subtitle, button + link),
add new ones, or remove them. Changes are saved to the `banners` table and the
home page renders them live on the next load. The **Categories** tab edits the
"Shop by category" tiles the same way.

## Product & category images

Admins can upload a real photo instead of an icon:

- **Products** (Admin → Products → Add/Edit → *Product photo*) — the image
  replaces the icon on the card, product page, cart and search.
- **Categories** (Admin → Categories & Banners → Categories → *Category image*)
  — the image fills the whole "Shop by category" tile.

Uploads go to the public `catalog` storage bucket; only admins can write to it.
If you set up the database before this feature, **re-run `supabase/schema.sql`**
once to add the image columns and the `catalog` bucket (it's idempotent).

## How security is enforced

- **RLS on every table.** Anon visitors can only read *active* products,
  category tiles and banners. Customers can only read/insert their own orders
  and prescriptions. Catalogue writes and order-status changes require an admin.
- **Orders go through `place_order()`** — a `SECURITY DEFINER` function that
  computes prices, totals and stock on the server, so the client can never
  tamper with what it pays.
- **Role can't be self-escalated:** a trigger blocks non-admins from changing
  their own `role`.
- **Prescription files** live in a private storage bucket; users can only read
  files inside their own `"<uid>/"` folder (admins can read all).
- **Server Actions** (`lib/actions/*`) re-check auth on the server, since they
  are reachable as plain POST endpoints.

## What changed from the old demo

- `lib/products.ts` no longer holds the product array — it keeps only the fixed
  taxonomy + types. Catalogue data lives in the `products` table.
- `lib/admin/store.tsx` (the "backend seam") now talks to Supabase instead of
  `localStorage`; the demo `admin/admin` login is gone.
- The cart still lives client-side, but checkout creates a real order.
