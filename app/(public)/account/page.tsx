import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge, Container } from '@/components/ui';
import { AddressManager } from '@/components/account/AddressManager';
import type { Address } from '@/lib/actions/addresses';
import { STATUS_VARIANT, orderReference, type OrderStatus } from '@/lib/orders';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDate, formatPrice } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Account'
};

export const dynamic = 'force-dynamic';

type OrderRow = {
  id: string;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
};

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=%2Faccount');
  }

  const [ordersResult, addressesResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id, status, total_cents, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('addresses')
      .select('id, name, line1, line2, city, state, postal_code, country, is_default')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
  ]);

  if (ordersResult.error) {
    throw new Error('Could not load orders: ' + ordersResult.error.message);
  }
  if (addressesResult.error) {
    throw new Error('Could not load addresses: ' + addressesResult.error.message);
  }

  const orders = (ordersResult.data ?? []) as OrderRow[];
  const addresses = (addressesResult.data ?? []) as Address[];

  return (
    <Container className="max-w-4xl py-8 sm:py-12">
      <h1 className="font-display text-3xl font-bold text-text-primary">Account</h1>
      <p className="mt-2 break-words text-text-muted">{user.email}</p>

      <section className="mt-12" aria-labelledby="orders-heading">
        <h2 id="orders-heading" className="font-display text-xl font-semibold text-text-primary">
          Orders
        </h2>

        {orders.length === 0 ? (
          <div className="mt-4 rounded-md border border-border bg-surface p-6">
            <p className="font-medium text-text-primary">No orders yet.</p>
            <p className="mt-1 text-sm text-text-muted">
              Once you check out, your orders show up here with their status.
            </p>
            <Link
              href="/category/all"
              className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {orders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium text-text-primary">{orderReference(order.id)}</p>
                  <p className="mt-1 text-sm text-text-muted">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={STATUS_VARIANT[order.status]} size="sm">
                    {order.status}
                  </Badge>
                  <p className="font-display font-semibold text-text-primary">
                    {formatPrice(order.total_cents)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12" aria-labelledby="addresses-heading">
        <h2
          id="addresses-heading"
          className="font-display text-xl font-semibold text-text-primary"
        >
          Addresses
        </h2>
        <div className="mt-4">
          <AddressManager initial={addresses} />
        </div>
      </section>
    </Container>
  );
}
