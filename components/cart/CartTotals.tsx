'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { FLAT_SHIPPING_CENTS, US_POSTCODE_PATTERN } from '@/lib/shipping';
import { formatPrice } from '@/lib/utils';

export function CartTotals({
  itemCount,
  subtotalCents
}: {
  itemCount: number;
  subtotalCents: number;
}) {
  const [postcode, setPostcode] = useState('');
  const [delivery, setDelivery] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalCents = subtotalCents + FLAT_SHIPPING_CENTS;

  function handleCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = postcode.trim();

    if (!US_POSTCODE_PATTERN.test(value)) {
      setDelivery(null);
      setError('Enter a 5-digit US postcode.');
      return;
    }

    setError(null);
    setDelivery(value);
  }

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-md border border-border bg-surface p-6">
        <h2 className="font-display text-xl font-semibold text-text-primary">Order summary</h2>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-text-muted">
              Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </dt>
            <dd className="tabular-nums text-text-primary">{formatPrice(subtotalCents)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-text-muted">Shipping</dt>
            <dd className="tabular-nums text-text-primary">
              {formatPrice(FLAT_SHIPPING_CENTS)}
              <span className="ml-1 text-text-muted">flat</span>
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-border pt-4">
          <span className="font-display text-lg font-semibold text-text-primary">Total</span>
          <span className="font-display text-lg font-semibold tabular-nums text-text-primary">
            {formatPrice(totalCents)}
          </span>
        </div>

        <form onSubmit={handleCheck} className="mt-6">
          <label htmlFor="postcode" className="text-sm font-medium text-text-primary">
            Delivery postcode
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="postcode"
              name="postcode"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="94110"
              value={postcode}
              onChange={(event) => {
                setPostcode(event.target.value);
                setError(null);
              }}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'postcode-error' : delivery ? 'postcode-ok' : undefined}
              className="h-11 w-full min-w-0 rounded-sm border border-border bg-surface px-3 text-text-primary placeholder:text-text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <button
              type="submit"
              className="h-11 shrink-0 rounded-sm border border-border px-3 text-sm font-medium text-text-primary transition-colors hover:border-text-muted"
            >
              Check
            </button>
          </div>

          {error ? (
            <p id="postcode-error" role="alert" className="mt-2 text-sm text-error">
              {error}
            </p>
          ) : delivery ? (
            <p id="postcode-ok" className="mt-2 text-sm text-success">
              Delivers to {delivery} in 2–4 days.
            </p>
          ) : (
            <p className="mt-2 text-sm text-text-muted">Flat $5.00 anywhere in the US.</p>
          )}
        </form>

        <Link
          href="/checkout"
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-6 text-lg font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
        >
          Proceed to checkout
        </Link>

        <Link
          href="/category/all"
          className="mt-3 block text-center text-sm font-medium text-text-muted underline-offset-4 transition-colors hover:text-text-primary hover:underline"
        >
          Continue shopping
        </Link>
      </div>
    </aside>
  );
}
