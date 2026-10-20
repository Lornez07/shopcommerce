import { z } from 'zod';

export const variantSchema = z.object({
  size: z.string().optional(),
  color: z.object({
    name: z.string(),
    hex: z.string()
  }).optional()
});

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  variant: variantSchema,
  quantity: z.number().int().positive()
});

export const addressSchema = z.object({
  name: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().default('US'),
  isDefault: z.boolean().default(false)
});

export const checkoutSchema = z.object({
  email: z.string().email(),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional()
});

export const orderStatusSchema = z.enum([
  'pending',
  'paid',
  'shipped',
  'cancelled',
  'refunded'
]);

export type Variant = z.infer<typeof variantSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type Address = z.infer<typeof addressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;