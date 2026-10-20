'use client';

import { useState } from 'react';
import Link from 'next/link';
import { showToast } from '@/components/ui';
import { useCart } from '@/hooks/useCart';
import {
  removeCartItem,
  updateCartItemQuantity,
  type CartLine,
  type CartSummary as CartSummaryData
} from '@/lib/actions/cart';
import { CartItem } from '@/components/cart/CartItem';
import { CartTotals } from '@/components/cart/CartTotals';

function recalculate(items: CartLine[]): CartSummaryData {
  return {
    items,
    item_count: items.reduce((total, item) => total + item.quantity, 0),
    subtotal_cents: items.reduce(
      (total, item) => total + item.unit_price_cents * item.quantity,
      0
    )
  };
}

export function CartView({ initial }: { initial: CartSummaryData }) {
  const [cart, setCart] = useState(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { sync } = useCart();

  function commit(next: CartSummaryData) {
    setCart(next);
    sync(next);
  }

  async function handleQuantity(item: CartLine, quantity: number) {
    if (quantity < 1 || quantity > 99 || pendingId === item.id) return;

    const previous = cart;
    setPendingId(item.id);

    // Optimistic: the stepper must feel instant, server confirms after.
    commit(
      recalculate(
        cart.items.map((line) =>
          line.id === item.id
            ? { ...line, quantity, line_total_cents: line.unit_price_cents * quantity }
            : line
        )
      )
    );

    try {
      const result = await updateCartItemQuantity(item.id, quantity);
      if (!result.ok) {
        commit(previous);
        showToast('error', 'Could not update quantity', { description: result.error });
        return;
      }
      commit(result.data);
    } catch {
      commit(previous);
      showToast('error', 'Could not update quantity', {
        description: 'Check your connection and try again.'
      });
    } finally {
      setPendingId(null);
    }
  }

  async function handleRemove(item: CartLine) {
    if (pendingId === item.id) return;

    const previous = cart;
    setPendingId(item.id);
    commit(recalculate(cart.items.filter((line) => line.id !== item.id)));

    try {
      const result = await removeCartItem(item.id);
      if (!result.ok) {
        commit(previous);
        showToast('error', 'Could not remove item', { description: result.error });
        return;
      }
      commit(result.data);
      showToast('success', 'Removed from cart', { description: item.product_name });
    } catch {
      commit(previous);
      showToast('error', 'Could not remove item', {
        description: 'Check your connection and try again.'
      });
    } finally {
      setPendingId(null);
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h2 className="font-display text-2xl font-bold text-text-primary">
          Your cart's lonely. Fix that.
        </h2>
        <p className="mt-2 text-text-muted">
          Nothing in here yet. Pick a category and add something worth keeping.
        </p>
        <Link
          href="/category/all"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-primary px-6 text-lg font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
        >
          Browse categories
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,0.85fr)] lg:gap-12">
      <ul className="divide-y divide-border border-y border-border">
        {cart.items.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            isPending={pendingId === item.id}
            onQuantityChange={(quantity) => handleQuantity(item, quantity)}
            onRemove={() => handleRemove(item)}
          />
        ))}
      </ul>

      <CartTotals itemCount={cart.item_count} subtotalCents={cart.subtotal_cents} />
    </div>
  );
}
