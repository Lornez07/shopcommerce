import { Container } from './Container';

/**
 * Shared route skeleton.
 *
 * Deliberately NOT installed as `app/(public)/loading.tsx`: a Suspense boundary
 * at that level makes Next flush the shell before the page resolves, so
 * `notFound()` renders the 404 UI under a 200 status. Routes that can 404
 * (category, product) stay unbounded so the status is correct; the routes that
 * cannot 404 opt in here.
 */
export function PageSkeleton({ columns = 4 }: { columns?: 2 | 3 | 4 }) {
  const grid =
    columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : columns === 3
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <Container className="py-12">
      <div className="animate-pulse space-y-6" aria-hidden="true">
        <div className="h-10 w-64 rounded-sm bg-border" />
        <div className={'grid gap-6 ' + grid}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[16/10] rounded-md bg-border" />
              <div className="h-5 w-3/4 rounded-sm bg-border" />
              <div className="h-4 w-1/2 rounded-sm bg-border" />
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
