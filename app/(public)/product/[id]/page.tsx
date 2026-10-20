import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Container } from '@/components/ui';
import { ProductGallery } from '@/components/product/ProductGallery';
import { AddToCartForm } from '@/components/product/AddToCartForm';
import { getProductById, type Product } from '@/lib/actions/products';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params
}: {
  params: { id: string };
}): Promise<Metadata> {
  let product: Product | null = null;
  let failed = false;

  try {
    product = await getProductById(params.id);
  } catch {
    failed = true;
  }

  // Same 404-before-flush rule as the category route: resolve the miss here so
  // the response carries a real 404 status.
  if (!failed && !product) {
    notFound();
  }

  return { title: product ? product.name : 'Product' };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  let product: Product | null = null;
  let loadError: string | null = null;

  try {
    product = await getProductById(params.id);
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Something went wrong.';
  }

  if (!loadError && !product) {
    notFound();
  }

  if (loadError || !product) {
    return (
      <Container className="py-16">
        <h1 className="font-display text-3xl font-bold text-text-primary">
          We could not load this product.
        </h1>
        <p className="mt-3 text-text-muted">
          Something went wrong on our side. Try again in a moment.
        </p>
        <Link
          href="/category/all"
          className="mt-6 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Browse all products
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-text-muted">
        <Link href="/" className="transition-colors hover:text-text-primary">
          Home
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <Link href="/category/all" className="transition-colors hover:text-text-primary">
          All products
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-text-primary">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <ProductGallery images={product.images ?? []} name={product.name} />

        <div className="lg:pt-2">
          <h1 className="text-balance font-display text-2xl font-semibold leading-snug text-text-primary">
            {product.name}
          </h1>
          <p className="mt-2 font-display text-[2rem] font-bold leading-tight text-primary">
            {formatPrice(product.base_price_cents)}
          </p>
          {product.description ? (
            <p className="mt-5 leading-relaxed text-text-muted">{product.description}</p>
          ) : null}

          <div className="mt-8">
            <AddToCartForm
              productId={product.id}
              productName={product.name}
              variants={product.variants ?? {}}
            />
          </div>
        </div>
      </div>
    </Container>
  );
}