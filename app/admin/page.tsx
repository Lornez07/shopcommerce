import { OrderTable } from '@/components/admin/OrderTable';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { AdminOrder } from '@/lib/orders';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Orders'
};

export default async function AdminOrdersPage() {
  const supabase = await createSupabaseServerClient();

  // Sorted newest-first. Pagination and column sorting wait for real order volume
  // (Task 14) — building them against zero rows produces untested code.
  const { data, error } = await supabase
    .from('orders')
    .select('id, email, status, total_cents, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new Error('Could not load orders: ' + error.message);
  }

  const orders = (data ?? []) as AdminOrder[];

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-2xl font-bold text-text-primary">Orders</h1>
        <p className="text-sm text-text-muted">
          {orders.length === 1 ? '1 order' : orders.length + ' orders'}
        </p>
      </div>

      <div className="mt-6">
        <OrderTable orders={orders} />
      </div>
    </div>
  );
}
