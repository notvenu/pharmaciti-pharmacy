/**
 * Catalogue *types* and the fixed product taxonomy.
 *
 * The actual product/category/banner rows now live in Supabase (see
 * `lib/data.ts` for reads and `lib/actions/*` for writes). What stays here is
 * structural and never changes at runtime: the eight top-level product
 * categories (used to pick an icon + label for a product) and the shared types.
 */

export type IconKey =
  | "pill"
  | "flask"
  | "heart"
  | "sparkles"
  | "baby"
  | "paw"
  | "device"
  | "consult"
  | "women"
  | "men"
  | "skin"
  | "food"
  | "oral"
  | "hair"
  | "diabetes"
  | "cold"
  | "protein"
  | "homeopathy"
  | "firstaid"
  | "sexual"
  | "elderly"
  | "beauty"
  | "surgicals"
  | "mental";

export type Category = {
  id: string;
  name: string;
  iconKey: IconKey;
  badge?: string;
};

/** Editable "Shop by category" tile shown on the home page (DB-backed). */
export type CategoryTile = {
  id: string;
  name: string;
  iconKey: IconKey;
  href: string;
  /** Uploaded artwork; falls back to the icon when absent. */
  imageUrl?: string;
};

/** Editable home-page hero slide (DB-backed). */
export type Banner = {
  id: string;
  badge: string;
  titleTop: string;
  titleBottom: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

/** Pharmacy-only sub-categories shown as round sub-tabs on the products page */
export type SubcategoryKey =
  | "tablets"
  | "syrups"
  | "general"
  | "vitamins"
  | "diabetes"
  | "pain-relief"
  | "cold-cough"
  | "skin-care";

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: SubcategoryKey;
  pack: string;
  price: number;
  mrp: number;
  rx: boolean;
  tag?: string;
  rating: number;
  description: string;
  highlights: string[];
  tint: string; // pastel background for the product tile
  /** Uploaded product photo; falls back to the category icon when absent. */
  imageUrl?: string;
};

/** Top-level product categories. Fixed taxonomy — used for icon + name lookup. */
export const categories: Category[] = [
  { id: "pharmacy", name: "Medicines", iconKey: "pill" },
  { id: "lab-tests", name: "Lab Tests", iconKey: "flask" },
  { id: "wellness", name: "Wellness", iconKey: "heart" },
  { id: "personal-care", name: "Personal Care", iconKey: "sparkles" },
  { id: "baby-care", name: "Baby Care", iconKey: "baby" },
  { id: "pet-care", name: "Pet Care", iconKey: "paw", badge: "NEW" },
  { id: "devices", name: "Devices", iconKey: "device" },
  { id: "consults", name: "Consults", iconKey: "consult" },
];

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
