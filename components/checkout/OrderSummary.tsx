import Image from 'next/image';
import type { CartLine } from '@/lib/actions/cart';
import { formatPrice } from '@/lib/utils';

type Props = {
  items: CartLine[];
  subtotalCents: number;
  shippingCents: number;
};

function variantLabel(variant: CartLine['variant']): string | null {
  const parts = [variant.size, variant.color].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(' · ') : null;
}

function SummaryBody({ items, subtotalCents, shippingCents }: Props) {
  const totalCents = subtotalCents + shippingCents;

  return (
    <>
      <ul className="divide-y divide-border">
        {items.map((item) => {
          const label = variantLabel(item.variant);
          return (
            <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-sm bg-background">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-border" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug text-text-primary">
                  {item.product_name}
                </p>
                {label ? <p className="mt-0.5 text-xs text-text-muted">{label}</p> : null}
                <p className="mt-0.5 text-xs text-text-muted">Qty {item.quantity}</p>
              </div>

              <p className="shrink-0 text-sm tabular-nums text-text-primary">
                {formatPrice(item.line_total_cents)}
              </p>
            </li>
          );
        })}
      </ul>

      <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-text-muted">Subtotal</dt>
          <dd className="tabular-nums text-text-primary">{formatPrice(subtotalCents)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-text-muted">Shipping</dt>
          <dd className="tabular-nums text-text-primary">{formatPrice(shippingCents)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
          <dt className="font-display text-base font-semibold text-text-primary">Total</dt>
          <dd className="font-display text-base font-semibold tabular-nums text-text-primary">
            {formatPrice(totalCents)}
          </dd>
        </div>
      </dl>
    </>
  );
}

/**
 * Collapsible on mobile, sticky rail on desktop. Both branches render the same
 * body — a native <details> means no JavaScript and no hydration mismatch.
 */
export function OrderSummary(props: Props) {
  const totalCents = props.subtotalCents + props.shippingCents;

  return (
    <>
      <details className="rounded-md border border-border bg-surface px-5 py-4 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <span className="font-display text-base font-semibold text-text-primary">
            Order summary
          </span>
          <span className="flex items-center gap-2">
            <span className="font-display text-base font-semibold tabular-nums text-text-primary">
              {formatPrice(totalCents)}
            </span>
            <svg
              className="h-4 w-4 text-text-muted"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </summary>

        <div className="mt-4">
          <SummaryBody {...props} />
        </div>
      </details>

      <aside className="hidden lg:sticky lg:top-24 lg:order-2 lg:block lg:self-start">
        <div className="rounded-md border border-border bg-surface p-6">
          <h2 className="font-display text-xl font-semibold text-text-primary">Order summary</h2>
          <div className="mt-4">
            <SummaryBody {...props} />
          </div>
        </div>
      </aside>
    </>
  );
}
