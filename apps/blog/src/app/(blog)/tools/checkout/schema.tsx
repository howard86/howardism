import { z } from "zod";

const requiredString = z.string().min(1, { message: "This field is required" });

export const orderItemSchema = z.object({
  id: z.string(),
  quantity: z.number().int().min(1),
});

export const checkoutSchema = z.object({
  name: requiredString,
  email: requiredString.email(),
  items: z.array(orderItemSchema).min(1),
});

export type CheckoutSchema = z.infer<typeof checkoutSchema>;
