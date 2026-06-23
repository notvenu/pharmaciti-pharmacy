import Link from "next/link";
import {
  CircleCheck,
  Truck,
  Clock,
  Package,
  XCircle,
  RotateCcw,
  ChevronRight,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { getUser } from "@/lib/auth";
import { getMyOrders } from "@/lib/data";
import { formatRupees, formatShortDate } from "@/lib/format";
import type { OrderStatusDb } from "@/lib/supabase/types";

const STATUS: Record<
  OrderStatusDb,
  { label: string; Icon: LucideIcon; tint: string }
> = {
  placed: { label: "Placed", Icon: Clock, tint: "bg-sea-50 text-sea-600" },
  packed: { label: "Packed", Icon: Package, tint: "bg-sky-100 text-sky-500" },
  shipped: { label: "Out for delivery", Icon: Truck, tint: "bg-sky-100 text-sky-500" },
  delivered: { label: "Delivered", Icon: CircleCheck, tint: "bg-[#eaf6ef] text-leaf-500" },
  cancelled: { label: "Cancelled", Icon: XCircle, tint: "bg-rose-50 text-rose-600" },
};

export default async function OrdersPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-[1200px]">
        <Header variant="inner" title="My Orders" />
        <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-sea-50">
            <ClipboardList className="h-9 w-9 text-sea-400" />
          </span>
          <h1 className="text-lg font-bold text-ink">Sign in to see your orders</h1>
          <p className="max-w-xs text-sm text-muted">
            Your order history and tracking appear here once you sign in.
          </p>
          <Link
            href="/login?next=/orders"
            className="mt-1 rounded-xl bg-sea-500 px-6 py-3 text-sm font-bold text-white shadow-soft"
          >
            Sign in
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const orders = await getMyOrders();

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <Header variant="inner" title="My Orders" />

      <main className="px-4 pb-36 pt-4 md:px-6 md:pb-16">
        {orders.length === 0 ? (
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
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const s = STATUS[order.status];
              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-hairline bg-white p-4 shadow-card"
                >
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

                  <ul className="mt-3 space-y-1">
                    {order.items.map((it, i) => (
                      <li
                        key={`${order.id}-${i}`}
                        className="flex items-center justify-between gap-3 text-[12px]"
                      >
                        <span className="min-w-0 truncate text-ink-soft">
                          {it.name}
                        </span>
                        <span className="shrink-0 text-muted">×{it.qty}</span>
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
                    {order.status === "delivered" ? (
                      <Link
                        href="/products"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-sea-500 px-4 py-2 text-xs font-bold text-white shadow-soft transition hover:bg-sea-600"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Buy again
                      </Link>
                    ) : (
                      <span className="text-[11px] font-semibold text-muted">
                        {s.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Link
          href="/products"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-hairline bg-white py-3 text-sm font-bold text-ink shadow-card transition hover:bg-sea-50/40"
        >
          Continue shopping
          <ChevronRight className="h-4 w-4 text-sea-500" />
        </Link>
      </main>

      <BottomNav />
    </div>
  );
}
