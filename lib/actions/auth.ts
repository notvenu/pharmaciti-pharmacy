"use server";

import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Custom phone-OTP + admin auth.
 *
 * Phone sign-in works without an SMS provider: a one-time code is stored
 * server-side (hashed, in `phone_otps`) and — in test mode — returned to the
 * UI to display. On verify, the service role mints/updates the user and a
 * session is signed in on the server (cookies set via the SSR client).
 *
 * Identity is a synthetic email derived from the phone number, so we never
 * depend on Supabase's phone provider being configured.
 */

const TEST_MODE = process.env.OTP_TEST_MODE !== "false";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@pharmaciti.local";

type Result = { ok: true } | { ok: false; error: string };
type AuthMode = "login" | "signup";

function normalisePhone(raw: string): string {
  const trimmed = (raw || "").replace(/[\s\-()]/g, "");
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
}

function emailForPhone(phone: string): string {
  return `${phone.replace(/\D/g, "")}@phone.pharmaciti.local`;
}

function hashCode(code: string, phone: string): string {
  return crypto.createHash("sha256").update(`${code}:${phone}`).digest("hex");
}

function randomPassword(): string {
  return crypto.randomBytes(24).toString("hex");
}

/** Step 1 — generate + store a code. Returns `devCode` in test mode. */
export async function sendPhoneOtp(
  phoneRaw: string,
): Promise<Result & { devCode?: string }> {
  const phone = normalisePhone(phoneRaw);
  if (!/^\+\d{8,15}$/.test(phone)) {
    return { ok: false, error: "Enter a valid phone number with country code." };
  }

  const code = String(crypto.randomInt(100000, 1000000)); // 6 digits
  const admin = createAdminClient();
  const { error } = await admin.from("phone_otps").upsert({
    phone,
    code_hash: hashCode(code, phone),
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    attempts: 0,
  });
  if (error) return { ok: false, error: error.message };

  // In production you would send `code` over SMS here instead of returning it.
  return TEST_MODE ? { ok: true, devCode: code } : { ok: true };
}

/**
 * Step 2 — verify the code, then sign the user in.
 *  • signup: a name is required and a new account is created.
 *  • login:  the account must already exist.
 */
export async function verifyPhoneOtp(
  phoneRaw: string,
  codeRaw: string,
  opts: { mode: AuthMode; fullName?: string },
): Promise<Result> {
  const phone = normalisePhone(phoneRaw);
  const code = (codeRaw || "").trim();
  const name = opts.fullName?.trim() ?? "";

  if (opts.mode === "signup" && name.length < 2) {
    return { ok: false, error: "Please enter your name to create an account." };
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("phone_otps")
    .select("code_hash, expires_at, attempts")
    .eq("phone", phone)
    .maybeSingle();

  if (!row) return { ok: false, error: "Please request a code first." };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "Code expired — request a new one." };
  }
  if (row.attempts >= 5) {
    return { ok: false, error: "Too many attempts. Request a new code." };
  }
  if (row.code_hash !== hashCode(code, phone)) {
    await admin
      .from("phone_otps")
      .update({ attempts: row.attempts + 1 })
      .eq("phone", phone);
    return { ok: false, error: "Incorrect code." };
  }

  const email = emailForPhone(phone);
  const password = randomPassword();

  // Does an account already exist for this number?
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .limit(1)
    .maybeSingle();

  if (opts.mode === "login" && !profile?.id) {
    return { ok: false, error: "No account found for this number. Please create one." };
  }
  if (opts.mode === "signup" && profile?.id) {
    return {
      ok: false,
      error: "An account already exists for this number. Please sign in instead.",
    };
  }

  if (profile?.id) {
    await admin.auth.admin.updateUserById(profile.id, {
      email,
      email_confirm: true,
      password,
    });
  } else {
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        password,
        user_metadata: { full_name: name },
      });
    if (createErr || !created.user) {
      return { ok: false, error: createErr?.message ?? "Could not create your account." };
    }
    // The synthetic-email user has no phone on auth.users; store it on profile.
    await admin
      .from("profiles")
      .update({ phone, full_name: name })
      .eq("id", created.user.id);
  }

  // Sign in on the server so the storefront session cookie is set.
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) return { ok: false, error: signInErr.message };

  await admin.from("phone_otps").delete().eq("phone", phone);
  return { ok: true };
}

type ProvisionResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

/**
 * Ensures the admin account exists with role = 'admin' and returns the email to
 * sign in with. Does NOT create a session — the admin panel signs in on the
 * client with its own (separate) Supabase client, so the admin session stays
 * independent of the storefront customer session.
 */
export async function provisionAdmin(
  username: string,
  password: string,
): Promise<ProvisionResult> {
  if ((username || "").trim() !== ADMIN_USERNAME) {
    return { ok: false, error: "Invalid username or password." };
  }

  const admin = createAdminClient();
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list?.users.find((u) => u.email === ADMIN_EMAIL);

  let adminId: string | undefined = existing?.id;

  if (!adminId) {
    // First-time bootstrap — only with the configured password.
    if (password !== ADMIN_PASSWORD) {
      return { ok: false, error: "Invalid username or password." };
    }
    const { data: created, error } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password,
      email_confirm: true,
    });
    if (error || !created.user) {
      return { ok: false, error: error?.message ?? "Could not create the admin account." };
    }
    adminId = created.user.id;
  }

  // Make sure the profile is an admin (the password itself is verified when the
  // client calls signInWithPassword).
  await admin.from("profiles").update({ role: "admin" }).eq("id", adminId);

  return { ok: true, email: ADMIN_EMAIL };
}
