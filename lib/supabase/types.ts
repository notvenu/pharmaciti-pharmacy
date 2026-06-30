/**
 * Hand-written database types mirroring supabase/schema.sql. Kept in sync by
 * hand for now; you can later replace this file with the output of:
 *   npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts
 */

export type OrderStatusDb = "confirming" | "placed" | "delivered";
export type PaymentMethodDb = "COD" | "Online";
export type AppointmentStatusDb = "booked" | "completed" | "cancelled";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: "customer" | "admin";
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role?: "customer" | "admin";
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          role?: "customer" | "admin";
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          icon_key: string;
          href: string;
          image_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          icon_key: string;
          href?: string;
          image_url?: string | null;
          sort_order?: number;
        };
        Update: Partial<{
          name: string;
          icon_key: string;
          href: string;
          image_url: string | null;
          sort_order: number;
        }>;
      };
      products: {
        Row: {
          id: string;
          name: string;
          brand: string;
          category: string;
          subcategory: string | null;
          pack: string;
          price: number;
          mrp: number;
          rx: boolean;
          tag: string | null;
          rating: number;
          description: string;
          highlights: string[];
          tint: string;
          image_url: string | null;
          stock: number;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          brand?: string;
          category: string;
          subcategory?: string | null;
          pack?: string;
          price: number;
          mrp: number;
          rx?: boolean;
          tag?: string | null;
          rating?: number;
          description?: string;
          highlights?: string[];
          tint?: string;
          image_url?: string | null;
          stock?: number;
          active?: boolean;
          sort_order?: number;
        };
        Update: Partial<{
          name: string;
          brand: string;
          category: string;
          subcategory: string | null;
          pack: string;
          price: number;
          mrp: number;
          rx: boolean;
          tag: string | null;
          rating: number;
          description: string;
          highlights: string[];
          tint: string;
          image_url: string | null;
          stock: number;
          active: boolean;
          sort_order: number;
        }>;
      };
      banners: {
        Row: {
          id: string;
          badge: string;
          title_top: string;
          title_bottom: string;
          subtitle: string;
          cta_label: string;
          cta_href: string;
          active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          badge?: string;
          title_top?: string;
          title_bottom?: string;
          subtitle?: string;
          cta_label?: string;
          cta_href?: string;
          active?: boolean;
          sort_order?: number;
        };
        Update: Partial<{
          badge: string;
          title_top: string;
          title_bottom: string;
          subtitle: string;
          cta_label: string;
          cta_href: string;
          active: boolean;
          sort_order: number;
        }>;
      };
      orders: {
        Row: {
          id: string;
          order_no: number;
          user_id: string;
          customer: string;
          phone: string;
          address: string;
          total: number;
          status: OrderStatusDb;
          payment_method: PaymentMethodDb;
          prescription_id: string | null;
          placed_at: string;
        };
        Insert: never;
        Update: Partial<{ status: OrderStatusDb }>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          name: string;
          price: number;
          qty: number;
        };
        Insert: never;
        Update: never;
      };
      prescriptions: {
        Row: {
          id: string;
          user_id: string;
          file_path: string;
          note: string;
          status: "submitted" | "verified" | "rejected" | "fulfilled";
          created_at: string;
        };
        Insert: {
          user_id: string;
          file_path: string;
          note?: string;
        };
        Update: Partial<{
          status: "submitted" | "verified" | "rejected" | "fulfilled";
        }>;
      };
      doctors: {
        Row: {
          id: string;
          name: string;
          specialization: string;
          qualification: string;
          experience_years: number;
          fee: number;
          bio: string;
          image_url: string | null;
          active: boolean;
          availability: Record<string, { start: string; end: string }[]>;
          slot_minutes: number;
          blocked_dates: string[];
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          specialization?: string;
          qualification?: string;
          experience_years?: number;
          fee?: number;
          bio?: string;
          image_url?: string | null;
          active?: boolean;
          availability?: Record<string, { start: string; end: string }[]>;
          slot_minutes?: number;
          blocked_dates?: string[];
          sort_order?: number;
        };
        Update: Partial<{
          name: string;
          specialization: string;
          qualification: string;
          experience_years: number;
          fee: number;
          bio: string;
          image_url: string | null;
          active: boolean;
          availability: Record<string, { start: string; end: string }[]>;
          slot_minutes: number;
          blocked_dates: string[];
          sort_order: number;
        }>;
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          recipient: string;
          phone: string;
          line: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          label?: string;
          recipient?: string;
          phone?: string;
          line: string;
          is_default?: boolean;
        };
        Update: Partial<{
          label: string;
          recipient: string;
          phone: string;
          line: string;
          is_default: boolean;
        }>;
      };
      appointments: {
        Row: {
          id: string;
          user_id: string;
          doctor_id: string;
          patient_name: string;
          phone: string;
          slot_date: string;
          slot_time: string;
          note: string;
          status: AppointmentStatusDb;
          created_at: string;
        };
        Insert: {
          user_id: string;
          doctor_id: string;
          patient_name?: string;
          phone?: string;
          slot_date: string;
          slot_time: string;
          note?: string;
        };
        Update: Partial<{ status: AppointmentStatusDb }>;
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      place_order: {
        Args: {
          p_items: { id: string; qty: number }[];
          p_customer: string;
          p_phone: string;
          p_address: string;
          p_payment: PaymentMethodDb;
        };
        Returns: Database["public"]["Tables"]["orders"]["Row"];
      };
      update_order_item: {
        Args: { p_order: string; p_product: string; p_qty: number };
        Returns: Database["public"]["Tables"]["orders"]["Row"];
      };
      admin_create_order: {
        Args: {
          p_user: string;
          p_items: { id: string; qty: number }[];
          p_customer: string;
          p_phone: string;
          p_address: string;
          p_payment: PaymentMethodDb;
          p_prescription: string | null;
        };
        Returns: Database["public"]["Tables"]["orders"]["Row"];
      };
    };
  };
};
