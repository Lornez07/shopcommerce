import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { Container } from '@/components/ui';
import { getCartSummary } from '@/lib/actions/cart';
import type { ShippingAddress } from '@/lib/actions/checkout';
import { FLAT_SHIPPING_CENTS } from '@/lib/shipping';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Checkout'
};

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=%2Fcheckout');

  const summary = await getCartSummary();

  if (summary.items.length === 0) redirect('/cart');

  // Prefill from the saved address book, not profiles.default_shipping — the
  // address form writes to public.addresses, and nothing ever filled that column.
  const [profileResult, addressResult] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase
      .from('addresses')
      .select('name, line1, line2, city, state, postal_code')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  const saved = addressResult.data as Partial<ShippingAddress> | null;
  const fullName = profileResult.data?.full_name ?? null;

  const initialAddress: ShippingAddress = {
    name: saved?.name ?? fullName ?? '',
    line1: saved?.line1 ?? '',
    line2: saved?.line2 ?? null,
    city: saved?.city ?? '',
    state: saved?.state ?? '',
    postal_code: saved?.postal_code ?? '',
    country: 'US'
  };

  const subtotalCents = summary.subtotal_cents;
  const shippingCents = FLAT_SHIPPING_CENTS;

  return (
    <Container className="py-8 lg:py-12">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h1 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">Checkout</h1>
        <Link
          href="/cart"
          className="text-sm font-medium text-text-muted underline-offset-4 transition-colors hover:text-text-primary hover:underline"
        >
          Back to cart
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8">
        <OrderSummary
          items={summary.items}
          subtotalCents={subtotalCents}
          shippingCents={shippingCents}
        />

        <div className="lg:order-1">
          <CheckoutForm
            initialEmail={user.email ?? ''}
            initialAddress={initialAddress}
            totalCents={subtotalCents + shippingCents}
          />
        </div>
      </div>
    </Container>
  );
}
