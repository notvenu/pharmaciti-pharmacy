import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the storefront (customer) Supabase session on every request.
 * Called from `proxy.ts` (Next.js 16's renamed Middleware).
 *
 * The admin panel keeps its own separate session (localStorage, client-side)
 * and is gated by the AdminGate component + RLS, so the proxy deliberately does
 * NOT touch /admin auth here.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the token and keeps cookies in sync. Do not run code between
  // creating the client and this call.
  await supabase.auth.getUser();

  return response;
}
