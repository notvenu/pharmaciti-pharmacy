import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side auth helpers. `cache()` memoises per render pass so multiple
 * components can call these without re-hitting Supabase. Authorization itself
 * is enforced by RLS — these just expose the current user/profile to the UI.
 */

export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data;
});

export async function isAdmin(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.role === "admin";
}
