"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, ShieldCheck, User, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAdmin } from "@/lib/admin/store";

/**
 * Admin sign-in with username + password. The server action verifies the
 * credentials and signs in a Supabase session whose profile has role = 'admin'
 * (provisioned on first use); RLS then enforces admin access on every write.
 */
export function Login() {
  const { signIn } = useAdmin();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await signIn(user, pass);
    if (!res.ok) {
      setBusy(false);
      setError(res.error ?? "Invalid username or password.");
      return;
    }
    // success: the gate re-renders into the panel.
  }

  return (
    <div className="bg-app-header grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo variant="light" />
        </div>

        <form
          onSubmit={submit}
          className="animate-fade-up rounded-3xl border border-hairline bg-white p-6 shadow-card md:p-7"
        >
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sea-50 text-sea-600">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="mt-3 text-xl font-extrabold tracking-tight text-ink">
            Admin Panel
          </h1>
          <p className="mt-0.5 text-sm text-muted">Sign in to manage your store.</p>

          <div className="mt-5 space-y-4">
            <div>
              <span className="mb-1.5 block text-[13px] font-semibold text-ink">
                Username
              </span>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
                <input
                  value={user}
                  onChange={(e) => {
                    setUser(e.target.value);
                    setError(null);
                  }}
                  autoComplete="username"
                  placeholder="admin"
                  className="w-full rounded-xl border border-hairline bg-white py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-sea-400 focus:ring-2 focus:ring-sea-200"
                />
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-[13px] font-semibold text-ink">
                Password
              </span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
                <input
                  value={pass}
                  onChange={(e) => {
                    setPass(e.target.value);
                    setError(null);
                  }}
                  type={reveal ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••"
                  className="w-full rounded-xl border border-hairline bg-white py-2.5 pl-10 pr-11 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-sea-400 focus:ring-2 focus:ring-sea-200"
                />
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  aria-label={reveal ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-hairline/60 hover:text-ink"
                >
                  {reveal ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[13px] font-semibold text-rose-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-sea-500 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-sea-600 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
