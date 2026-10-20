import { PageSkeleton } from '@/components/ui';

// Scoped to this route group so `/` keeps its skeleton without putting a
// Suspense boundary over /category and /product, which must be able to 404.
export default function Loading() {
  return <PageSkeleton columns={3} />;
}
