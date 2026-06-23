"use client";

import Link from "next/link";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAdmin } from "@/lib/admin/store";
import { AdminShell } from "./AdminShell";
import { Login } from "./Login";

/**
 * Decides what the /admin area shows:
 *  • before the session has been checked → a brief spinner (avoids a flash)
 *  • not signed in → the phone-OTP login screen
 *  • signed in but not an admin → an access-denied screen
 *  • signed-in admin → the full shell with the routed page inside
 *
 * This is UI gating only. The database (RLS) is what actually stops a
 * non-admin from reading or writing anything.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { hydrated, signedIn, isAdmin, signOut } = useAdmin();

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#faf7f5]">
        <Loader2 className="h-7 w-7 animate-spin text-sea-500" />
      </div>
    );
  }

  if (!signedIn) return <Login />;

  if (!isAdmin) {
    return (
      <div className="bg-app-header grid min-h-screen place-items-center px-5">
        <div className="w-full max-w-sm rounded-3xl border border-hairline bg-white p-7 text-center shadow-card">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <ShieldAlert className="h-6 w-6" />
          </span>
          <h1 className="mt-3 text-xl font-extrabold text-ink">
            Access restricted
          </h1>
          <p className="mt-1 text-sm text-muted">
            This account isn&apos;t an administrator. Ask an existing admin to
            grant you access.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={signOut}
              className="w-full rounded-xl bg-sea-500 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-sea-600"
            >
              Sign in with another number
            </button>
            <Link
              href="/"
              className="w-full rounded-xl border border-hairline py-3 text-sm font-bold text-ink transition hover:bg-sea-50/40"
            >
              Back to store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
