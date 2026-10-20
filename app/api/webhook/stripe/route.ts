import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

type CartRow = {
  product_id: string | null;
  variant: { size?: string; color?: string } | null;
  quantity: number;
  products: { name: string; slug: string; base_price_cents: number } | null;
};

function readAddress(raw: string | undefined) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (
      typeof parsed.name !== 'string' ||
      typeof parsed.line1 !== 'string' ||
      typeof parsed.city !== 'string' ||
      typeof parsed.state !== 'string' ||
      typeof parsed.postal_code !== 'string'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function recordOrder(intent: Stripe.PaymentIntent) {
  const supabase = createSupabaseAdminClient();
  const metadata = intent.metadata ?? {};
  const cartId = metadata.cart_id ?? null;
  const email = metadata.email ?? intent.receipt_email ?? null;
  const address = readAddress(metadata.shipping_address);

  if (!email) throw new Error('PaymentIntent ' + intent.id + ' carries no email.');
  if (!address) throw new Error('PaymentIntent ' + intent.id + ' carries no shipping address.');

  const subtotalCents = Number(metadata.subtotal_cents ?? 0);
  const shippingCents = Number(metadata.shipping_cents ?? 0);
  const totalCents = intent.amount_received || intent.amount;

  let lines: Record<string, unknown>[] = [];

  if (cartId) {
    const { data, error } = await supabase
      .from('cart_items')
      .select('product_id, variant, quantity, products(name, slug, base_price_cents)')
      .eq('cart_id', cartId);

    if (error) throw new Error('Could not read the cart: ' + error.message);

    lines = ((data ?? []) as unknown as CartRow[]).map((row) => {
      const unitPrice = row.products?.base_price_cents ?? 0;
      return {
        product_id: row.product_id,
        product_name: row.products?.name ?? 'Unavailable product',
        product_slug: row.products?.slug ?? '',
        variant: row.variant ?? {},
        unit_price_cents: unitPrice,
        quantity: row.quantity,
        total_cents: unitPrice * row.quantity
      };
    });
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: metadata.user_id || null,
      email,
      status: 'paid',
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      tax_cents: 0,
      total_cents: totalCents,
      shipping_address: address,
      stripe_payment_intent_id: intent.id
    })
    .select('id')
    .single();

  if (orderError) {
    // 23505: the unique index fired, so another delivery of this event already
    // wrote the order. Treat it as success rather than retrying forever.
    if ((orderError as { code?: string }).code === '23505') return;
    throw new Error('Could not insert the order: ' + orderError.message);
  }

  if (lines.length > 0) {
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(lines.map((line) => ({ ...line, order_id: order.id })));

    if (itemsError) {
      // Roll the order back so Stripe's retry can try the whole thing again.
      await supabase.from('orders').delete().eq('id', order.id);
      throw new Error('Could not insert order items: ' + itemsError.message);
    }
  }

  if (cartId) {
    const { error: clearError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);

    if (clearError) {
      // The order exists and is paid. A stale cart is annoying, not fatal.
      console.error('Could not clear cart ' + cartId, clearError);
    }
  }
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret.' }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error('Stripe signature verification failed', error);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  if (event.type !== 'payment_intent.succeeded') {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const intent = event.data.object as Stripe.PaymentIntent;

  try {
    const supabase = createSupabaseAdminClient();
    const existing = await supabase
      .from('orders')
      .select('id')
      .eq('stripe_payment_intent_id', intent.id)
      .maybeSingle();

    if (existing.error) throw new Error(existing.error.message);
    if (existing.data) return NextResponse.json({ received: true, duplicate: true });

    await recordOrder(intent);
  } catch (error) {
    console.error('Could not record order for ' + intent.id, error);
    // Non-2xx tells Stripe to retry. Signature failures above stay 400.
    return NextResponse.json({ error: 'Could not record the order.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
