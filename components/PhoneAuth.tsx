"use client";

import { useState } from "react";
import { Phone, KeyRound, Loader2, ArrowRight, ArrowLeft, User } from "lucide-react";
import { sendPhoneOtp, verifyPhoneOtp } from "@/lib/actions/auth";

type Props = {
  /** "signup" requires a name and creates a new account; "login" needs an existing one. */
  mode: "login" | "signup";
  /** Called after the OTP is verified and a session exists. */
  onVerified: () => void | Promise<void>;
};

/**
 * Phone-number OTP sign-in/up. Talks to server actions (no SMS provider needed):
 * in test mode the code is shown on screen so you can sign in immediately.
 */
export function PhoneAuth({ mode, onVerified }: Props) {
  const isSignup = mode === "signup";
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("+91 ");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (isSignup && name.trim().length < 2) {
      setError("Please enter your name to create an account.");
      return;
    }
    setBusy(true);
    const res = await sendPhoneOtp(phone);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDevCode(res.devCode ?? null);
    if (res.devCode) setCode(res.devCode); // prefill for quick testing
    setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const token = code.trim();
    if (!/^\d{4,8}$/.test(token)) {
      setError("Enter the code we sent you.");
      return;
    }
    setBusy(true);
    const res = await verifyPhoneOtp(phone, token, {
      mode,
      fullName: isSignup ? name : undefined,
    });
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    await onVerified();
    setBusy(false);
  }

  if (step === "code") {
    return (
      <form onSubmit={verify} className="space-y-4">
        <p className="text-sm text-muted">
          Enter the code for{" "}
          <span className="font-semibold text-ink">{phone.trim()}</span>.
        </p>

        {devCode && (
          <div className="rounded-xl border border-dashed border-sea-300 bg-sea-50 px-4 py-3 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-sea-600">
              Test mode — your code
            </p>
            <p className="mt-0.5 text-2xl font-extrabold tracking-[0.3em] text-ink">
              {devCode}
            </p>
          </div>
        )}

        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            autoFocus
            className="w-full rounded-xl border border-hairline bg-white py-3 pl-10 pr-3.5 text-base tracking-[0.3em] text-ink outline-none transition placeholder:tracking-normal placeholder:text-muted/70 focus:border-sea-400 focus:ring-2 focus:ring-sea-200"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] font-semibold text-rose-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sea-500 py-3.5 text-sm font-bold text-white shadow-soft transition hover:bg-sea-600 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {isSignup ? "Create account" : "Verify & continue"}
        </button>
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setCode("");
            setDevCode(null);
            setError(null);
          }}
          className="flex w-full items-center justify-center gap-1.5 text-[13px] font-semibold text-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Change details
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="space-y-4">
      {isSignup && (
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-ink">
            Full name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              autoFocus
              className="w-full rounded-xl border border-hairline bg-white py-3 pl-10 pr-3.5 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-sea-400 focus:ring-2 focus:ring-sea-200"
            />
          </div>
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-[13px] font-semibold text-ink">
          Mobile number
        </label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            autoFocus={!isSignup}
            className="w-full rounded-xl border border-hairline bg-white py-3 pl-10 pr-3.5 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-sea-400 focus:ring-2 focus:ring-sea-200"
          />
        </div>
        <p className="mt-1 text-[12px] text-muted">
          We&apos;ll send you a one-time code.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] font-semibold text-rose-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-sea-500 py-3.5 text-sm font-bold text-white shadow-soft transition hover:bg-sea-600 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        Send code
      </button>
    </form>
  );
}
