"use server";

import { z } from "zod";
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
