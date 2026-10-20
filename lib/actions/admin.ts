'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseRouteClient } from '@/lib/supabase/server';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/orders';

export type AdminResult = { ok: true } | { ok: false; error: string };

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<AdminResult> {
  if (!ORDER_STATUSES.includes(status)) {
    return { ok: false, error: 'Unknown status.' };
  }

  const supabase = await createSupabaseRouteClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Sign in first.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_admin) return { ok: false, error: 'Admins only.' };

  // RLS would also block this, but then a non-admin sees "order missing"
  // instead of a truthful reason.
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select('id');

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: false, error: 'That order no longer exists.' };

  revalidatePath('/admin');
  return { ok: true };
}
