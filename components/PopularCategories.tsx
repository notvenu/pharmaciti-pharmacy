import Link from "next/link";
import type { CategoryTile } from "@/lib/products";
import { CategoryIcon } from "@/components/CategoryIcon";

export function PopularCategories({ tiles }: { tiles: CategoryTile[] }) {
  if (tiles.length === 0) return null;

  return (
    <section className="px-4 pt-4 md:px-6">
      {/* Themed header band */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#fde9cf] via-[#fdf1e3] to-transparent px-5 pb-3 pt-6 text-center">
        <span className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/40" />
        <h2 className="relative text-2xl font-black tracking-tight text-sea-600 md:text-3xl">
          Shop by Category
        </h2>
        <p className="relative mt-1 text-sm font-medium text-ink-soft md:text-base">
          Everything for your family&apos;s health, in one place
        </p>
      </div>

      {/* Card grid */}
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {tiles.map((c) => (
          <Link key={c.id} href={c.href} className="group flex flex-col items-center">
            <div className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#fce7cf] to-[#f8d3ad] shadow-card transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
              {c.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
                />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-full bg-white/85 shadow-sm transition group-hover:scale-105 md:h-16 md:w-16">
                  <CategoryIcon
                    iconKey={c.iconKey}
                    className="h-7 w-7 text-sea-600 md:h-8 md:w-8"
                    strokeWidth={1.8}
                  />
                </span>
              )}
            </div>
            <span className="mt-2 text-center text-[12px] font-semibold leading-tight text-ink md:text-[13px]">
              {c.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
