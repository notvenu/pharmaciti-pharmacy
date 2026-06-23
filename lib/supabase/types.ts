/**
 * Hand-written database types mirroring supabase/schema.sql. Kept in sync by
 * hand for now; you can later replace this file with the output of:
 *   npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts
 */

export type OrderStatusDb =
  | "placed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PaymentMethodDb = "COD" | "Online";

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
    };
  };
};
