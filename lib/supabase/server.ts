import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Supabase client, bound to the request's cookies so the user's session
 * is available in Server Components, Server Actions and Route Handlers. In
 * Next.js 16 `cookies()` is async, so this helper is async too.
 *
 * Note: in a plain Server Component you can read with this client, but writing
 * cookies (refreshing the session) only works in a Server Action, Route
 * Handler, or in `proxy.ts` — hence the try/catch around setAll.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — session refresh is handled by
            // proxy.ts, so this can be safely ignored.
          }
        },
      },
    },
  );
}
