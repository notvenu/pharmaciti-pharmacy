"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const OrderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        qty: z.number().int().positive().max(99),
      }),
    )
    .min(1, "Your cart is empty."),
  customer: z.string().trim().max(120).optional().default(""),
  phone: z.string().trim().max(20).optional().default(""),
  address: z.string().trim().max(400).optional().default(""),
  payment: z.enum(["COD", "Online"]),
});

export type PlaceOrderInput = z.input<typeof OrderSchema>;
export type PlaceOrderResult =
  | { ok: true; orderNo: number }
  | { ok: false; error: string };

/**
 * Places an order. Authentication is verified here (Server Actions are public
 * POST endpoints), and the heavy lifting — pricing, totals and stock — happens
 * inside the SECURITY DEFINER `place_order` SQL function, so the client can
 * never tamper with prices.
 */
export async function placeOrder(
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  const parsed = OrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid order." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Please sign in to place your order." };
  }

  const { items, customer, phone, address, payment } = parsed.data;
  const { data, error } = await supabase.rpc("place_order", {
    p_items: items,
    p_customer: customer,
    p_phone: phone,
    p_address: address,
    p_payment: payment,
  });

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not place your order." };
  }
  return { ok: true, orderNo: data.order_no };
}

const EditSchema = z.object({
  orderId: z.string().uuid(),
  productId: z.string().min(1),
  qty: z.number().int().min(0).max(99),
});

export type EditOrderInput = z.input<typeof EditSchema>;
export type EditOrderResult = { ok: true } | { ok: false; error: string };

/**
 * Add, change the quantity of, or (qty = 0) remove an item from an order that
 * is still "placed". Ownership, the editable window and stock are all enforced
 * inside the SECURITY DEFINER `update_order_item` SQL function.
 */
export async function editOrderItem(
  input: EditOrderInput,
): Promise<EditOrderResult> {
  const parsed = EditSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid edit." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in." };

  const { orderId, productId, qty } = parsed.data;
  const { error } = await supabase.rpc("update_order_item", {
    p_order: orderId,
    p_product: productId,
    p_qty: qty,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/orders");
  return { ok: true };
}
