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

export type OrderStatus = "confirming" | "placed" | "delivered";

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
  /** Set when the order was built from a prescription. */
  prescriptionId?: string | null;
};

/** A doctor profile shown on the appointments page + managed in admin. */
export type Doctor = {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  fee: number;
  bio: string;
  imageUrl?: string;
  active: boolean;
  /** Weekly availability: weekday number ("0".."6") → open time ranges. */
  availability: Record<string, { start: string; end: string }[]>;
  /** Length of one appointment, in minutes. */
  slotMinutes: number;
  /** Blocked calendar dates ("YYYY-MM-DD"). */
  blockedDates: string[];
};

export type AppointmentStatus = "booked" | "completed" | "cancelled";

export type Appointment = {
  id: string;
  doctorId: string;
  doctorName: string;
  patientName: string;
  phone: string;
  slotDate: string;
  slotTime: string;
  note: string;
  status: AppointmentStatus;
  createdAt: string;
};

/** An uploaded prescription awaiting admin review. */
export type Prescription = {
  id: string;
  userId: string;
  filePath: string;
  note: string;
  status: "submitted" | "verified" | "rejected" | "fulfilled";
  createdAt: string;
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
  doctors: Doctor[];
  appointments: Appointment[];
  prescriptions: Prescription[];
};

/** Stock at or below this count is flagged "low" across the admin UI. */
export const LOW_STOCK_THRESHOLD = 10;

export const ORDER_STATUSES: OrderStatus[] = ["confirming", "placed", "delivered"];

/** Statuses an admin can set directly on the Orders screen (confirming orders
 * are advanced from the Prescriptions screen, where items are added). */
export const ORDER_STATUS_TRANSITIONS: OrderStatus[] = ["placed", "delivered"];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  confirming: "Confirming",
  placed: "Placed",
  delivered: "Delivered",
};
