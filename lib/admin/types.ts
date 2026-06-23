import type { IconKey, Product } from "@/lib/products";

/**
 * Admin-only data shapes. These extend the storefront types with fields the
 * shop doesn't need (stock, active flag, orders, etc.). Kept separate so the
 * public storefront types in `lib/products.ts` stay untouched.
 */

/** A product as seen by the admin: storefront fields + inventory controls. */
export type AdminProduct = Product & {
  stock: number;
  active: boolean;
};

export type OrderStatus =
  | "placed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
};

export type Order = {
  /** UUID primary key. */
  id: string;
  /** Human-friendly sequential number, shown as "PH-{orderNo}". */
  orderNo: number;
  customer: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: "COD" | "Online";
  /** ISO date string, e.g. "2026-06-21". */
  placedAt: string;
};

/** Editable "Shop by category" tile. */
export type AdminCategory = {
  id: string;
  name: string;
  iconKey: IconKey;
  href: string;
  imageUrl?: string;
};

/** Editable homepage hero slide (text + CTA only; artwork stays in code). */
export type Banner = {
  id: string;
  badge: string;
  titleTop: string;
  titleBottom: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

/** The full admin dataset, persisted as one blob in the demo store. */
export type AdminData = {
  products: AdminProduct[];
  orders: Order[];
  categories: AdminCategory[];
  banners: Banner[];
};

/** Stock at or below this count is flagged "low" across the admin UI. */
export const LOW_STOCK_THRESHOLD = 10;

export const ORDER_STATUSES: OrderStatus[] = [
  "placed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Placed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
