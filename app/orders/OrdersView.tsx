"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CircleCheck,
  Clock,
  ShieldCheck,
  RotateCcw,
  Plus,
  Minus,
  Trash2,
  Search,
  X,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatRupees, formatShortDate } from "@/lib/format";
import { editOrderItem } from "@/lib/actions/orders";
import type { StoreOrder } from "@/lib/data";

type SearchHit = {
  id: string;
  name: string;
  brand: string;
  price: number;
  tint: string;
  imageUrl: string | null;
};

const STATUS = {
  confirming: {
    label: "Confirming",
    Icon: ShieldCheck,
    tint: "bg-violet-50 text-violet-600",
  },
  placed: { label: "Placed", Icon: Clock, tint: "bg-sea-50 text-sea-600" },
  delivered: {
    label: "Delivered",
    Icon: CircleCheck,
    tint: "bg-[#eaf6ef] text-leaf-500",
  },
} as const;

export function OrdersView({ orders }: { orders: StoreOrder[] }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [busy, setBusy] = useState<string | null>(null); // order id with a write in flight
  const [error, setError] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<StoreOrder | null>(null);

  async function apply(order: StoreOrder, productId: string, qty: number) {
    setBusy(order.id);
    setError(null);
    const res = await editOrderItem({ orderId: order.id, productId, qty });
    setBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  function reorder(order: StoreOrder) {
    for (const it of order.items) {
      if (!it.productId) continue;
      addItem(
        {
          id: it.productId,
          name: it.name,
          pack: "",
          price: it.price,
          mrp: it.price,
          tint: "#E6F4F1",
          category: "",
        },
        it.qty,
      );
    }
    router.push("/cart");
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-sea-50">
          <ClipboardList className="h-9 w-9 text-sea-400" />
        </span>
        <h1 className="text-lg font-bold text-ink">No orders yet</h1>
        <p className="max-w-xs text-sm text-muted">
          When you place an order it will show up here.
        </p>
        <Link
          href="/products"
          className="mt-1 rounded-xl bg-sea-500 px-6 py-3 text-sm font-bold text-white shadow-soft"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-[13px] font-semibold text-rose-600">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {orders.map((order) => {
          const s = STATUS[order.status];
          const editable = order.status === "placed";
          const confirming = order.status === "confirming";
          const working = busy === order.id;
          return (
            <div
              key={order.id}
              className="relative rounded-2xl border border-hairline bg-white p-4 shadow-card"
            >
              {working && (
                <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-white/60">
                  <Loader2 className="h-5 w-5 animate-spin text-sea-500" />
                </div>
              )}

              <div className="flex items-start gap-3">
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${s.tint}`}
                >
                  <s.Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-ink">
                      Order #PH-{order.orderNo}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${s.tint}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Placed on {formatShortDate(order.placedAt)} ·{" "}
                    {order.paymentMethod === "COD"
                      ? "Cash on delivery"
                      : "Paid online"}
                  </p>
                </div>
              </div>

              {confirming && order.items.length === 0 && (
                <p className="mt-3 rounded-xl bg-violet-50/70 px-3 py-2.5 text-[12px] font-semibold text-violet-700">
                  We&apos;re verifying your prescription. Our pharmacist will add
                  the medicines and confirm your order shortly.
                </p>
              )}

              <ul className="mt-3 space-y-2">
                {order.items.map((it, i) => (
                  <li
                    key={`${order.id}-${it.productId ?? i}`}
                    className="flex items-center justify-between gap-3 text-[12px]"
                  >
                    <span className="min-w-0 flex-1 truncate text-ink-soft">
                      {it.name}
                    </span>
                    {editable && it.productId ? (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          disabled={working}
                          onClick={() =>
                            apply(order, it.productId!, it.qty - 1)
                          }
                          aria-label="Decrease"
                          className="grid h-7 w-7 place-items-center rounded-lg border border-hairline text-ink-soft hover:bg-sea-50 disabled:opacity-50"
                        >
                          {it.qty === 1 ? (
                            <Trash2 className="h-3.5 w-3.5" />
                          ) : (
                            <Minus className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <span className="w-6 text-center font-bold text-ink">
                          {it.qty}
                        </span>
                        <button
                          type="button"
                          disabled={working}
                          onClick={() =>
                            apply(order, it.productId!, it.qty + 1)
                          }
                          aria-label="Increase"
                          className="grid h-7 w-7 place-items-center rounded-lg border border-hairline text-ink-soft hover:bg-sea-50 disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="shrink-0 text-muted">×{it.qty}</span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted">
                    Total
                  </p>
                  <p className="text-sm font-extrabold text-ink">
                    {formatRupees(order.total)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {confirming ? (
                    <span className="text-[11px] font-bold text-violet-600">
                      Awaiting confirmation
                    </span>
                  ) : editable ? (
                    <button
                      type="button"
                      disabled={working}
                      onClick={() => {
                        setError(null);
                        setAddingTo(order);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-sea-200 bg-sea-50 px-4 py-2 text-xs font-bold text-sea-600 transition hover:bg-sea-100 disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add items
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => reorder(order)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-sea-500 px-4 py-2 text-xs font-bold text-white shadow-soft transition hover:bg-sea-600"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reorder
                    </button>
                  )}
                </div>
              </div>

              {editable && (
                <p className="mt-2 text-center text-[10px] text-muted">
                  You can change this order until it&apos;s marked delivered.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {addingTo && (
        <AddItemsModal
          order={addingTo}
          onClose={() => setAddingTo(null)}
          onAdd={(productId, qty) => apply(addingTo, productId, qty)}
        />
      )}
    </>
  );
}

function AddItemsModal({
  order,
  onClose,
  onAdd,
}: {
  order: StoreOrder;
  onClose: () => void;
  onAdd: (productId: string, qty: number) => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  // How many of each product we've added in this modal session, so repeated
  // taps accumulate even though the server data refreshes between clicks.
  const [added, setAdded] = useState<Record<string, number>>({});

  const baseQty = (id: string) =>
    order.items.find((it) => it.productId === id)?.qty ?? 0;

  async function add(id: string) {
    const next = (added[id] ?? 0) + 1;
    setAdded((a) => ({ ...a, [id]: next }));
    await onAdd(id, baseQty(id) + next);
  }

  async function run(value: string) {
    setQ(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/products/search?q=${encodeURIComponent(value)}`,
      );
      const json = (await res.json()) as { results: SearchHit[] };
      setResults(json.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-end bg-ink/50 backdrop-blur-sm sm:place-items-center sm:px-5"
      onClick={onClose}
    >
      <div
        className="animate-fade-up w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-ink">
            Add to PH-{order.orderNo}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-hairline/60 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-hairline px-3 py-2.5 focus-within:border-sea-400 focus-within:ring-2 focus-within:ring-sea-200">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => run(e.target.value)}
            placeholder="Search medicines & products"
            className="w-full text-sm text-ink outline-none placeholder:text-muted/70"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-sea-500" />}
        </div>

        <div className="mt-3 max-h-[50vh] space-y-1.5 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => add(r.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-hairline p-2.5 text-left transition hover:bg-sea-50/50"
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg"
                style={{ backgroundColor: r.tint }}
              >
                {r.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.imageUrl}
                    alt={r.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ink">
                  {r.name}
                </span>
                <span className="block text-[11px] text-muted">{r.brand}</span>
              </span>
              <span className="shrink-0 text-[13px] font-bold text-ink">
                {formatRupees(r.price)}
              </span>
              <Plus className="h-4 w-4 shrink-0 text-sea-500" />
            </button>
          ))}
          {q.trim() && !loading && results.length === 0 && (
            <p className="py-6 text-center text-[13px] text-muted">
              No products found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
