"use client";

import { Minus, Plus } from "lucide-react";
import { useCart, type CartProduct } from "@/context/CartContext";

type Props = {
  product: CartProduct;
  full?: boolean;
};

export function AddToCart({ product, full = false }: Props) {
  const { qtyOf, addItem, decrement } = useCart();
  const qty = qtyOf(product.id);

  // Cards wrap their content in a <Link>; stop the click from navigating.
  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          addItem(product);
        }}
        className={
          full
            ? "flex w-full items-center justify-center gap-2 rounded-xl bg-sea-500 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-soft transition hover:bg-sea-600 active:scale-[0.99]"
            : "rounded-lg border border-sea-500 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-sea-600 transition hover:bg-sea-50 active:scale-95"
        }
      >
        {full && <Plus className="h-4 w-4" strokeWidth={3} />}
        Add
      </button>
    );
  }

  return (
    <div
      onClick={stop}
      className={
        full
          ? "flex w-full items-center justify-between rounded-xl bg-sea-500 px-2 py-1.5 text-white shadow-soft"
          : "flex items-center gap-1 rounded-lg border border-sea-500 bg-sea-500 text-white"
      }
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={(e) => {
          stop(e);
          decrement(product.id);
        }}
        className={
          full
            ? "grid h-9 w-10 place-items-center rounded-lg transition hover:bg-white/15"
            : "grid h-7 w-7 place-items-center transition hover:bg-white/15"
        }
      >
        <Minus className="h-4 w-4" strokeWidth={3} />
      </button>
      <span
        className={
          full ? "text-base font-bold" : "min-w-5 text-center text-sm font-bold"
        }
      >
        {qty}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={(e) => {
          stop(e);
          addItem(product);
        }}
        className={
          full
            ? "grid h-9 w-10 place-items-center rounded-lg transition hover:bg-white/15"
            : "grid h-7 w-7 place-items-center transition hover:bg-white/15"
        }
      >
        <Plus className="h-4 w-4" strokeWidth={3} />
      </button>
    </div>
  );
}
