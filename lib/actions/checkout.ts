'use server';

import { z } from 'zod';
import { getCartSummary } from '@/lib/actions/cart';
import { stripe } from '@/lib/stripe';
import { FLAT_SHIPPING_CENTS, US_POSTCODE_PATTERN } from '@/lib/shipping';
import { createSupabaseRouteClient } from '@/lib/supabase/server';

export type ShippingAddress = {
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

const emailSchema = z.string().trim().email('Enter a valid email address.');

const shippingAddressSchema = z.object({
  name: z.string().trim().min(1, 'Enter a recipient name.').max(120, 'Keep it under 120 characters.'),
  line1: z.string().trim().min(1, 'Enter a street address.').max(200, 'Keep it under 200 characters.'),
  line2: z.string().trim().max(200, 'Keep it under 200 characters.').optional(),
  city: z.string().trim().min(1, 'Enter a city.').max(120, 'Keep it under 120 characters.'),
  state: z
    .string()
    .trim()
    .length(2, 'Use the 2-letter state code.')
    .regex(/^[A-Za-z]{2}$/, 'Use the 2-letter state code.'),
  postal_code: z.string().trim().regex(US_POSTCODE_PATTERN, 'Enter a 5-digit US postcode.'),
  country: z.string().trim().length(2, 'Use a 2-letter country code.').default('US')
});

export type StartCheckoutResult =
  | {
      ok: true;
      paymentIntentId: string;
      clientSecret: string;
      subtotalCents: number;
      shippingCents: number;
      totalCents: number;
    }
  | { ok: false; error: string; reason?: 'auth' | 'empty' };

/**
 * Creates a PaymentIntent for the caller's cart.
 *
 * The address is not known yet at this point — the shopper fills the form after
 * the card fields mount — so only identity and totals go in metadata here.
 * prepareCheckout() adds the address moments before confirmation.
 */
export async function startCheckout(): Promise<StartCheckoutResult> {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Sign in to check out.', reason: 'auth' };

  const { data: cart, error: cartError } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (cartError) return { ok: false, error: cartError.message };

  const summary = await getCartSummary();

  if (!cart || summary.items.length === 0) {
    return { ok: false, error: 'Your cart is empty.', reason: 'empty' };
  }

  const subtotalCents = summary.subtotal_cents;
  const shippingCents = FLAT_SHIPPING_CENTS;
  const totalCents = subtotalCents + shippingCents;

  // Stripe rejects USD charges below 50 cents.
  if (totalCents < 50) {
    return { ok: false, error: 'Order total is too small to charge.' };
  }

  try {
    const intent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      // Card only. automatic_payment_methods would also surface Link, Cash App,
      // Amazon Pay and bank debits — none of which the rest of this flow handles,
      // and all of which bury the card form under a wall of tabs.
      payment_method_types: ['card'],
      receipt_email: user.email ?? undefined,
      description: 'ShopCommerce order',
      metadata: {
        user_id: user.id,
        cart_id: cart.id,
        subtotal_cents: String(subtotalCents),
        shipping_cents: String(shippingCents)
      }
    });

    if (!intent.client_secret) {
      return { ok: false, error: 'Stripe did not return a client secret.' };
    }

    return {
      ok: true,
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
      subtotalCents,
      shippingCents,
      totalCents
    };
  } catch (error) {
    console.error('startCheckout failed', error);
    return { ok: false, error: 'Could not start checkout. Try again in a moment.' };
  }
}

export type PrepareCheckoutResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Validates the form and writes the email + shipping address onto the intent.
 *
 * The webhook runs with no user session, so the PaymentIntent metadata is the
 * only channel that carries the address from the browser to the order row.
 */
export async function prepareCheckout(input: {
  paymentIntentId: string;
  email: string;
  address: ShippingAddress;
}): Promise<PrepareCheckoutResult> {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Your session expired. Sign in again to pay.' };

  const emailResult = emailSchema.safeParse(input.email);
  const addressResult = shippingAddressSchema.safeParse(input.address);

  const fieldErrors: Record<string, string> = {};

  if (!emailResult.success) {
    fieldErrors.email = emailResult.error.issues[0]?.message ?? 'Enter a valid email address.';
  }

  if (!addressResult.success) {
    for (const issue of addressResult.error.issues) {
      const key = String(issue.path[0] ?? 'address');
      if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
    }
  }

  if (!emailResult.success || !addressResult.success) {
    return { ok: false, error: 'Check the highlighted fields.', fieldErrors };
  }

  try {
    const intent = await stripe.paymentIntents.retrieve(input.paymentIntentId);

    if (intent.metadata.user_id !== user.id) {
      return { ok: false, error: 'That payment does not belong to this account.' };
    }

    if (intent.status !== 'requires_payment_method' && intent.status !== 'requires_confirmation') {
      return {
        ok: false,
        error: 'This payment can no longer be edited. Reload the page to start a new one.'
      };
    }

    const address = {
      ...addressResult.data,
      line2: addressResult.data.line2 ? addressResult.data.line2 : null
    };

    await stripe.paymentIntents.update(input.paymentIntentId, {
      receipt_email: emailResult.data,
      metadata: {
        ...intent.metadata,
        email: emailResult.data,
        shipping_address: JSON.stringify(address)
      }
    });

    return { ok: true };
  } catch (error) {
    console.error('prepareCheckout failed', error);
    return { ok: false, error: 'Could not prepare the payment. Try again.' };
  }
}
