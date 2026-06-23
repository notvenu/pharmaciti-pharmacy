"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PhoneAuth } from "@/components/PhoneAuth";

function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/profile";
  const [mode, setMode] = useState<"login" | "signup">(
    params.get("mode") === "signup" ? "signup" : "login",
  );

  const onVerified = () => {
    router.replace(next);
    router.refresh();
  };

  return (
    <div className="bg-app-header grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to store
        </Link>
        <div className="mb-6 flex justify-center">
          <Logo variant="light" />
        </div>

        <div className="animate-fade-up rounded-3xl border border-hairline bg-white p-6 shadow-card md:p-7">
          {/* Tabs */}
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-hairline/50 p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-lg py-2 text-sm font-bold transition ${
                  mode === m
                    ? "bg-white text-ink shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <h1 className="text-xl font-extrabold tracking-tight text-ink">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-0.5 mb-5 text-sm text-muted">
            {mode === "login"
              ? "Sign in with your mobile number."
              : "Sign up with your name and mobile number."}
          </p>

          {/* `key` remounts PhoneAuth on mode change so its internal step resets. */}
          <PhoneAuth key={mode} mode={mode} onVerified={onVerified} />
        </div>

        <p className="mt-4 text-center text-[13px] text-muted">
          {mode === "login" ? (
            <>
              New to Pharmaciti?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="font-bold text-sea-600 hover:text-sea-700"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-bold text-sea-600 hover:text-sea-700"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-muted">Loading…</div>}>
      <LoginView />
    </Suspense>
  );
}
