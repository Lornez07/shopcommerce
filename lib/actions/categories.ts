import { createSupabaseServerClient } from '@/lib/supabase/server';

export type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  product_count: number;
};

type CategoryRow = Omit<CategoryWithCount, 'product_count'>;
type ProductCategoryRow = { category_id: string | null };

/**
 * Categories plus a count of active products in each.
 * Two queries instead of an embedded count so inactive products are excluded
 * from the number shown on the card.
 */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const supabase = await createSupabaseServerClient();

  const [categoriesResult, productsResult] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug, description, image_url, sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase.from('products').select('category_id').eq('is_active', true)
  ]);

  if (categoriesResult.error) {
    throw new Error(`Could not load categories: ${categoriesResult.error.message}`);
  }
  if (productsResult.error) {
    throw new Error(`Could not count products: ${productsResult.error.message}`);
  }

  const categories = (categoriesResult.data ?? []) as CategoryRow[];
  const products = (productsResult.data ?? []) as ProductCategoryRow[];

  const counts = new Map<string, number>();
  for (const product of products) {
    if (!product.category_id) continue;
    counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1);
  }

  return categories.map((category) => ({
    ...category,
    product_count: counts.get(category.id) ?? 0
  }));
}