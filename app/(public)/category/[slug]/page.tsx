import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui';
import { ProductCard } from '@/components/product/ProductCard';
import { getProductsForCategory, type CategoryPageData } from '@/lib/actions/products';

export const dynamic = 'force-dynamic';

// Routes that can 404 deliberately sit outside a Suspense boundary: there is no
// `(public)/loading.tsx` (see `components/ui/PageSkeleton.tsx` for why). With a
// boundary in place Next flushes the shell with a 200 before the page body runs,
// so `notFound()` renders the 404 UI under the wrong status. Resolving the miss
// in metadata means it happens before any HTML is written. The lookup is
// `cache()`d, so the page still issues a single query.
export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  let data: CategoryPageData | null = null;
  let failed = false;

  try {
    data = await getProductsForCategory(params.slug);
  } catch {
    // The page renders its own error state; do not turn a database outage into a 404.
    failed = true;
  }

  if (!failed && !data && params.slug !== 'all') {
    notFound();
  }

  const name = data?.category?.name ?? (params.slug === 'all' ? 'All products' : 'Products');

  return {
    // The root layout applies the "%s | ShopCommerce" template.
    title: name,
    description:
      data?.category?.description ??
      'Everything currently in stock, across every category.'
  };
}


export default async function CategoryPage({ params }: { params: { slug: string } }) {
  let data: CategoryPageData | null = null;
  let loadError: string | null = null;

  try {
    data = await getProductsForCategory(params.slug);
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Something went wrong.';
  }

  if (!loadError && !data) {
    notFound();
  }

  const category = data?.category ?? null;
  const products = data?.products ?? [];
  const heading = category?.name ?? 'All products';
  const isAll = params.slug === 'all';

  return (
    <Container className="py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link
          href="/"
          className="text-text-muted transition-colors duration-150 hover:text-text-primary"
        >
          ← All categories
        </Link>
      </nav>

      <header className="mt-4 max-w-2xl">
        <h1 className="text-balance font-display text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
          {loadError ? 'Products' : heading}
        </h1>
        <p className="mt-3 text-text-muted">
          {loadError
            ? 'We could not load this category.'
            : category?.description ??
              'Everything currently in stock, across every category.'}
        </p>
      </header>

      {loadError ? (
        <div role="alert" className="mt-8 rounded-md border border-error/30 bg-surface p-6">
          <p className="font-medium text-text-primary">We could not load the products.</p>
          <p className="mt-2 text-sm text-text-muted">{loadError}</p>
          <p className="mt-4 text-sm text-text-muted">
            Refresh to try again. If it keeps failing, confirm the Supabase environment
            variables in .env.local.
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="mt-8 rounded-md border border-dashed border-border bg-surface p-8 text-center">
          <p className="font-display text-xl font-semibold text-text-primary">
            Nothing here yet.
          </p>
          <p className="mt-2 text-sm text-text-muted">
            {isAll
              ? 'No products are in stock right now.'
              : 'This category is empty. The shelves are being filled.'}
          </p>
          <Link
            href="/category/all"
            className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Browse all products
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-text-muted">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
          <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-8 min-[481px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </>
      )}
    </Container>
  );
}