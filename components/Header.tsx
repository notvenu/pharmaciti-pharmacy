"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Logo } from "@/components/Logo";
import { SearchBox } from "@/components/SearchBox";

type Props = {
  variant?: "home" | "inner";
  title?: string;
};

function CartBadge({ count, light }: { count: number; light?: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={`absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold ${
        light ? "bg-white text-sea-600" : "bg-sea-500 text-white"
      }`}
    >
      {count}
    </span>
  );
}

export function Header({ variant = "home", title }: Props) {
  const router = useRouter();
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-40">
      {/* ---------- Mobile ---------- */}
      <div className="md:hidden">
        {variant === "home" ? (
          <div className="bg-app-header px-4 pb-4 pt-4">
            <div className="flex items-center gap-2">
              <Logo variant="brand" className="shrink-0" />
              <Link
                href="/profile"
                aria-label="Profile"
                className="ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/70 shadow-sm"
              >
                <User className="h-5 w-5 text-ink" />
              </Link>
            </div>

            <SearchBox
              className="mt-3.5"
              placeholder="Search for medicines & health products"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 border-b border-hairline bg-white px-3 py-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-sea-50"
            >
              <ChevronLeft className="h-5 w-5 text-ink" />
            </button>
            <h1 className="flex-1 truncate text-base font-bold text-ink">
              {title ?? "Pharmaciti"}
            </h1>
            <Link
              href="/profile"
              aria-label="Profile"
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-sea-50"
            >
              <User className="h-5 w-5 text-ink" />
            </Link>
          </div>
        )}
      </div>

      {/* ---------- Desktop ---------- */}
      <div className="hidden border-b border-hairline bg-white/90 backdrop-blur md:block">
        <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-6 py-3">
          <Link href="/" className="shrink-0">
            <Logo variant="brand" />
          </Link>
          <SearchBox
            className="max-w-2xl flex-1"
            placeholder="Search for medicines, wellness, lab tests…"
          />
          <nav className="flex items-center gap-5 text-sm font-semibold text-ink-soft">
            <Link href="/products" className="hover:text-sea-600">
              Shop
            </Link>
            <Link href="/products?cat=lab-tests" className="hover:text-sea-600">
              Lab Tests
            </Link>
          </nav>
          <Link
            href="/profile"
            aria-label="Profile"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-sea-50"
          >
            <User className="h-5 w-5 text-ink-soft" />
          </Link>
          <Link
            href="/cart"
            className="relative flex items-center gap-2 rounded-xl bg-sea-500 px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-sea-600"
          >
            <ShoppingBag className="h-4 w-4" />
            Cart
            <CartBadge count={itemCount} light />
          </Link>
        </div>
      </div>
    </header>
  );
}
