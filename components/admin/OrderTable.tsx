import { Badge } from '@/components/ui';
import { StatusSelect } from '@/components/admin/StatusSelect';
import { STATUS_VARIANT, orderReference, type AdminOrder } from '@/lib/orders';
import { formatDate, formatPrice } from '@/lib/utils';

export function OrderTable({ orders }: { orders: AdminOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface p-6">
        <p className="font-medium text-text-primary">No orders yet.</p>
        <p className="mt-1 text-sm text-text-muted">
          Orders appear here once a checkout completes.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-md border border-border bg-surface lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border">
            <tr className="text-text-muted">
              <th scope="col" className="px-5 py-3 font-medium">
                Reference
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                Customer
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                Date
              </th>
              <th scope="col" className="px-5 py-3 text-right font-medium">
                Total
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                Status
              </th>
              <th scope="col" className="px-5 py-3 text-right font-medium">
                <span className="sr-only">Change status</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => {
              const reference = orderReference(order.id);
              return (
                <tr key={order.id}>
                  <td className="px-5 py-4 font-medium text-text-primary">{reference}</td>
                  <td className="px-5 py-4 text-text-muted">{order.email}</td>
                  <td className="px-5 py-4 text-text-muted">{formatDate(order.created_at)}</td>
                  <td className="px-5 py-4 text-right tabular-nums text-text-primary">
                    {formatPrice(order.total_cents)}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_VARIANT[order.status]} size="sm">
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <StatusSelect
                      orderId={order.id}
                      reference={reference}
                      status={order.status}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 lg:hidden">
        {orders.map((order) => {
          const reference = orderReference(order.id);
          return (
            <li key={order.id} className="rounded-md border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-text-primary">{reference}</p>
                  <p className="mt-1 break-words text-sm text-text-muted">{order.email}</p>
                  <p className="mt-1 text-sm text-text-muted">{formatDate(order.created_at)}</p>
                </div>
                <p className="shrink-0 font-display font-semibold text-text-primary">
                  {formatPrice(order.total_cents)}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <Badge variant={STATUS_VARIANT[order.status]} size="sm">
                  {order.status}
                </Badge>
                <StatusSelect orderId={order.id} reference={reference} status={order.status} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
