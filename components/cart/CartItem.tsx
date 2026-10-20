'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import type { CartLine } from '@/lib/actions/cart';

type CartItemProps = {
  item: CartLine;
  isPending: boolean;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
};

export function CartItem({ item, isPending, onQuantityChange, onRemove }: CartItemProps) {
  const variantLabel = [item.variant.size, item.variant.color].filter(Boolean).join(' · ');

  return (
    <li className={cn('flex gap-4 py-5 transition-opacity duration-150', isPending && 'opacity-60')}>
      <Link
        href={'/product/' + item.product_id}
        aria-label={'View ' + item.product_name}
        className="relative h-24 w-20 shrink-0 overflow-hidden rounded-sm border border-border bg-border"
      >
        {item.image_url ? (
          <Image src={item.image_url} alt="" fill sizes="96px" className="object-cover" />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={'/product/' + item.product_id}
              className="font-display text-base font-semibold text-text-primary transition-colors hover:text-primary"
            >
              {item.product_name}
            </Link>
            {variantLabel ? <p className="mt-1 text-sm text-text-muted">{variantLabel}</p> : null}
            <p className="mt-1 text-sm text-text-muted">
              {formatPrice(item.unit_price_cents)} each
            </p>
          </div>

          <p className="shrink-0 font-display text-base font-semibold text-text-primary">
            {formatPrice(item.line_total_cents)}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4 lg:justify-start lg:gap-6">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => onQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1 || isPending}
              aria-label={'Decrease quantity of ' + item.product_name}
              className="flex h-12 w-12 items-center justify-center rounded-sm border border-border text-text-muted transition-colors hover:border-text-muted hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>

            <span className="w-9 text-center text-sm font-medium tabular-nums" aria-live="polite">
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={() => onQuantityChange(item.quantity + 1)}
              disabled={item.quantity >= 99 || isPending}
              aria-label={'Increase quantity of ' + item.product_name}
              className="flex h-12 w-12 items-center justify-center rounded-sm border border-border text-text-muted transition-colors hover:border-text-muted hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={onRemove}
            disabled={isPending}
            className="rounded-sm px-1 py-2 text-sm font-medium text-text-muted underline-offset-4 transition-colors hover:text-error hover:underline disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
