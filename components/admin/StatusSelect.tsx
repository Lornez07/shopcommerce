'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/ui';
import { updateOrderStatus } from '@/lib/actions/admin';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/orders';

export function StatusSelect({
  orderId,
  reference,
  status
}: {
  orderId: string;
  reference: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState<OrderStatus>(status);
  const [isPending, setIsPending] = useState(false);

  async function handleChange(next: OrderStatus) {
    if (next === value || isPending) return;

    const previous = value;
    setValue(next);
    setIsPending(true);

    try {
      const result = await updateOrderStatus(orderId, next);
      if (!result.ok) {
        setValue(previous);
        showToast('error', 'Could not update status', { description: result.error });
        return;
      }
      showToast('success', 'Status updated', {
        description: reference + ' is now ' + next + '.'
      });
      router.refresh();
    } catch {
      setValue(previous);
      showToast('error', 'Could not update status', {
        description: 'Check your connection and try again.'
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <select
      aria-label={'Change status for ' + reference}
      value={value}
      disabled={isPending}
      onChange={(event) => handleChange(event.target.value as OrderStatus)}
      className="h-9 rounded-sm border border-border bg-surface px-2 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
    >
      {ORDER_STATUSES.map((option) => (
        <option key={option} value={option}>
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </option>
      ))}
    </select>
  );
}
