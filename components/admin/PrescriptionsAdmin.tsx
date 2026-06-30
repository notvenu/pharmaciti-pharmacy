"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  ExternalLink,
  Search,
  Plus,
  Minus,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { formatRupees, formatShortDate } from "@/lib/format";
import { useAdmin } from "@/lib/admin/store";
import type { Order, Prescription } from "@/lib/admin/types";
import { Button, Drawer, EmptyState, PageHeader } from "./ui";

type Filter = "pending" | "all" | Prescription["status"];
type DraftItem = { id: string; name: string; price: number; qty: number };
type SearchHit = {
  id: string;
  name: string;
  brand: string;
  price: number;
  tint: string;
  imageUrl: string | null;
};

const RX_STATUS_LABEL: Record<Prescription["status"], string> = {
  submitted: "New",
  verified: "Verified",
  rejected: "Rejected",
  fulfilled: "Order placed",
};
const RX_STATUS_TONE: Record<Prescription["status"], string> = {
  submitted: "bg-amber-50 text-amber-700 ring-amber-200",
  verified: "bg-sky-100 text-sky-600 ring-sky-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  fulfilled: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function PrescriptionsAdmin() {
  const {
    data,
    prescriptionUrl,
    confirmPrescriptionOrder,
    rejectPrescription,
  } = useAdmin();
  const [filter, setFilter] = useState<Filter>("pending");
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => {
    const all = data.prescriptions;
    if (filter === "all") return all;
    if (filter === "pending")
      return all.filter(
        (p) => p.status === "submitted" || p.status === "verified",
      );
    return all.filter((p) => p.status === filter);
  }, [data.prescriptions, filter]);

  const active = openId
    ? data.prescriptions.find((p) => p.id === openId) ?? null
    : null;

  const TABS: { key: Filter; label: string }[] = [
    { key: "pending", label: "To review" },
    { key: "fulfilled", label: "Order placed" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  return (
    <>
      <PageHeader
        title="Prescriptions"
        subtitle={`${data.prescriptions.length} uploaded`}
      />

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold transition ${
              filter === key
                ? "bg-sea-500 text-white shadow-soft"
                : "border border-hairline bg-white text-ink-soft hover:bg-sea-50/60"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nothing here"
          message="No prescriptions match this filter."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {list.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setOpenId(p.id)}
              className="flex items-center gap-3 rounded-2xl border border-hairline bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sea-50 text-sea-600">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-ink">
                    Rx · {formatShortDate(p.createdAt)}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${RX_STATUS_TONE[p.status]}`}
                  >
                    {RX_STATUS_LABEL[p.status]}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[12px] text-muted">
                  {p.note || "No note"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Drawer
        open={!!active}
        onClose={() => setOpenId(null)}
        title="Prescription"
      >
        {active && (
          <PrescriptionDetail
            key={active.id}
            rx={active}
            order={data.orders.find((o) => o.prescriptionId === active.id) ?? null}
            getUrl={prescriptionUrl}
            onConfirm={confirmPrescriptionOrder}
            onReject={rejectPrescription}
            onDone={() => setOpenId(null)}
          />
        )}
      </Drawer>
    </>
  );
}

function PrescriptionDetail({
  rx,
  order,
  getUrl,
  onConfirm,
  onReject,
  onDone,
}: {
  rx: Prescription;
  order: Order | null;
  getUrl: (path: string) => Promise<string | null>;
  onConfirm: (
    orderId: string,
    items: { id: string; qty: number }[],
  ) => Promise<{ ok: boolean; error?: string }>;
  onReject: (orderId: string) => Promise<{ ok: boolean; error?: string }>;
  onDone: () => void;
}) {
  const [items, setItems] = useState<DraftItem[]>([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  // We can only act on a pending ('confirming') order that still exists.
  const pending = !!order && order.status === "confirming";
  const isPdf = /\.pdf$/i.test(rx.filePath);

  // Load a signed URL so the prescription renders inline for the admin.
  useEffect(() => {
    let alive = true;
    getUrl(rx.filePath).then((url) => {
      if (alive) setFileUrl(url);
    });
    return () => {
      alive = false;
    };
  }, [getUrl, rx.filePath]);

  async function search(value: string) {
    setQ(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(value)}`);
      const json = (await res.json()) as { results: SearchHit[] };
      setResults(json.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function addItem(hit: SearchHit) {
    setItems((prev) => {
      const found = prev.find((it) => it.id === hit.id);
      if (found)
        return prev.map((it) =>
          it.id === hit.id ? { ...it, qty: it.qty + 1 } : it,
        );
      return [...prev, { id: hit.id, name: hit.name, price: hit.price, qty: 1 }];
    });
  }

  function setQty(id: string, qty: number) {
    setItems((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, qty } : it))
        .filter((it) => it.qty > 0),
    );
  }

  async function confirm() {
    if (!order) return;
    if (items.length === 0) {
      setError("Add at least one item to build the order.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await onConfirm(
      order.id,
      items.map(({ id, qty }) => ({ id, qty })),
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not confirm the order.");
      return;
    }
    onDone();
  }

  async function reject() {
    if (!order) return;
    setBusy(true);
    setError(null);
    const res = await onReject(order.id);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not reject the prescription.");
      return;
    }
    onDone();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${RX_STATUS_TONE[rx.status]}`}
        >
          {RX_STATUS_LABEL[rx.status]}
        </span>
        {fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-hairline px-3 py-2 text-[13px] font-bold text-sea-600 transition hover:bg-sea-50"
          >
            <ExternalLink className="h-4 w-4" /> Open
          </a>
        )}
      </div>

      {/* Inline prescription so the admin can read it while adding items */}
      <div className="overflow-hidden rounded-2xl border border-hairline bg-hairline/20">
        {!fileUrl ? (
          <div className="grid h-48 place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-sea-500" />
          </div>
        ) : isPdf ? (
          <iframe
            src={fileUrl}
            title="Prescription"
            className="h-[28rem] w-full"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fileUrl}
            alt="Prescription"
            className="max-h-[28rem] w-full object-contain"
          />
        )}
      </div>

      {rx.note && (
        <div className="rounded-2xl border border-hairline bg-sea-50/30 p-3.5">
          <h3 className="text-[12px] font-extrabold uppercase tracking-wide text-muted">
            Customer note
          </h3>
          <p className="mt-1 text-[13px] text-ink-soft">{rx.note}</p>
        </div>
      )}

      {order && (
        <div className="rounded-2xl border border-hairline bg-sea-50/30 p-3.5">
          <h3 className="text-[12px] font-extrabold uppercase tracking-wide text-muted">
            Deliver to · Order PH-{order.orderNo}
          </h3>
          <p className="mt-1.5 text-sm font-bold text-ink">{order.customer}</p>
          {order.phone && (
            <p className="text-[13px] text-ink-soft">{order.phone}</p>
          )}
          <p className="mt-0.5 text-[13px] text-ink-soft">{order.address}</p>
        </div>
      )}

      {!pending ? (
        <p className="rounded-xl bg-hairline/40 px-3 py-3 text-center text-[13px] font-semibold text-muted">
          {rx.status === "rejected"
            ? "This prescription was rejected."
            : !order
              ? "No order is linked to this prescription."
              : "This prescription has already been confirmed into an order."}
        </p>
      ) : (
        <>
          {/* Build the order */}
          <div>
            <h3 className="mb-2 text-[13px] font-extrabold uppercase tracking-wide text-muted">
              Build the order
            </h3>

            <div className="flex items-center gap-2 rounded-xl border border-hairline px-3 py-2.5 focus-within:border-sea-400 focus-within:ring-2 focus-within:ring-sea-200">
              <Search className="h-4 w-4 shrink-0 text-muted" />
              <input
                value={q}
                onChange={(e) => search(e.target.value)}
                placeholder="Search products to add"
                className="w-full text-sm text-ink outline-none placeholder:text-muted/70"
              />
              {searching && (
                <Loader2 className="h-4 w-4 animate-spin text-sea-500" />
              )}
            </div>

            {results.length > 0 && (
              <div className="mt-2 space-y-1.5 rounded-xl border border-hairline p-1.5">
                {results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => addItem(r)}
                    className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition hover:bg-sea-50/60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink">
                        {r.name}
                      </span>
                      <span className="block text-[11px] text-muted">
                        {r.brand}
                      </span>
                    </span>
                    <span className="text-[13px] font-bold text-ink">
                      {formatRupees(r.price)}
                    </span>
                    <Plus className="h-4 w-4 text-sea-500" />
                  </button>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <ul className="mt-3 divide-y divide-hairline rounded-xl border border-hairline">
                {items.map((it) => (
                  <li key={it.id} className="flex items-center gap-2 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">
                        {it.name}
                      </p>
                      <p className="text-[11px] text-muted">
                        {formatRupees(it.price)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQty(it.id, it.qty - 1)}
                        className="grid h-7 w-7 place-items-center rounded-lg border border-hairline text-ink-soft hover:bg-sea-50"
                      >
                        {it.qty === 1 ? (
                          <Trash2 className="h-3.5 w-3.5" />
                        ) : (
                          <Minus className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <span className="w-6 text-center text-[13px] font-bold text-ink">
                        {it.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(it.id, it.qty + 1)}
                        className="grid h-7 w-7 place-items-center rounded-lg border border-hairline text-ink-soft hover:bg-sea-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] font-semibold text-rose-600">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between rounded-2xl bg-ink px-4 py-3 text-white">
            <span className="text-sm font-semibold">Order total</span>
            <span className="text-base font-extrabold">{formatRupees(total)}</span>
          </div>

          <div className="flex gap-3">
            <Button
              variant="danger"
              className="flex-1"
              onClick={reject}
              disabled={busy}
            >
              <X className="h-4 w-4" /> Reject
            </Button>
            <Button className="flex-[2]" onClick={confirm} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm &amp; place order
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
