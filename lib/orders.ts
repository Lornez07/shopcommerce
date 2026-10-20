export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'cancelled', 'refunded'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_VARIANT: Record<
  OrderStatus,
  'warning' | 'success' | 'secondary' | 'error' | 'default'
> = {
  pending: 'warning',
  paid: 'success',
  shipped: 'secondary',
  cancelled: 'error',
  refunded: 'default'
};

export type AdminOrder = {
  id: string;
  email: string;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
};

/** Display reference until orders get a real sequence in Task 10. */
export function orderReference(id: string): string {
  return '#' + id.slice(0, 8).toUpperCase();
}
