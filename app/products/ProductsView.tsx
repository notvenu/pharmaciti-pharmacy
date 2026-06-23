"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  SearchX,
  Pill,
  Droplets,
  Package,
  LayoutGrid,
  Citrus,
  Syringe,
  Bandage,
  Thermometer,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { ProductCard } from "@/components/ProductCard";
import { getCategory, type Product } from "@/lib/products";

const PHARMACY_SUBS: { id: string; name: string; Icon: LucideIcon }[] = [
  { id: "all", name: "All", Icon: LayoutGrid },
  { id: "tablets", name: "Tablets", Icon: Pill },
  { id: "syrups", name: "Syrups", Icon: Droplets },
  { id: "general", name: "General items", Icon: Package },
  { id: "vitamins", name: "Vitamins", Icon: Citrus },
  { id: "diabetes", name: "Diabetes Care", Icon: Syringe },
  { id: "pain-relief", name: "Pain Relief", Icon: Bandage },
  { id: "cold-cough", name: "Cold & Cough", Icon: Thermometer },
  { id: "skin-care", name: "Skin Care", Icon: Sparkles },
];

function matches(p: Product, q: string): boolean {
  if (!q) return true;
  return [p.name, p.brand, p.category, p.description]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function ProductsView({ products }: { products: Product[] }) {
  const params = useSearchParams();
  const qParam = params.get("q") ?? "";
  const catParam = params.get("cat") ?? "all";

  const [q, setQ] = useState(qParam);
  const [cat, setCat] = useState(catParam);
  const [sub, setSub] = useState("all");

  // Re-sync local state when the URL params change. This is the React-blessed
  // "adjust state while rendering" pattern (no effect, no cascading render):
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [urlSeen, setUrlSeen] = useState({ q: qParam, cat: catParam });
  if (urlSeen.q !== qParam || urlSeen.cat !== catParam) {
    if (urlSeen.cat !== catParam) setSub("all");
    setUrlSeen({ q: qParam, cat: catParam });
    setQ(qParam);
    setCat(catParam);
  }

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    let filtered = products.filter((p) => matches(p, query));
    if (cat !== "all") filtered = filtered.filter((p) => p.category === cat);
    if (cat === "pharmacy" && sub !== "all") {
      filtered = filtered.filter((p) => p.subcategory === sub);
    }
    return filtered;
  }, [products, q, cat, sub]);

  let heading = "All Products";
  if (cat === "pharmacy" && sub !== "all") {
    heading = PHARMACY_SUBS.find((s) => s.id === sub)?.name ?? "Pharmacy";
  } else if (cat !== "all") {
    heading = getCategory(cat)?.name ?? "Shop";
  } else if (q) {
    heading = `Results for “${q}”`;
  }

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <Header variant="inner" title="Shop" />

      <main className="px-4 pb-28 pt-3 md:px-6 md:pb-16">
        {/* Mobile-only: the inner header has no search bar, so the page provides
            one. On md+ the global header search is shown instead (avoids two
            search bars side by side). */}
        <div className="search-glow flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 transition md:hidden">
          <Search className="h-5 w-5 text-sea-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search medicines & health products"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
        </div>

        {cat === "pharmacy" && (
          <div className="no-scrollbar mt-4 flex gap-4 overflow-x-auto pb-1">
            {PHARMACY_SUBS.map(({ id, name, Icon }) => {
              const isActive = sub === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSub(id)}
                  aria-pressed={isActive}
                  className="group flex shrink-0 flex-col items-center gap-1.5"
                >
                  <span
                    className={`grid h-14 w-14 place-items-center rounded-full border transition ${
                      isActive
                        ? "border-sea-500 bg-sea-500 text-white shadow-soft"
                        : "border-hairline bg-sea-50 text-sea-600 group-hover:border-sea-300"
                    }`}
                  >
                    <Icon className="h-6 w-6" strokeWidth={1.9} />
                  </span>
                  <span
                    className={`text-[11px] font-semibold leading-tight ${
                      isActive ? "text-sea-600" : "text-ink-soft"
                    }`}
                  >
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <h1 className="text-lg font-bold text-ink md:text-xl">{heading}</h1>
          <span className="text-xs font-medium text-muted">
            {results.length} item{results.length === 1 ? "" : "s"}
          </span>
        </div>

        {results.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <SearchX className="h-10 w-10 text-sea-300" />
            <p className="text-base font-bold text-ink">No products found</p>
            <p className="max-w-xs text-sm text-muted">
              Try a different search or pick another category.
            </p>
            <button
              onClick={() => {
                setQ("");
                setCat("all");
                setSub("all");
              }}
              className="rounded-xl bg-sea-500 px-5 py-2.5 text-sm font-bold text-white"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
