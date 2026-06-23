import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  Banner,
  CategoryTile,
  IconKey,
  Product,
  SubcategoryKey,
} from "@/lib/products";
import type { Database, OrderStatusDb, PaymentMethodDb } from "@/lib/supabase/types";

/**
 * Server-only data access layer (DAL). Every storefront read goes through here.
 * Reads use the request-scoped Supabase client, so Row Level Security decides
 * what each visitor can see (anon → only active products / tiles / banners).
 */

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type BannerRow = Database["public"]["Tables"]["banners"]["Row"];

function mapProduct(r: ProductRow): Product {
  return {
    id: r.id,
    name: r.name,
    brand: r.brand,
    category: r.category,
    subcategory: (r.subcategory as SubcategoryKey | null) ?? undefined,
    pack: r.pack,
    price: r.price,
    mrp: r.mrp,
    rx: r.rx,
    tag: r.tag ?? undefined,
    rating: Number(r.rating),
    description: r.description,
    highlights: r.highlights ?? [],
    tint: r.tint,
    imageUrl: r.image_url ?? undefined,
  };
}

function mapTile(r: CategoryRow): CategoryTile {
  return {
    id: r.id,
    name: r.name,
    iconKey: r.icon_key as IconKey,
    href: r.href,
    imageUrl: r.image_url ?? undefined,
  };
}

function mapBanner(r: BannerRow): Banner {
  return {
    id: r.id,
    badge: r.badge,
    titleTop: r.title_top,
    titleBottom: r.title_bottom,
    subtitle: r.subtitle,
    ctaLabel: r.cta_label,
    ctaHref: r.cta_href,
  };
}

const discountRank = (p: Product) => (p.mrp - p.price) / (p.mrp || 1);

/** All products visible to the current viewer, in catalogue order. */
export async function getActiveProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []).map(mapProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? mapProduct(data) : null;
}

export async function getProductsByCategory(
  categoryId: string,
): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("category", categoryId)
    .order("sort_order", { ascending: true });
  return (data ?? []).map(mapProduct);
}

export async function getBestsellers(): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("tag", "Bestseller")
    .order("sort_order", { ascending: true });
  return (data ?? []).map(mapProduct);
}

export async function getDealsOfTheDay(limit = 8): Promise<Product[]> {
  const products = await getActiveProducts();
  return [...products].sort((a, b) => discountRank(b) - discountRank(a)).slice(0, limit);
}

/** Used by the search Route Handler (typeahead) and the products page. */
export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim();
  const supabase = await createClient();
  if (!q) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true });
    return (data ?? []).map(mapProduct);
  }
  // Strip characters that are significant in PostgREST filter syntax so user
  // input can't break out of (or extend) the OR filter.
  const safe = q.replace(/[,.()%:*\\]/g, " ").trim();
  if (!safe) return [];
  const like = `%${safe}%`;
  const { data } = await supabase
    .from("products")
    .select("*")
    .or(`name.ilike.${like},brand.ilike.${like},description.ilike.${like}`)
    .order("sort_order", { ascending: true });
  return (data ?? []).map(mapProduct);
}

export async function getCategoryTiles(): Promise<CategoryTile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []).map(mapTile);
}

export async function getActiveBanners(): Promise<Banner[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("banners")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []).map(mapBanner);
}

/* ── Orders (customer-facing) ──────────────────────────────────────────── */

export type StoreOrderItem = { productId: string | null; name: string; qty: number };
export type StoreOrder = {
  id: string;
  orderNo: number;
  status: OrderStatusDb;
  paymentMethod: PaymentMethodDb;
  total: number;
  placedAt: string; // YYYY-MM-DD
  items: StoreOrderItem[];
};

type OrderWithItemsRow = {
  id: string;
  order_no: number;
  status: OrderStatusDb;
  payment_method: PaymentMethodDb;
  total: number;
  placed_at: string;
  order_items: { product_id: string | null; name: string; qty: number }[] | null;
};

/** Orders belonging to the signed-in user (RLS enforces ownership). */
export async function getMyOrders(): Promise<StoreOrder[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, order_no, status, payment_method, total, placed_at, order_items(product_id, name, qty)")
    .order("placed_at", { ascending: false });

  const rows = (data ?? []) as unknown as OrderWithItemsRow[];
  return rows.map((o) => ({
    id: o.id,
    orderNo: o.order_no,
    status: o.status,
    paymentMethod: o.payment_method,
    total: o.total,
    placedAt: (o.placed_at ?? "").slice(0, 10),
    items: (o.order_items ?? []).map((it) => ({
      productId: it.product_id,
      name: it.name,
      qty: it.qty,
    })),
  }));
}
