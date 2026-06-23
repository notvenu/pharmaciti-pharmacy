"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X, type LucideIcon } from "lucide-react";
import type { OrderStatus } from "@/lib/admin/types";
import { ORDER_STATUS_LABEL } from "@/lib/admin/types";

/**
 * Shared admin UI kit. Small, dependency-free building blocks (drawer,
 * confirm dialog, form fields, badges, cards) so every section looks the
 * same and stays responsive. Styling matches the storefront tokens.
 */

/* ── Page header ──────────────────────────────────────────────────────── */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink md:text-2xl">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Stat card (dashboard) ────────────────────────────────────────────── */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "sea",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "sea" | "sky" | "leaf" | "amber";
}) {
  const tones: Record<string, string> = {
    sea: "bg-sea-50 text-sea-600",
    sky: "bg-sky-100 text-sky-500",
    leaf: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="rounded-2xl border border-hairline bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-semibold text-muted">{label}</span>
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tones[tone]}`}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </span>
      </div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[12px] text-muted">{hint}</div>}
    </div>
  );
}

/* ── Status pill ──────────────────────────────────────────────────────── */
const STATUS_TONE: Record<OrderStatus, string> = {
  placed: "bg-amber-50 text-amber-700 ring-amber-200",
  packed: "bg-sky-100 text-sky-600 ring-sky-200",
  shipped: "bg-violet-50 text-violet-700 ring-violet-200",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${STATUS_TONE[status]}`}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

/* ── Buttons ──────────────────────────────────────────────────────────── */
export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const variants: Record<string, string> = {
    primary: "bg-sea-500 text-white hover:bg-sea-600 shadow-soft",
    secondary: "border border-hairline bg-white text-ink hover:bg-sea-50/60",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    ghost: "text-muted hover:bg-hairline/60 hover:text-ink",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition active:scale-[0.98] disabled:opacity-50 ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ── Form fields ──────────────────────────────────────────────────────── */
const inputCls =
  "w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-sea-400 focus:ring-2 focus:ring-sea-200";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea {...props} className={`${inputCls} ${props.className ?? ""}`} />
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return (
    <select {...props} className={`${inputCls} ${props.className ?? ""}`} />
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2"
    >
      <span
        className={`relative h-6 w-10 rounded-full transition-colors ${
          checked ? "bg-sea-500" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[1.125rem]" : "left-0.5"
          }`}
        />
      </span>
      {label && (
        <span className="text-sm font-semibold text-ink">{label}</span>
      )}
    </button>
  );
}

/* ── Slide-over drawer ────────────────────────────────────────────────── */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!open) {
      // Defer the reset so it isn't a synchronous setState in the effect body.
      const t = setTimeout(() => setShow(false), 0);
      return () => clearTimeout(t);
    }
    const raf = requestAnimationFrame(() => setShow(true));
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div
        className={`absolute inset-0 bg-ink/40 backdrop-blur-[1px] transition-opacity duration-200 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          show ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <h2 className="text-base font-extrabold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-hairline/60 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="border-t border-hairline px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}

/* ── Confirm dialog ───────────────────────────────────────────────────── */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[95] grid place-items-center bg-ink/50 px-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-fade-up w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h2 className="mt-3 text-lg font-extrabold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-muted">{message}</p>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Empty state ──────────────────────────────────────────────────────── */
export function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: LucideIcon;
  title: string;
  message?: string;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-hairline bg-white px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-hairline/60 text-muted">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-3 text-sm font-bold text-ink">{title}</h3>
      {message && <p className="mt-1 text-[13px] text-muted">{message}</p>}
    </div>
  );
}
