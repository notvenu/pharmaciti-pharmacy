"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useAdmin } from "@/lib/admin/store";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Admin image picker — uploads the chosen file to the public `catalog` bucket
 * and hands the resulting public URL back via `onChange`. Used for product and
 * category artwork.
 */
export function ImageUpload({
  value,
  onChange,
  folder,
  label,
  hint,
}: {
  value?: string;
  onChange: (url?: string) => void;
  folder: "products" | "categories";
  label?: string;
  hint?: string;
}) {
  const { uploadImage } = useAdmin();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file?: File | null) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("Image too large (max 5 MB).");
      return;
    }
    setError(null);
    setBusy(true);
    const res = await uploadImage(file, folder);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onChange(res.url);
  }

  return (
    <div>
      {label && (
        <span className="mb-1.5 block text-[13px] font-semibold text-ink">
          {label}
        </span>
      )}
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Preview"
              className="h-24 w-24 rounded-xl border border-hairline object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(undefined)}
              aria-label="Remove image"
              className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-white text-muted shadow ring-1 ring-hairline transition hover:text-rose-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-hairline text-muted transition hover:border-sea-300 hover:text-sea-600 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
            <span className="text-[11px] font-semibold">
              {busy ? "Uploading…" : "Upload"}
            </span>
          </button>
        )}
        {value && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-lg border border-hairline px-3 py-2 text-[13px] font-bold text-ink transition hover:bg-sea-50/60 disabled:opacity-60"
          >
            {busy ? "Uploading…" : "Replace"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {hint && !error && (
        <span className="mt-1 block text-[12px] text-muted">{hint}</span>
      )}
      {error && (
        <p className="mt-1 text-[12px] font-semibold text-rose-600">{error}</p>
      )}
    </div>
  );
}
