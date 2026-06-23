import { NextResponse, type NextRequest } from "next/server";
import { searchProducts } from "@/lib/data";

/**
 * Lightweight typeahead endpoint for the header search box. Reads through the
 * RLS-protected DAL (anon sees only active products) and returns just the
 * fields the dropdown needs.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });

  const products = await searchProducts(q);
  const results = products.slice(0, 6).map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    price: p.price,
    tint: p.tint,
    imageUrl: p.imageUrl ?? null,
  }));
  return NextResponse.json({ results });
}
