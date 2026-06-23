import { createClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client for the ADMIN panel only.
 *
 * It keeps its session in localStorage under a dedicated `storageKey`, fully
 * separate from the storefront's cookie-based session. That means you can be
 * signed into the admin panel AND a normal customer account in the same browser
 * at the same time — signing in/out of one never touches the other.
 *
 * Writes still flow through RLS (admin JWT → is_admin() = true), so this is as
 * secure as the storefront client.
 */
export function createAdminBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storageKey: "pharmaciti-admin-auth",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    },
  );
}
