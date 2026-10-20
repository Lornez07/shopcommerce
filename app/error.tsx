'use client';

import { Container, Button } from '@/components/ui';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="py-24 text-center">
      <h1 className="font-display text-4xl font-bold text-text-primary">
        Something broke.
      </h1>
      <p className="mt-4 text-lg text-text-muted">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <div className="mt-8">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      </div>
    </Container>
  );
}