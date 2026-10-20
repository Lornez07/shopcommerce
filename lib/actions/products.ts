import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cache } from 'react';

export type ProductVariant = {
  sizes?: string[];
  colors?: { name: string; hex: string }[];
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  base_price_cents: number;
  images: string[];
  variants: ProductVariant;
  is_active: boolean;
};

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type CategoryPageData = {
  category: CategorySummary | null;
  products: Product[];
};

/**
 * Returns null when the slug does not exist (page should call notFound()).
 * slug === 'all' returns every active product with a null category.
 */
export const getProductsForCategory = cache(async function getProductsForCategory(
  slug: string
): Promise<CategoryPageData | null> {
  const supabase = await createSupabaseServerClient();

  let category: CategorySummary | null = null;

  if (slug !== 'all') {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      throw new Error(`Could not load category: ${error.message}`);
    }
    if (!data) return null;

    category = data as CategorySummary;
  }

  let query = supabase
    .from('products')
    .select('id, category_id, name, slug, description, base_price_cents, images, variants, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (category) {
    query = query.eq('category_id', category.id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Could not load products: ${error.message}`);
  }

  return { category, products: (data ?? []) as Product[] };
});

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getProductById = cache(async function getProductById(
  id: string
): Promise<Product | null> {
  // A malformed id reaches Postgres as an invalid uuid cast and surfaces as a
  // database error. Treat it as "no such product" so the page can 404 instead.
  if (!UUID_PATTERN.test(id)) return null;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('products')
    .select('id, category_id, name, slug, description, base_price_cents, images, variants, is_active')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load product: ${error.message}`);
  }

  return (data as Product | null) ?? null;
});