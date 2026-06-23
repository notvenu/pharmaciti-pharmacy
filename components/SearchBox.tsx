"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type Props = {
  placeholder: string;
  className?: string;
};

type Suggestion = {
  id: string;
  name: string;
  brand: string;
  price: number;
  tint: string;
  imageUrl?: string | null;
};

/**
 * Search input with a live typeahead dropdown. Suggestions are fetched from the
 * `/api/products/search` Route Handler (debounced) so we never ship the whole
 * catalogue to the client. Enter routes to the products page; a suggestion
 * routes straight to that product.
 */
export function SearchBox({ placeholder, className }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced fetch of typeahead suggestions. All setState happens inside the
  // async callback (never synchronously in the effect body).
  useEffect(() => {
    const query = q.trim();
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      if (query.length < 1) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(query)}`,
          { signal: ctrl.signal },
        );
        const json = (await res.json()) as { results: Suggestion[] };
        setSuggestions(json.results ?? []);
      } catch {
        /* aborted or offline — keep previous suggestions */
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const go = (href: string) => {
    setQ("");
    setFocused(false);
    router.push(href);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    go(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : "/products");
  };

  const open = focused && q.trim().length > 0;

  return (
    <div className={`relative ${className ?? ""}`}>
      <form onSubmit={submit}>
        <div className="search-glow flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 transition md:py-2.5">
          <Search className="h-5 w-5 shrink-0 text-sea-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              blurTimer.current = setTimeout(() => setFocused(false), 120);
            }}
            placeholder={placeholder}
            aria-label="Search products"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
        </div>
      </form>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-hairline bg-white shadow-xl">
          {suggestions.length > 0 ? (
            <ul className="max-h-[60vh] overflow-y-auto py-1">
              {suggestions.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go(`/product/${p.id}`)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-sea-50"
                  >
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg text-xs font-bold text-ink-soft"
                      style={{ background: p.tint }}
                    >
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        p.name.slice(0, 1)
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {p.name}
                      </span>
                      <span className="block truncate text-[11px] text-muted">
                        {p.brand} · ₹{p.price}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              <li className="border-t border-hairline">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    go(`/products?q=${encodeURIComponent(q.trim())}`)
                  }
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] font-semibold text-sea-600 transition hover:bg-sea-50"
                >
                  <Search className="h-4 w-4 shrink-0" />
                  See all results for “{q.trim()}”
                </button>
              </li>
            </ul>
          ) : (
            <div className="px-4 py-5 text-center text-[13px] text-muted">
              No matches for “{q.trim()}”
            </div>
          )}
        </div>
      )}
    </div>
  );
}
