"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createAdminBrowserClient } from "@/lib/supabase/admin-browser";
import { provisionAdmin } from "@/lib/actions/auth";
import type { IconKey } from "@/lib/products";
import type {
  AdminCategory,
  AdminData,
  AdminProduct,
  Appointment,
  AppointmentStatus,
  Banner,
  Doctor,
  Order,
  OrderStatus,
  Prescription,
} from "./types";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  ADMIN STORE  ·  THE BACKEND SEAM (now wired to Supabase)
 *
 *  The admin UI talks to the data only through `useAdmin()`. This file loads
 *  everything from Supabase and writes back through the same client. Every
 *  write is gated by Row Level Security — only a signed-in user whose profile
 *  has role = 'admin' can mutate the catalogue or orders, so the database is
 *  the real authority, not this code.
 * ─────────────────────────────────────────────────────────────────────────
 */

const EMPTY: AdminData = {
  products: [],
  orders: [],
  categories: [],
  banners: [],
  doctors: [],
  appointments: [],
  prescriptions: [],
};

/** An item line the admin assembles when building an order from a prescription. */
export type OrderDraftItem = { id: string; qty: number };

type AdminValue = {
  /** False until the initial auth + data load has finished (avoids flashes). */
  hydrated: boolean;
  /** True while a (re)load of the dataset is in flight. */
  loading: boolean;
  data: AdminData;

  /* auth */
  signedIn: boolean;
  isAdmin: boolean;
  /** Sign in with the admin username + password. */
  signIn: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  /** Re-check the session + role. */
  refreshAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  reload: () => Promise<void>;

  /** Upload an image to the public `catalog` bucket; returns its public URL. */
  uploadImage: (
    file: File,
    folder: "products" | "categories",
  ) => Promise<{ url?: string; error?: string }>;

  /* products */
  addProduct: (p: AdminProduct) => Promise<void>;
  updateProduct: (id: string, patch: Partial<AdminProduct>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  /* orders */
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;

  /* categories */
  addCategory: (c: AdminCategory) => Promise<void>;
  updateCategory: (id: string, patch: Partial<AdminCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  /* banners */
  addBanner: (b: Banner) => Promise<void>;
  updateBanner: (id: string, patch: Partial<Banner>) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;

  /* doctors */
  addDoctor: (d: Doctor) => Promise<void>;
  updateDoctor: (id: string, patch: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;

  /* appointments */
  updateAppointmentStatus: (
    id: string,
    status: AppointmentStatus,
  ) => Promise<void>;

  /* prescriptions */
  updatePrescriptionStatus: (
    id: string,
    status: Prescription["status"],
  ) => Promise<void>;
  /** Signed, time-limited URL to view an uploaded prescription file. */
  prescriptionUrl: (filePath: string) => Promise<string | null>;
  /** Add items to the prescription's pending order and move it to 'placed'. */
  confirmPrescriptionOrder: (
    orderId: string,
    items: OrderDraftItem[],
  ) => Promise<{ ok: boolean; error?: string }>;
  /** Reject the prescription and remove its pending order. */
  rejectPrescription: (
    orderId: string,
  ) => Promise<{ ok: boolean; error?: string }>;
};

const AdminContext = createContext<AdminValue | null>(null);

export function genId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ── DB ⇄ admin shape mappers ──────────────────────────────────────────── */

type Row = Record<string, unknown>;

function mapProduct(r: Row): AdminProduct {
  return {
    id: r.id as string,
    name: r.name as string,
    brand: (r.brand as string) ?? "",
    category: r.category as string,
    subcategory: (r.subcategory as AdminProduct["subcategory"]) ?? undefined,
    pack: (r.pack as string) ?? "",
    price: r.price as number,
    mrp: r.mrp as number,
    rx: r.rx as boolean,
    tag: (r.tag as string) ?? undefined,
    rating: Number(r.rating),
    description: (r.description as string) ?? "",
    highlights: (r.highlights as string[]) ?? [],
    tint: r.tint as string,
    imageUrl: (r.image_url as string) ?? undefined,
    stock: r.stock as number,
    active: r.active as boolean,
  };
}

function productToRow(p: Partial<AdminProduct>): Row {
  const row: Row = {};
  const keys: (keyof AdminProduct)[] = [
    "id", "name", "brand", "category", "subcategory", "pack", "price", "mrp",
    "rx", "tag", "rating", "description", "highlights", "tint", "stock", "active",
  ];
  for (const k of keys) {
    if (p[k] === undefined) continue;
    row[k] = k === "subcategory" || k === "tag" ? (p[k] ?? null) : p[k];
  }
  if (p.imageUrl !== undefined) row.image_url = p.imageUrl ?? null;
  return row;
}

function mapCategory(r: Row): AdminCategory {
  return {
    id: r.id as string,
    name: r.name as string,
    iconKey: r.icon_key as IconKey,
    href: r.href as string,
    imageUrl: (r.image_url as string) ?? undefined,
  };
}

function categoryToRow(c: Partial<AdminCategory>): Row {
  const row: Row = {};
  if (c.id !== undefined) row.id = c.id;
  if (c.name !== undefined) row.name = c.name;
  if (c.iconKey !== undefined) row.icon_key = c.iconKey;
  if (c.href !== undefined) row.href = c.href;
  if (c.imageUrl !== undefined) row.image_url = c.imageUrl ?? null;
  return row;
}

function mapBanner(r: Row): Banner {
  return {
    id: r.id as string,
    badge: (r.badge as string) ?? "",
    titleTop: (r.title_top as string) ?? "",
    titleBottom: (r.title_bottom as string) ?? "",
    subtitle: (r.subtitle as string) ?? "",
    ctaLabel: (r.cta_label as string) ?? "Shop now",
    ctaHref: (r.cta_href as string) ?? "/products",
  };
}

function bannerToRow(b: Partial<Banner>): Row {
  const row: Row = {};
  if (b.id !== undefined) row.id = b.id;
  if (b.badge !== undefined) row.badge = b.badge;
  if (b.titleTop !== undefined) row.title_top = b.titleTop;
  if (b.titleBottom !== undefined) row.title_bottom = b.titleBottom;
  if (b.subtitle !== undefined) row.subtitle = b.subtitle;
  if (b.ctaLabel !== undefined) row.cta_label = b.ctaLabel;
  if (b.ctaHref !== undefined) row.cta_href = b.ctaHref;
  return row;
}

function mapOrder(r: Row): Order {
  const items = ((r.order_items as Row[]) ?? []).map((it) => ({
    productId: (it.product_id as string) ?? "",
    name: it.name as string,
    price: it.price as number,
    qty: it.qty as number,
  }));
  return {
    id: r.id as string,
    orderNo: r.order_no as number,
    customer: r.customer as string,
    phone: r.phone as string,
    address: r.address as string,
    items,
    total: r.total as number,
    status: r.status as OrderStatus,
    paymentMethod: r.payment_method as "COD" | "Online",
    placedAt: ((r.placed_at as string) ?? "").slice(0, 10),
    prescriptionId: (r.prescription_id as string) ?? null,
  };
}

function mapDoctor(r: Row): Doctor {
  return {
    id: r.id as string,
    name: r.name as string,
    specialization: (r.specialization as string) ?? "",
    qualification: (r.qualification as string) ?? "",
    experienceYears: (r.experience_years as number) ?? 0,
    fee: (r.fee as number) ?? 0,
    bio: (r.bio as string) ?? "",
    imageUrl: (r.image_url as string) ?? undefined,
    active: (r.active as boolean) ?? true,
    availability:
      (r.availability as Doctor["availability"]) ?? {},
    slotMinutes: (r.slot_minutes as number) ?? 30,
    blockedDates: (r.blocked_dates as string[]) ?? [],
  };
}

function doctorToRow(d: Partial<Doctor>): Row {
  const row: Row = {};
  if (d.id !== undefined) row.id = d.id;
  if (d.name !== undefined) row.name = d.name;
  if (d.specialization !== undefined) row.specialization = d.specialization;
  if (d.qualification !== undefined) row.qualification = d.qualification;
  if (d.experienceYears !== undefined) row.experience_years = d.experienceYears;
  if (d.fee !== undefined) row.fee = d.fee;
  if (d.bio !== undefined) row.bio = d.bio;
  if (d.imageUrl !== undefined) row.image_url = d.imageUrl ?? null;
  if (d.active !== undefined) row.active = d.active;
  if (d.availability !== undefined) row.availability = d.availability;
  if (d.slotMinutes !== undefined) row.slot_minutes = d.slotMinutes;
  if (d.blockedDates !== undefined) row.blocked_dates = d.blockedDates;
  return row;
}

function mapAppointment(r: Row): Appointment {
  const doctor = r.doctors as Row | null;
  return {
    id: r.id as string,
    doctorId: r.doctor_id as string,
    doctorName: (doctor?.name as string) ?? "Doctor",
    patientName: (r.patient_name as string) ?? "",
    phone: (r.phone as string) ?? "",
    slotDate: ((r.slot_date as string) ?? "").slice(0, 10),
    slotTime: (r.slot_time as string) ?? "",
    note: (r.note as string) ?? "",
    status: r.status as AppointmentStatus,
    createdAt: (r.created_at as string) ?? "",
  };
}

function mapPrescription(r: Row): Prescription {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    filePath: r.file_path as string,
    note: (r.note as string) ?? "",
    status: r.status as Prescription["status"],
    createdAt: (r.created_at as string) ?? "",
  };
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  // Dedicated admin client with its own (localStorage) session — independent of
  // the storefront's cookie session. Security is unaffected: RLS on the database
  // is what enforces admin-only access.
  const [supabase] = useState(() => createAdminBrowserClient());
  const [data, setData] = useState<AdminData>(EMPTY);
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [products, orders, categories, banners, doctors, appointments, prescriptions] =
      await Promise.all([
        supabase.from("products").select("*").order("sort_order"),
        supabase
          .from("orders")
          .select("*, order_items(product_id, name, price, qty)")
          .order("placed_at", { ascending: false }),
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("banners").select("*").order("sort_order"),
        supabase.from("doctors").select("*").order("sort_order"),
        supabase
          .from("appointments")
          .select("*, doctors(name)")
          .order("slot_date", { ascending: false }),
        supabase
          .from("prescriptions")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);
    setData({
      products: (products.data ?? []).map(mapProduct),
      orders: (orders.data ?? []).map(mapOrder),
      categories: (categories.data ?? []).map(mapCategory),
      banners: (banners.data ?? []).map(mapBanner),
      doctors: (doctors.data ?? []).map(mapDoctor),
      appointments: (appointments.data ?? []).map(mapAppointment),
      prescriptions: (prescriptions.data ?? []).map(mapPrescription),
    });
    setLoading(false);
  }, [supabase]);

  const refreshAuth = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSignedIn(false);
      setIsAdmin(false);
      setData(EMPTY);
      return;
    }
    setSignedIn(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const admin = profile?.role === "admin";
    setIsAdmin(admin);
    if (admin) await loadData();
    else setData(EMPTY);
  }, [supabase, loadData]);

  useEffect(() => {
    (async () => {
      await refreshAuth();
      setHydrated(true);
    })();
  }, [refreshAuth]);

  const signIn = useCallback(
    async (username: string, password: string) => {
      const prov = await provisionAdmin(username, password);
      if (!prov.ok) return { ok: false, error: prov.error };
      const { error } = await supabase.auth.signInWithPassword({
        email: prov.email,
        password,
      });
      if (error) return { ok: false, error: "Invalid username or password." };
      await refreshAuth();
      return { ok: true };
    },
    [supabase, refreshAuth],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSignedIn(false);
    setIsAdmin(false);
    setData(EMPTY);
  }, [supabase]);

  const uploadImage = useCallback(
    async (file: File, folder: "products" | "categories") => {
      const m = file.name.match(/\.([a-zA-Z0-9]+)$/);
      const ext = (m ? m[1] : "jpg").toLowerCase();
      const path = `${folder}/${genId(folder)}.${ext}`;
      const { error } = await supabase.storage
        .from("catalog")
        .upload(path, file, {
          upsert: false,
          contentType: file.type || undefined,
          cacheControl: "3600",
        });
      if (error) return { error: error.message };
      const { data } = supabase.storage.from("catalog").getPublicUrl(path);
      return { url: data.publicUrl };
    },
    [supabase],
  );

  /* ── products ─────────────────────────────────────────────────────── */
  const addProduct = useCallback(
    async (p: AdminProduct) => {
      setData((d) => ({ ...d, products: [p, ...d.products] }));
      const { error } = await supabase.from("products").insert(productToRow(p));
      if (error) {
        console.error(error);
        await loadData();
      }
    },
    [supabase, loadData],
  );

  const updateProduct = useCallback(
    async (id: string, patch: Partial<AdminProduct>) => {
      setData((d) => ({
        ...d,
        products: d.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
      const { error } = await supabase
        .from("products")
        .update(productToRow(patch))
        .eq("id", id);
      if (error) {
        console.error(error);
        await loadData();
      }
    },
    [supabase, loadData],
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      setData((d) => ({ ...d, products: d.products.filter((p) => p.id !== id) }));
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        console.error(error);
        await loadData();
      }
    },
    [supabase, loadData],
  );

  /* ── orders ───────────────────────────────────────────────────────── */
  const updateOrderStatus = useCallback(
    async (id: string, status: OrderStatus) => {
      setData((d) => ({
        ...d,
        orders: d.orders.map((o) => (o.id === id ? { ...o, status } : o)),
      }));
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);
      if (error) {
        console.error(error);
        await loadData();
      }
    },
    [supabase, loadData],
  );

  /* ── categories ───────────────────────────────────────────────────── */
  const addCategory = useCallback(
    async (c: AdminCategory) => {
      const sort_order = data.categories.length;
      setData((d) => ({ ...d, categories: [...d.categories, c] }));
      const { error } = await supabase
        .from("categories")
        .insert({ ...categoryToRow(c), sort_order });
      if (error) {
        console.error(error);
        await loadData();
      }
    },
    [supabase, loadData, data.categories.length],
  );

  const updateCategory = useCallback(
    async (id: string, patch: Partial<AdminCategory>) => {
      setData((d) => ({
        ...d,
        categories: d.categories.map((c) =>
          c.id === id ? { ...c, ...patch } : c,
        ),
      }));
      const { error } = await supabase
        .from("categories")
        .update(categoryToRow(patch))
        .eq("id", id);
      if (error) {
        console.error(error);
        await loadData();
      }
    },
    [supabase, loadData],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      setData((d) => ({
        ...d,
        categories: d.categories.filter((c) => c.id !== id),
      }));
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) {
        console.error(error);
        await loadData();
      }
    },
    [supabase, loadData],
  );

  /* ── banners ──────────────────────────────────────────────────────── */
  const addBanner = useCallback(
    async (b: Banner) => {
      const sort_order = data.banners.length;
      setData((d) => ({ ...d, banners: [...d.banners, b] }));
      const { error } = await supabase
        .from("banners")
        .insert({ ...bannerToRow(b), sort_order });
      if (error) {
        console.error(error);
        await loadData();
      }
    },
    [supabase, loadData, data.banners.length],
  );

  const updateBanner = useCallback(
    async (id: string, patch: Partial<Banner>) => {
      setData((d) => ({
        ...d,
        banners: d.banners.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      }));
      const { error } = await supabase
        .from("banners")
        .update(bannerToRow(patch))
        .eq("id", id);
      if (error) {
        console.error(error);
        await loadData();
      }
    },
    [supabase, loadData],
  );

  const deleteBanner = useCallback(
    async (id: string) => {
      setData((d) => ({ ...d, banners: d.banners.filter((b) => b.id !== id) }));
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) {
        console.error(error);
        await loadData();
      }
    },
    [supabase, loadData],
  );

  /* ── doctors ──────────────────────────────────────────────────────── */
  const addDoctor = useCallback(
    async (doc: Doctor) => {
      const sort_order = data.doctors.length;
      setData((d) => ({ ...d, doctors: [...d.doctors, doc] }));
      const { error } = await supabase
        .from("doctors")
        .insert({ ...doctorToRow(doc), sort_order });
      if (error) {
        console.error(error);
        await loadData();
      }
    },
    [supabase, loadData, data.doctors.length],
  );

  const updateDoctor = useCallback(
    async (id: string, patch: Partial<Doctor>) => {
      setData((d) => ({
        ...d,
        doctors: d.doctors.map((doc) =>
          doc.id === id ? { ...doc, ...patch } : doc,
        ),
      }));
      const { error } = await supabase
        .from("doctors")
        .update(doctorToRow(patch))
        .eq("id", id);
      if (error) {
        console.error(error);
        await loadData();
      }
    },
    [supabase, loadData],
  );

  const deleteDoctor = useCallback(
    async (id: string) => {
      setData((d) => ({ ...d, doctors: d.doctors.filter((doc) => doc.id !== id) }));
      const { error } = await supabase.from("doctors").delete().eq("id", id);
      if (error) {
        console.error(error);
        await loadData();
      }
    },
    [supabase, loadData],
  );

  /* ── appointments ─────────────────────────────────────────────────── */
  const updateAppointmentStatus = useCallback(
    async (id: string, status: AppointmentStatus) => {
      setData((d) => ({
        ...d,
        appointments: d.appointments.map((a) =>
          a.id === id ? { ...a, status } : a,
        ),
      }));
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id);
      if (error) {
        console.error(error);
        await loadData();
      }
    },
    [supabase, loadData],
  );

  /* ── prescriptions ────────────────────────────────────────────────── */
  const updatePrescriptionStatus = useCallback(
    async (id: string, status: Prescription["status"]) => {
      setData((d) => ({
        ...d,
        prescriptions: d.prescriptions.map((p) =>
          p.id === id ? { ...p, status } : p,
        ),
      }));
      const { error } = await supabase
        .from("prescriptions")
        .update({ status })
        .eq("id", id);
      if (error) {
        console.error(error);
        await loadData();
      }
    },
    [supabase, loadData],
  );

  const prescriptionUrl = useCallback(
    async (filePath: string) => {
      const { data, error } = await supabase.storage
        .from("prescriptions")
        .createSignedUrl(filePath, 60 * 10);
      if (error) {
        console.error(error);
        return null;
      }
      return data.signedUrl;
    },
    [supabase],
  );

  const confirmPrescriptionOrder = useCallback(
    async (orderId: string, items: OrderDraftItem[]) => {
      const { error } = await supabase.rpc("admin_confirm_prescription_order", {
        p_order: orderId,
        p_items: items,
      });
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      await loadData();
      return { ok: true };
    },
    [supabase, loadData],
  );

  const rejectPrescription = useCallback(
    async (orderId: string) => {
      const { error } = await supabase.rpc("admin_reject_prescription", {
        p_order: orderId,
      });
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      await loadData();
      return { ok: true };
    },
    [supabase, loadData],
  );

  const value = useMemo<AdminValue>(
    () => ({
      hydrated,
      loading,
      data,
      signedIn,
      isAdmin,
      signIn,
      refreshAuth,
      signOut,
      reload: loadData,
      uploadImage,
      addProduct,
      updateProduct,
      deleteProduct,
      updateOrderStatus,
      addCategory,
      updateCategory,
      deleteCategory,
      addBanner,
      updateBanner,
      deleteBanner,
      addDoctor,
      updateDoctor,
      deleteDoctor,
      updateAppointmentStatus,
      updatePrescriptionStatus,
      prescriptionUrl,
      confirmPrescriptionOrder,
      rejectPrescription,
    }),
    [
      hydrated,
      loading,
      data,
      signedIn,
      isAdmin,
      signIn,
      refreshAuth,
      signOut,
      loadData,
      uploadImage,
      addProduct,
      updateProduct,
      deleteProduct,
      updateOrderStatus,
      addCategory,
      updateCategory,
      deleteCategory,
      addBanner,
      updateBanner,
      deleteBanner,
      addDoctor,
      updateDoctor,
      deleteDoctor,
      updateAppointmentStatus,
      updatePrescriptionStatus,
      prescriptionUrl,
      confirmPrescriptionOrder,
      rejectPrescription,
    ],
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
