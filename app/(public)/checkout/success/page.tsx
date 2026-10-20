import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CartReset } from '@/components/checkout/CartReset';
import { OrderPoller } from '@/components/checkout/OrderPoller';
import { Badge, Container } from '@/components/ui';
import type { ShippingAddress } from '@/lib/actions/checkout';
import { orderReference } from '@/lib/orders';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDate, formatPrice } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Order confirmed'
};

export const dynamic = 'force-dynamic';

type OrderRow = {
  id: string;
  email: string;
  status: 'pending' | 'paid' | 'shipped' | 'cancelled' | 'refunded';
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  shipping_address: ShippingAddress;
  created_at: string;
};

type ItemRow = {
  id: string;
  product_name: string;
  variant: { size?: string; color?: string } | null;
  unit_price_cents: number;
  quantity: number;
  total_cents: number;
};

function variantLabel(variant: ItemRow['variant']): string | null {
  const parts = [variant?.size, variant?.color].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(' · ') : null;
}

export default async function CheckoutSuccessPage({
  searchParams
}: {
  searchParams: { payment_intent?: string };
}) {
  const paymentIntentId = searchParams.payment_intent;

  if (!paymentIntentId) notFound();

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, email, status, subtotal_cents, shipping_cents, total_cents, shipping_address, created_at'
    )
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle();

  if (error) {
    throw new Error('Could not load your order: ' + error.message);
  }

  const order = data as OrderRow | null;

  if (!order) {
    return (
      <Container className="py-16 lg:py-24">
        <div className="mx-auto max-w-lg text-center">
          <CartReset />
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
            Payment received
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold text-text-primary sm:text-4xl">
            Confirming your order…
          </h1>
          <p className="mt-3 text-text-muted">
            This usually takes a second. The page updates itself.
          </p>
          <OrderPoller />
        </div>
      </Container>
    );
  }

  const { data: items } = await supabase
    .from('order_items')
    .select('id, product_name, variant, unit_price_cents, quantity, total_cents')
    .eq('order_id', order.id);

  const address = order.shipping_address;

  return (
    <Container className="py-10 lg:py-16">
      <CartReset />

      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="success">Paid</Badge>
          <span className="text-sm text-text-muted">Order placed {formatDate(order.created_at)}</span>
        </div>

        <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-text-primary sm:text-5xl">
          Order confirmed
        </h1>

        <p className="mt-3 font-mono text-lg text-text-muted">{orderReference(order.id)}</p>

        <p className="mt-4 text-text-muted">
          Placed by <span className="text-text-primary">{order.email}</span>. You can reopen this
          order from your account at any time.
        </p>

        <div className="mt-8 rounded-md border border-border bg-surface p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-text-primary">What you bought</h2>

          {items && items.length > 0 ? (
            <ul className="mt-4 divide-y divide-border">
              {(items as ItemRow[]).map((item) => {
                const label = variantLabel(item.variant);
                return (
                  <li key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary">{item.product_name}</p>
                      {label ? <p className="text-xs text-text-muted">{label}</p> : null}
                      <p className="mt-0.5 text-xs text-text-muted">
                        {item.quantity} × {formatPrice(item.unit_price_cents)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm tabular-nums text-text-primary">
                      {formatPrice(item.total_cents)}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-text-muted">The item list is still syncing.</p>
          )}

          <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-text-muted">Subtotal</dt>
              <dd className="tabular-nums text-text-primary">{formatPrice(order.subtotal_cents)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-text-muted">Shipping</dt>
              <dd className="tabular-nums text-text-primary">{formatPrice(order.shipping_cents)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
              <dt className="font-display text-base font-semibold text-text-primary">Total</dt>
              <dd className="font-display text-base font-semibold tabular-nums text-text-primary">
                {formatPrice(order.total_cents)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-4 rounded-md border border-border bg-surface p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-text-primary">Shipping to</h2>
          <address className="mt-3 text-sm not-italic leading-relaxed text-text-muted">
            <span className="block text-text-primary">{address.name}</span>
            <span className="block">{address.line1}</span>
            {address.line2 ? <span className="block">{address.line2}</span> : null}
            <span className="block">
              {address.city}, {address.state} {address.postal_code}
            </span>
            <span className="block">United States</span>
          </address>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-6 text-lg font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            Continue shopping
          </Link>
          <Link
            href="/account"
            className="inline-flex h-12 items-center justify-center rounded-md px-4 text-base font-medium text-text-muted underline-offset-4 transition-colors hover:text-text-primary hover:underline"
          >
            View all orders
          </Link>
        </div>
      </div>
    </Container>
  );
}
