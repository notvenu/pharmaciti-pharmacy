"use client";

import { useMemo, useState } from "react";
import {
  Phone,
  MapPin,
  CreditCard,
  Wallet,
  Calendar,
  ChevronRight,
  PackageSearch,
} from "lucide-react";
import { formatRupees, formatShortDate } from "@/lib/format";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  type OrderStatus,
} from "@/lib/admin/types";
import { useAdmin } from "@/lib/admin/store";
import {
  Drawer,
  EmptyState,
  Field,
  PageHeader,
  Select,
  StatusPill,
} from "./ui";

type Filter = "all" | OrderStatus;

export function OrdersAdmin() {
  const { data, updateOrderStatus } = useAdmin();
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data.orders.length };
    for (const s of ORDER_STATUSES) c[s] = 0;
    for (const o of data.orders) c[o.status]++;
    return c;
  }, [data.orders]);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? data.orders
        : data.orders.filter((o) => o.status === filter),
    [data.orders, filter],
  );

  // Read the live order so status edits reflect in the open drawer.
  const active = openId
    ? data.orders.find((o) => o.id === openId) ?? null
    : null;

  const TABS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    ...ORDER_STATUSES.map((s) => ({ key: s, label: ORDER_STATUS_LABEL[s] })),
  ];

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle={`${data.orders.length} orders received`}
      />

      {/* Status tabs */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {TABS.map(({ key, label }) => {
          const on = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold transition ${
                on
                  ? "bg-sea-500 text-white shadow-soft"
                  : "border border-hairline bg-white text-ink-soft hover:bg-sea-50/60"
              }`}
            >
              {label}
              <span
                className={`rounded-full px-1.5 text-[11px] ${
                  on ? "bg-white/25 text-white" : "bg-hairline/70 text-muted"
                }`}
              >
                {counts[key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No orders here"
          message="There are no orders with this status yet."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setOpenId(o.id)}
              className="flex items-center gap-3 rounded-2xl border border-hairline bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-ink">
                    PH-{o.orderNo}
                  </span>
                  <StatusPill status={o.status} />
                </div>
                <p className="mt-1 truncate text-[13px] font-semibold text-ink-soft">
                  {o.customer}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-muted">
                  {o.items.length} item{o.items.length > 1 ? "s" : ""} ·{" "}
                  {o.paymentMethod} · {formatShortDate(o.placedAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="text-sm font-extrabold text-ink">
                  {formatRupees(o.total)}
                </span>
                <ChevronRight className="h-4 w-4 text-muted" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      <Drawer
        open={!!active}
        onClose={() => setOpenId(null)}
        title={active ? `Order PH-${active.orderNo}` : "Order"}
      >
        {active && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <StatusPill status={active.status} />
              <span className="text-lg font-extrabold text-ink">
                {formatRupees(active.total)}
              </span>
            </div>

            {/* Status changer */}
            <Field label="Update status">
              <Select
                value={active.status}
                onChange={(e) =>
                  updateOrderStatus(active.id, e.target.value as OrderStatus)
                }
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>

            {/* Customer */}
            <div className="rounded-2xl border border-hairline bg-sea-50/30 p-4">
              <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-muted">
                Customer
              </h3>
              <p className="mt-2 text-sm font-bold text-ink">
                {active.customer}
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-[13px] text-ink-soft">
                <Phone className="h-4 w-4 shrink-0 text-muted" />
                {active.phone}
              </p>
              <p className="mt-1.5 flex items-start gap-2 text-[13px] text-ink-soft">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                {active.address}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-ink-soft">
                <span className="flex items-center gap-2">
                  {active.paymentMethod === "COD" ? (
                    <Wallet className="h-4 w-4 text-muted" />
                  ) : (
                    <CreditCard className="h-4 w-4 text-muted" />
                  )}
                  {active.paymentMethod === "COD"
                    ? "Cash on delivery"
                    : "Paid online"}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted" />
                  {formatShortDate(active.placedAt)}
                </span>
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="mb-2 text-[13px] font-extrabold uppercase tracking-wide text-muted">
                Items
              </h3>
              <ul className="divide-y divide-hairline rounded-2xl border border-hairline">
                {active.items.map((it) => (
                  <li
                    key={it.productId}
                    className="flex items-center gap-3 px-3.5 py-3"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-sea-50 text-[12px] font-extrabold text-sea-600">
                      {it.qty}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">
                        {it.name}
                      </p>
                      <p className="text-[12px] text-muted">
                        {formatRupees(it.price)} each
                      </p>
                    </div>
                    <span className="shrink-0 text-[13px] font-bold text-ink">
                      {formatRupees(it.price * it.qty)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-ink px-4 py-3 text-white">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-base font-extrabold">
                  {formatRupees(active.total)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
