import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/lib/actions/products';

export function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0];

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-border bg-border shadow-sm transition-shadow duration-150 ease-spring group-hover:shadow-md">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 1025px) 25vw, (min-width: 769px) 33vw, (min-width: 481px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 ease-spring group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="text-base font-medium leading-snug text-text-primary">{product.name}</h3>
        <p className="shrink-0 font-display text-lg font-semibold text-text-primary">
          {formatPrice(product.base_price_cents)}
        </p>
      </div>
    </Link>
  );
}