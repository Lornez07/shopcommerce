import { Container } from '@/components/ui';
import { CategoryCard } from '@/components/product/CategoryCard';
import { getCategoriesWithCounts, type CategoryWithCount } from '@/lib/actions/categories';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  return Boolean((data as { is_admin?: boolean } | null)?.is_admin);
}

export default async function HomePage() {
  let categories: CategoryWithCount[] = [];
  let loadError: string | null = null;

  try {
    categories = await getCategoriesWithCounts();
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Something went wrong.';
  }

  const isAdmin = loadError ? false : await isCurrentUserAdmin();

  return (
    <Container className="py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-text-muted">
          Small-batch kitchenware
        </p>
        <h1 className="mt-3 text-balance font-display text-4xl font-bold leading-[1.05] text-text-primary sm:text-5xl">
          Kitchen things worth keeping.
        </h1>
        <p className="mt-4 text-lg text-text-muted">
          Mugs, linens, pantry staples and tools from small workshops. Every order ships in
          two to four days.
        </p>
      </header>

      <section className="mt-10 sm:mt-14" aria-labelledby="categories-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2
            id="categories-heading"
            className="font-display text-2xl font-semibold text-text-primary"
          >
            Shop by category
          </h2>
          {categories.length > 0 ? (
            <p className="text-sm text-text-muted">
              {categories.length} {categories.length === 1 ? 'category' : 'categories'}
            </p>
          ) : null}
        </div>

        {loadError ? (
          <div role="alert" className="mt-6 rounded-md border border-error/30 bg-surface p-6">
            <p className="font-medium text-text-primary">We could not load the categories.</p>
            <p className="mt-2 text-sm text-text-muted">{loadError}</p>
            <p className="mt-4 text-sm text-text-muted">
              Refresh to try again. If it keeps failing, check that
              <code className="mx-1 rounded-sm bg-background px-1 py-0.5 font-mono text-xs">
                NEXT_PUBLIC_SUPABASE_URL
              </code>
              and the anon key are set in .env.local.
            </p>
          </div>
        ) : categories.length === 0 ? (
          <div className="mt-6 rounded-md border border-dashed border-border bg-surface p-8 text-center">
            <p className="font-display text-xl font-semibold text-text-primary">
              No categories yet.
            </p>
            <p className="mt-2 text-sm text-text-muted">
              {isAdmin
                ? 'Add your first category in Supabase, then refresh.'
                : 'Check back soon — the shelves are being filled.'}
            </p>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-6 min-[481px]:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id}>
                <CategoryCard category={category} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}