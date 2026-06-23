"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  IndianRupee,
  ShoppingBag,
  Package,
  AlertTriangle,
  ChevronRight,
  PackageCheck,
  RotateCcw,
} from "lucide-react";
import { formatRupees, formatShortDate } from "@/lib/format";
import { LOW_STOCK_THRESHOLD } from "@/lib/admin/types";
import { useAdmin } from "@/lib/admin/store";
import { Button, EmptyState, PageHeader, StatCard, StatusPill } from "./ui";

export function Dashboard() {
  const { data, reload, loading } = useAdmin();

  const stats = useMemo(() => {
    const orders = data.orders;
    const revenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((s, o) => s + o.total, 0);
    const pending = orders.filter(
      (o) =>
        o.status === "placed" ||
        o.status === "packed" ||
        o.status === "shipped",
    ).length;
    const active = data.products.filter((p) => p.active);
    const lowStock = active
      .filter((p) => p.stock <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.stock - b.stock);
    return {
      revenue,
      ordersCount: orders.length,
      pending,
      activeCount: active.length,
      totalProducts: data.products.length,
      lowStock,
    };
  }, [data]);

  const recent = data.orders.slice(0, 6);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="A quick look at how your store is doing."
        action={
          <Button
            variant="secondary"
            onClick={reload}
            disabled={loading}
            className="!px-3 !py-2 text-[13px]"
          >
            <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{" "}
            Refresh
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatRupees(stats.revenue)}
          icon={IndianRupee}
          hint={`from ${stats.ordersCount} orders`}
          tone="leaf"
        />
        <StatCard
          label="Orders"
          value={stats.ordersCount}
          icon={ShoppingBag}
          hint={`${stats.pending} to fulfill`}
          tone="sea"
        />
        <StatCard
          label="Products"
          value={stats.activeCount}
          icon={Package}
          hint={`${stats.totalProducts} total`}
          tone="sky"
        />
        <StatCard
          label="Low stock"
          value={stats.lowStock.length}
          icon={AlertTriangle}
          hint={`≤ ${LOW_STOCK_THRESHOLD} units`}
          tone="amber"
        />
      </div>

      {/* Recent orders + low stock */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {/* Recent orders */}
        <section className="rounded-2xl border border-hairline bg-white shadow-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3.5">
            <h2 className="text-sm font-extrabold text-ink">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-0.5 text-[13px] font-bold text-sea-600 hover:text-sea-700"
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="divide-y divide-hairline">
            {recent.map((o) => (
              <li key={o.id}>
                <Link
                  href="/admin/orders"
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-sea-50/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink">
                        {o.id}
                      </span>
                      <StatusPill status={o.status} />
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-muted">
                      {o.customer} · {formatShortDate(o.placedAt)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-extrabold text-ink">
                    {formatRupees(o.total)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Low stock */}
        <section className="rounded-2xl border border-hairline bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3.5">
            <h2 className="text-sm font-extrabold text-ink">Low stock</h2>
            <Link
              href="/admin/products"
              className="flex items-center gap-0.5 text-[13px] font-bold text-sea-600 hover:text-sea-700"
            >
              Manage <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {stats.lowStock.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={PackageCheck}
                title="All stocked up"
                message="No products are running low."
              />
            </div>
          ) : (
            <ul className="divide-y divide-hairline">
              {stats.lowStock.slice(0, 6).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">
                      {p.name}
                    </p>
                    <p className="truncate text-[12px] text-muted">{p.pack}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${
                      p.stock === 0
                        ? "bg-rose-50 text-rose-700 ring-rose-200"
                        : p.stock <= 5
                          ? "bg-rose-50 text-rose-600 ring-rose-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200"
                    }`}
                  >
                    {p.stock === 0 ? "Out" : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
