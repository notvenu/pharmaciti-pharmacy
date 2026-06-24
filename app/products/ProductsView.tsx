"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  ChevronRight,
  Check,
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
  const [subOpen, setSubOpen] = useState(false);
  const subMenuRef = useRef<HTMLDivElement>(null);

  // Close the category dropdown on outside click or Escape.
  useEffect(() => {
    if (!subOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!subMenuRef.current?.contains(e.target as Node)) setSubOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSubOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [subOpen]);

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

        {cat === "pharmacy" &&
          (() => {
            const current =
              PHARMACY_SUBS.find((s) => s.id === sub) ?? PHARMACY_SUBS[0];
            const CurrentIcon = current.Icon;
            return (
              <div ref={subMenuRef} className="relative z-30 -ml-4 mt-4 md:-ml-6">
                {/* Collapsed control: a small tab hugging the screen's left
                    edge — just the active category icon + an arrow. Everything
                    else stays hidden until you tap it open. */}
                <button
                  type="button"
                  onClick={() => setSubOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={subOpen}
                  aria-label="Choose category"
                  className={`relative z-10 flex w-fit items-center gap-1.5 rounded-r-2xl border border-l-0 bg-white py-2 pl-3 pr-2.5 shadow-card transition ${
                    subOpen
                      ? "border-sea-300"
                      : "border-hairline hover:border-sea-300"
                  }`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sea-500 text-white">
                    <CurrentIcon className="h-5 w-5" strokeWidth={1.9} />
                  </span>
                  <ChevronRight
                    className={`h-4 w-4 text-muted transition-transform duration-200 ${
                      subOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {/* Dropdown: slides straight down — icon + label rows. */}
                {subOpen && (
                  <div
                    role="listbox"
                    className="animate-slide-down absolute left-4 top-full z-30 mt-2 w-60 overflow-hidden rounded-2xl border border-hairline bg-white shadow-lg md:left-6"
                  >
                    {PHARMACY_SUBS.map(({ id, name, Icon }) => {
                      const isActive = sub === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onClick={() => {
                            setSub(id);
                            setSubOpen(false);
                          }}
                          className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                            isActive ? "bg-sea-50" : "hover:bg-sea-50/70"
                          }`}
                        >
                          <span
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition ${
                              isActive
                                ? "border-sea-500 bg-sea-500 text-white"
                                : "border-hairline bg-sea-50 text-sea-600"
                            }`}
                          >
                            <Icon className="h-5 w-5" strokeWidth={1.9} />
                          </span>
                          <span
                            className={`text-[13px] font-semibold ${
                              isActive ? "text-sea-600" : "text-ink"
                            }`}
                          >
                            {id === "all" ? "All categories" : name}
                          </span>
                          {isActive && (
                            <Check className="ml-auto h-4 w-4 shrink-0 text-sea-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

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
