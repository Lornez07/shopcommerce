import Image from 'next/image';
import Link from 'next/link';
import type { CategoryWithCount } from '@/lib/actions/categories';

export function CategoryCard({ category }: { category: CategoryWithCount }) {
  const count = category.product_count;
  const countLabel =
    count === 0 ? 'No products yet' : `${count} ${count === 1 ? 'product' : 'products'}`;

  return (
    <Link
      href={`/category/${category.slug}`}
      className="group block overflow-hidden rounded-md border border-border bg-surface shadow-sm transition-all duration-150 ease-spring hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[16/10] bg-border">
        {category.image_url ? (
          <Image
            src={category.image_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 481px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 ease-spring group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="p-4">
        <h2 className="font-display text-xl font-semibold text-text-primary">{category.name}</h2>
        <p className="mt-1 text-sm text-text-muted">{countLabel}</p>
      </div>
    </Link>
  );
}