import type { Metadata } from 'next';
import { Container } from '@/components/ui';
import { CartView } from '@/components/cart/CartView';
import { getCartSummary } from '@/lib/actions/cart';

export const metadata: Metadata = {
  title: 'Cart'
};

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const cart = await getCartSummary();

  const countLabel =
    cart.item_count === 0
      ? 'Nothing here yet.'
      : cart.item_count + (cart.item_count === 1 ? ' item ready to go.' : ' items ready to go.');

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="font-display text-3xl font-bold text-text-primary">Your cart</h1>
      <p className="mt-2 text-text-muted">{countLabel}</p>

      <div className="mt-8">
        <CartView initial={cart} />
      </div>
    </Container>
  );
}
