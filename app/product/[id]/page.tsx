import Link from "next/link";
import { Star, ShieldCheck, Truck, Check } from "lucide-react";
import { getProductById, getProductsByCategory } from "@/lib/data";
import { getCategory } from "@/lib/products";
import { formatRupees, discountPercent } from "@/lib/format";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { AddToCart } from "@/components/AddToCart";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ProductRail } from "@/components/ProductRail";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return (
      <div className="mx-auto w-full max-w-[1200px]">
        <Header variant="inner" title="Product" />
        <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
          <p className="text-lg font-bold text-ink">Product not found</p>
          <Link
            href="/products"
            className="rounded-xl bg-sea-500 px-5 py-2.5 text-sm font-bold text-white"
          >
            Browse products
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const off = discountPercent(product.mrp, product.price);
  const category = getCategory(product.category);
  const related = (await getProductsByCategory(product.category))
    .filter((p) => p.id !== product.id)
    .slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <Header variant="inner" title={category?.name ?? "Product"} />

      <main className="pb-28 md:pb-16">
        <div className="md:grid md:grid-cols-2 md:gap-10 md:px-6 md:pt-6">
          {/* Image */}
          <div className="px-4 pt-4 md:px-0 md:pt-0">
            <div
              className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-3xl md:aspect-[4/3]"
              style={{ backgroundColor: product.tint }}
            >
              {off > 0 && (
                <span className="absolute left-4 top-4 z-10 rounded-lg bg-leaf-500 px-2 py-1 text-xs font-bold text-white">
                  {off}% OFF
                </span>
              )}
              {product.rx && (
                <span className="absolute right-4 top-4 z-10 rounded-lg bg-white/85 px-2 py-1 text-xs font-bold text-sea-600">
                  Prescription
                </span>
              )}
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
                    className="h-28 w-28 text-ink/50"
                    strokeWidth={1.2}
                  />
                )
              )}
            </div>
          </div>

          {/* Info */}
          <div className="px-4 pt-5 md:px-0 md:pt-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-sea-600">
              {product.brand}
            </p>
            <h1 className="mt-1 text-xl font-extrabold leading-snug text-ink md:text-2xl">
              {product.name}
            </h1>
            <p className="mt-1 text-sm text-muted">{product.pack}</p>
            <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {product.rating}
              <span className="font-normal text-muted">· 100+ verified buyers</span>
            </div>

            <div className="mt-4 flex items-end gap-3">
              <span className="text-2xl font-extrabold text-ink">
                {formatRupees(product.price)}
              </span>
              {off > 0 && (
                <>
                  <span className="text-base text-muted line-through">
                    {formatRupees(product.mrp)}
                  </span>
                  <span className="rounded-md bg-leaf-400/15 px-1.5 py-0.5 text-sm font-bold text-leaf-500">
                    {off}% off
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted">Inclusive of all taxes</p>

            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {product.highlights.map((h) => (
                <li
                  key={h}
                  className="flex items-center gap-2 rounded-xl border border-hairline bg-white px-3 py-2 text-xs font-medium text-ink-soft"
                >
                  <Check className="h-4 w-4 shrink-0 text-leaf-500" strokeWidth={3} />
                  {h}
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <h2 className="text-sm font-bold text-ink">About this product</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {product.description}
              </p>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-hairline bg-sea-50/60 px-4 py-3 text-sm">
              <Truck className="h-5 w-5 shrink-0 text-sea-500" />
              <span className="font-semibold text-ink">Free delivery</span>
              <span className="text-muted">on every order</span>
            </div>
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-hairline bg-white px-4 py-3 text-sm">
              <ShieldCheck className="h-5 w-5 shrink-0 text-leaf-500" />
              <span className="font-semibold text-ink">100% genuine</span>
              <span className="text-muted">sourced directly from manufacturers</span>
            </div>

            {/* Desktop add */}
            <div className="mt-6 hidden max-w-sm md:block">
              <AddToCart product={product} full />
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <ProductRail title="Similar products" products={related} />
        )}
      </main>

      {/* Mobile sticky add bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-white px-4 py-3 md:hidden">
        <div className="mx-auto flex max-w-[1200px] items-center gap-3">
          <div className="flex-1">
            <div className="text-lg font-extrabold text-ink">
              {formatRupees(product.price)}
            </div>
            {off > 0 && (
              <div className="text-[11px] text-muted">
                <span className="line-through">{formatRupees(product.mrp)}</span>{" "}
                · <span className="font-semibold text-leaf-500">{off}% off</span>
              </div>
            )}
          </div>
          <div className="w-44">
            <AddToCart product={product} full />
          </div>
        </div>
      </div>
    </div>
  );
}
