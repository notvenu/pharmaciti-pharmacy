import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. BYPASSES Row Level Security, so it must only
 * ever be used inside server-side code (Server Actions / Route Handlers) and
 * never imported into a Client Component. Used to mint sessions for the custom
 * phone-OTP flow and to provision the admin account.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
