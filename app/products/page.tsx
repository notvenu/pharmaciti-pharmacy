import { Suspense } from "react";
import { getActiveProducts } from "@/lib/data";
import { ProductsView } from "./ProductsView";

export default async function ProductsPage() {
  const products = await getActiveProducts();

  return (
    <Suspense
      fallback={<div className="p-16 text-center text-muted">Loading…</div>}
    >
      <ProductsView products={products} />
    </Suspense>
  );
}
