"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  ShieldCheck,
  CircleCheck,
  Truck,
  ArrowRight,
  FileText,
  X,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { createClient } from "@/lib/supabase/client";

const FLOW = [
  { icon: UploadCloud, label: "Upload prescription" },
  { icon: ShieldCheck, label: "Pharmacist verifies" },
  { icon: CircleCheck, label: "Confirm order" },
  { icon: Truck, label: "Home delivery" },
];
const ACTIVE_STEP = 0;

const STEPS = [
  { icon: UploadCloud, title: "Upload prescription", desc: "Snap a photo or pick a file from your device." },
  { icon: ShieldCheck, title: "Pharmacist verifies", desc: "We check the medicines and dosage for you." },
  { icon: CircleCheck, title: "Confirm order", desc: "Review the prepared order and confirm to proceed." },
  { icon: Truck, title: "Home delivery", desc: "Approved orders reach your door — free of charge." },
];

const MAX_BYTES = 10 * 1024 * 1024;

export default function PrescriptionPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function pick(f: File | null) {
    setError(null);
    if (f && f.size > MAX_BYTES) {
      setError("File is too large (max 10 MB).");
      return;
    }
    setFile(f);
  }

  async function submit() {
    if (!file) {
      setError("Please choose a prescription file first.");
      return;
    }
    setBusy(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      router.push("/login?next=/prescription");
      return;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${user.id}/${Date.now()}-${safeName}`;

    const { error: upErr } = await supabase.storage
      .from("prescriptions")
      .upload(path, file, { upsert: false });
    if (upErr) {
      setBusy(false);
      setError(upErr.message);
      return;
    }

    const { error: dbErr } = await supabase
      .from("prescriptions")
      .insert({ user_id: user.id, file_path: path, note: note.trim() });
    setBusy(false);
    if (dbErr) {
      setError(dbErr.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-[1200px]">
        <Header variant="inner" title="Prescription sent" />
        <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
          <CircleCheck className="h-16 w-16 text-leaf-500" />
          <h1 className="text-xl font-extrabold text-ink">
            Prescription received
          </h1>
          <p className="max-w-sm text-sm text-muted">
            Our pharmacist will review it and get in touch to confirm your
            order.
          </p>
          <div className="mt-3 flex gap-3">
            <Link
              href="/products"
              className="rounded-xl bg-sea-500 px-5 py-2.5 text-sm font-bold text-white"
            >
              Continue shopping
            </Link>
            <Link
              href="/orders"
              className="rounded-xl border border-hairline px-5 py-2.5 text-sm font-bold text-ink"
            >
              My orders
            </Link>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <Header variant="inner" title="Upload Prescription" />

      <main className="px-4 pb-36 pt-4 md:px-6 md:pb-16">
        <div className="rounded-2xl border border-sea-100 bg-sea-50/70 p-4">
          <h1 className="text-base font-bold text-ink">
            Order with prescription
          </h1>
          <p className="mt-1 text-[12px] text-muted">
            Upload a valid prescription and our team will prepare your order.
          </p>
        </div>

        {/* Order progress tracker */}
        <div className="mt-4 rounded-2xl border border-hairline bg-white p-4 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
            Order progress
          </p>
          <ol className="mt-3 flex items-start">
            {FLOW.map((step, i) => {
              const active = i <= ACTIVE_STEP;
              const current = i === ACTIVE_STEP;
              const Icon = step.icon;
              return (
                <li
                  key={step.label}
                  className="relative flex flex-1 flex-col items-center text-center"
                >
                  {i > 0 && (
                    <span
                      className={`absolute right-1/2 top-5 z-0 h-0.5 w-full ${
                        i <= ACTIVE_STEP ? "bg-sea-500" : "bg-hairline"
                      }`}
                    />
                  )}
                  <span
                    className={`relative z-10 grid h-10 w-10 place-items-center rounded-full border-2 transition ${
                      active
                        ? "border-sea-500 bg-sea-500 text-white"
                        : "border-hairline bg-white text-muted"
                    } ${current ? "shadow-soft ring-4 ring-sea-100" : ""}`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span
                    className={`mt-2 text-[10px] font-semibold leading-tight ${
                      active ? "text-sea-600" : "text-muted"
                    }`}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Dropzone */}
        {file ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-sea-200 bg-white p-4 shadow-card">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sea-50">
              <FileText className="h-6 w-6 text-sea-600" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {file.name}
              </p>
              <p className="text-[12px] text-muted">
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              aria-label="Remove file"
              className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-hairline/60 hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-sea-200 bg-white px-6 py-10 text-center transition hover:border-sea-400 hover:bg-sea-50/40">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-sea-50">
              <UploadCloud className="h-7 w-7 text-sea-500" />
            </span>
            <span className="text-sm font-bold text-ink">
              Tap to upload prescription
            </span>
            <span className="text-[11px] text-muted">
              JPG, PNG or PDF · up to 10 MB
            </span>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
            />
          </label>
        )}

        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything we should know? (optional)"
          className="mt-3 w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-sea-400 focus:ring-2 focus:ring-sea-200"
        />

        {error && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[13px] font-semibold text-rose-600">
            {error}
          </p>
        )}

        <button
          onClick={submit}
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-sea-500 py-3.5 text-sm font-bold text-white shadow-soft transition hover:bg-sea-600 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Submit prescription
        </button>
        <p className="mt-2 text-center text-[11px] text-muted">
          You&apos;ll need to be signed in so we can reach you about your order.
        </p>

        {/* How it works */}
        <h2 className="mt-8 text-sm font-bold text-ink">How it works</h2>
        <div className="mt-3 space-y-3">
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="flex gap-3 rounded-2xl border border-hairline bg-white p-3 shadow-card"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sea-50">
                <Icon className="h-5 w-5 text-sea-600" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">
                  {i + 1}. {title}
                </p>
                <p className="text-[12px] text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
