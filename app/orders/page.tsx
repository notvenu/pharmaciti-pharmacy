import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { getUser } from "@/lib/auth";
import { getMyOrders } from "@/lib/data";
import { OrdersView } from "./OrdersView";

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
            Your order history appears here once you sign in.
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
        <OrdersView orders={orders} />
      </main>
      <BottomNav />
    </div>
  );
}
