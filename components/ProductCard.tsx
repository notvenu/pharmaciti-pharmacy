import Link from "next/link";
import { Star } from "lucide-react";
import { getCategory, type Product } from "@/lib/products";
import { formatRupees, discountPercent } from "@/lib/format";
import { CategoryIcon } from "@/components/CategoryIcon";
import { AddToCart } from "@/components/AddToCart";

export function ProductCard({ product }: { product: Product }) {
  const off = discountPercent(product.mrp, product.price);
  const category = getCategory(product.category);

  return (
    <article className="group flex h-full w-full flex-col rounded-2xl border border-hairline bg-white p-2 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/product/${product.id}`} className="flex flex-1 flex-col">
        <div
          className="relative mb-2 grid aspect-[4/3] place-items-center overflow-hidden rounded-xl"
          style={{ backgroundColor: product.tint }}
        >
          {off > 0 && (
            <span className="absolute left-2 top-2 z-10 rounded-md bg-leaf-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {off}% OFF
            </span>
          )}
          {product.rx && (
            <span className="absolute right-2 top-2 z-10 rounded bg-white/85 px-1.5 py-0.5 text-[9px] font-bold text-sea-600">
              Rx
            </span>
          )}
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
            />
          ) : (
            category && (
              <CategoryIcon
                iconKey={category.iconKey}
                className="h-12 w-12 text-ink/60 transition group-hover:scale-110"
                strokeWidth={1.4}
              />
            )
          )}
        </div>

        <div className="flex flex-1 flex-col px-0.5">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink">
            {product.name}
          </h3>
          <p className="mt-0.5 text-[11px] text-muted">{product.pack}</p>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-muted">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {product.rating}
          </div>
        </div>
      </Link>

      <div className="mt-auto flex items-end justify-between px-0.5 pt-2.5">
        <div>
          <div className="text-[15px] font-extrabold text-ink">
            {formatRupees(product.price)}
          </div>
          {off > 0 && (
            <div className="text-[11px] text-muted">
              <span className="line-through">{formatRupees(product.mrp)}</span>{" "}
              <span className="font-semibold text-leaf-500">{off}% off</span>
            </div>
          )}
        </div>
        <AddToCart product={product} />
      </div>
    </article>
  );
}
