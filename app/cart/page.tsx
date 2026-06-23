"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trash2,
  ShoppingBag,
  Truck,
  ArrowRight,
  CheckCircle2,
  Tag,
  X,
  Loader2,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatRupees } from "@/lib/format";
import { Header } from "@/components/Header";
import { AddToCart } from "@/components/AddToCart";
import { CategoryIcon } from "@/components/CategoryIcon";
import { getCategory } from "@/lib/products";
import { createClient } from "@/lib/supabase/client";
import { placeOrder } from "@/lib/actions/orders";

export default function CartPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const { items, itemCount, subtotal, savings, removeItem, clear } = useCart();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [form, setForm] = useState({
    customer: "",
    phone: "",
    address: "",
    payment: "COD" as "COD" | "Online",
  });
  const [showCheckout, setShowCheckout] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedNo, setPlacedNo] = useState<number | null>(null);

  // Pull the signed-in user (if any) to gate checkout + prefill the form.
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setAuthed(true);
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .maybeSingle();
        setForm((f) => ({
          ...f,
          customer: profile?.full_name ?? f.customer,
          phone: profile?.phone ?? user.phone ?? f.phone,
        }));
      }
      setCheckingAuth(false);
    })();
  }, [supabase]);

  function startCheckout() {
    if (checkingAuth) return;
    if (!authed) {
      router.push("/login?next=/cart");
      return;
    }
    setError(null);
    setShowCheckout(true);
  }

  async function submitOrder() {
    if (!form.address.trim()) {
      setError("Please enter a delivery address.");
      return;
    }
    setPlacing(true);
    setError(null);
    const result = await placeOrder({
      items: items.map((it) => ({ id: it.product.id, qty: it.qty })),
      customer: form.customer,
      phone: form.phone,
      address: form.address,
      payment: form.payment,
    });
    setPlacing(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPlacedNo(result.orderNo);
    setShowCheckout(false);
    clear();
  }

  if (placedNo !== null) {
    return (
      <div className="mx-auto w-full max-w-[1200px]">
        <Header variant="inner" title="Order placed" />
        <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
          <CheckCircle2 className="h-16 w-16 text-leaf-500" />
          <h1 className="text-xl font-extrabold text-ink">Order placed!</h1>
          <p className="max-w-sm text-sm text-muted">
            Your order{" "}
            <span className="font-bold text-ink">PH-{placedNo}</span> has been
            received. You can track it under My Orders.
          </p>
          <div className="mt-3 flex gap-3">
            <Link
              href="/orders"
              className="rounded-xl bg-sea-500 px-5 py-2.5 text-sm font-bold text-white"
            >
              View my orders
            </Link>
            <Link
              href="/products"
              className="rounded-xl border border-hairline px-5 py-2.5 text-sm font-bold text-ink"
            >
              Keep shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1200px]">
        <Header variant="inner" title="Your Cart" />
        <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-sea-50">
            <ShoppingBag className="h-9 w-9 text-sea-400" />
          </span>
          <h1 className="text-lg font-bold text-ink">Your cart is empty</h1>
          <p className="max-w-xs text-sm text-muted">
            Add medicines and health essentials to get started.
          </p>
          <Link
            href="/products"
            className="mt-1 rounded-xl bg-sea-500 px-6 py-3 text-sm font-bold text-white shadow-soft"
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  const deliveryFee = 0;
  const toPay = subtotal + deliveryFee;

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <Header variant="inner" title="Your Cart" />

      <main className="px-4 pb-36 pt-4 md:grid md:grid-cols-3 md:gap-6 md:px-6 md:pb-16">
        {/* Items */}
        <div className="md:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">
              {itemCount} item{itemCount === 1 ? "" : "s"} in cart
            </p>
            <button
              onClick={clear}
              className="text-xs font-semibold text-muted hover:text-sea-600"
            >
              Clear cart
            </button>
          </div>

          <div className="space-y-3">
            {items.map(({ product, lineTotal, lineMrp }) => {
              const category = getCategory(product.category);
              return (
                <div
                  key={product.id}
                  className="flex gap-3 rounded-2xl border border-hairline bg-white p-3 shadow-card"
                >
                  <Link
                    href={`/product/${product.id}`}
                    className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl"
                    style={{ backgroundColor: product.tint }}
                  >
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      category && (
                        <CategoryIcon
                          iconKey={category.iconKey}
                          className="h-9 w-9 text-ink/55"
                          strokeWidth={1.4}
                        />
                      )
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${product.id}`}
                        className="line-clamp-2 text-sm font-semibold leading-snug text-ink"
                      >
                        {product.name}
                      </Link>
                      <button
                        onClick={() => removeItem(product.id)}
                        aria-label="Remove item"
                        className="shrink-0 rounded-lg p-1 text-muted hover:bg-sea-50 hover:text-sea-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-[11px] text-muted">{product.pack}</p>

                    <div className="mt-auto flex items-end justify-between pt-2">
                      <div>
                        <span className="text-sm font-bold text-ink">
                          {formatRupees(lineTotal)}
                        </span>
                        {lineMrp > lineTotal && (
                          <span className="ml-1.5 text-xs text-muted line-through">
                            {formatRupees(lineMrp)}
                          </span>
                        )}
                      </div>
                      <AddToCart product={product} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 md:mt-0">
          <div className="md:sticky md:top-24">
            <div className="mb-3 flex items-center gap-2 rounded-2xl border border-hairline bg-white p-3 text-[12px] font-semibold text-ink shadow-card">
              <Truck className="h-4 w-4 shrink-0 text-sea-500" />
              No minimum order value · Free home delivery
            </div>

            <div className="rounded-2xl border border-hairline bg-white p-4 shadow-card">
              <h2 className="text-sm font-bold text-ink">Bill details</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <Row label="Item total (MRP)" value={formatRupees(subtotal + savings)} />
                <Row
                  label="Product discount"
                  value={`- ${formatRupees(savings)}`}
                  accent
                />
                <Row
                  label="Delivery fee"
                  value={deliveryFee === 0 ? "FREE" : formatRupees(deliveryFee)}
                  accent={deliveryFee === 0}
                />
                <div className="my-2 border-t border-dashed border-hairline" />
                <div className="flex items-center justify-between text-base font-extrabold text-ink">
                  <span>To pay</span>
                  <span>{formatRupees(toPay)}</span>
                </div>
              </dl>

              {savings > 0 && (
                <p className="mt-3 flex items-center gap-2 rounded-xl bg-leaf-400/15 px-3 py-2 text-xs font-bold text-leaf-500">
                  <Tag className="h-4 w-4" />
                  You save {formatRupees(savings)} on this order
                </p>
              )}

              <button
                onClick={startCheckout}
                disabled={checkingAuth}
                className="mt-4 hidden w-full items-center justify-center gap-2 rounded-xl bg-sea-500 py-3.5 text-sm font-bold text-white shadow-soft transition hover:bg-sea-600 disabled:opacity-60 md:flex"
              >
                Proceed to checkout <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-white px-4 py-3 md:hidden">
        <div className="mx-auto flex max-w-[1200px] items-center gap-3">
          <div className="flex-1">
            <div className="text-lg font-extrabold text-ink">
              {formatRupees(toPay)}
            </div>
            <div className="text-[11px] text-muted">
              {savings > 0
                ? `You save ${formatRupees(savings)}`
                : "Inclusive of all taxes"}
            </div>
          </div>
          <button
            onClick={startCheckout}
            disabled={checkingAuth}
            className="flex items-center gap-2 rounded-xl bg-sea-500 px-6 py-3 text-sm font-bold text-white shadow-soft active:scale-[0.98] disabled:opacity-60"
          >
            Checkout <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Checkout modal */}
      {showCheckout && (
        <div
          className="fixed inset-0 z-[80] grid place-items-end bg-ink/50 backdrop-blur-sm sm:place-items-center sm:px-5"
          onClick={() => !placing && setShowCheckout(false)}
        >
          <div
            className="animate-fade-up w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-ink">
                Delivery details
              </h2>
              <button
                type="button"
                onClick={() => !placing && setShowCheckout(false)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-hairline/60 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <Input
                label="Full name"
                value={form.customer}
                onChange={(v) => setForm((f) => ({ ...f, customer: v }))}
                placeholder="e.g. Aarav Sharma"
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                placeholder="+91 98765 43210"
              />
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-ink">
                  Delivery address
                </label>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="House no, street, area, city, PIN"
                  className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-sea-400 focus:ring-2 focus:ring-sea-200"
                />
              </div>
              <div>
                <span className="mb-1.5 block text-[13px] font-semibold text-ink">
                  Payment
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(["COD", "Online"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, payment: m }))}
                      className={`rounded-xl border py-2.5 text-sm font-bold transition ${
                        form.payment === m
                          ? "border-sea-500 bg-sea-50 text-sea-600"
                          : "border-hairline text-ink-soft hover:bg-sea-50/40"
                      }`}
                    >
                      {m === "COD" ? "Cash on delivery" : "Pay online"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[13px] font-semibold text-rose-600">
                {error}
              </p>
            )}

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-ink px-4 py-3 text-white">
              <span className="text-sm font-semibold">To pay</span>
              <span className="text-base font-extrabold">
                {formatRupees(toPay)}
              </span>
            </div>

            <button
              onClick={submitOrder}
              disabled={placing}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-sea-500 py-3.5 text-sm font-bold text-white shadow-soft transition hover:bg-sea-600 disabled:opacity-60"
            >
              {placing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Place order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={accent ? "font-semibold text-leaf-500" : "font-semibold text-ink"}>
        {value}
      </dd>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-ink">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-sea-400 focus:ring-2 focus:ring-sea-200"
      />
    </div>
  );
}
