'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * The order row is written by the Stripe webhook, which usually lands within a
 * second of the redirect — but not always. Refresh until it appears.
 */
export function OrderPoller({ intervalMs = 2000, maxAttempts = 10 }) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let attempts = 0;

    const id = setInterval(() => {
      attempts += 1;
      router.refresh();

      if (attempts >= maxAttempts) {
        clearInterval(id);
        setTimedOut(true);
      }
    }, intervalMs);

    return () => clearInterval(id);
  }, [router, intervalMs, maxAttempts]);

  if (!timedOut) return null;

  return (
    <p className="mt-6 text-sm text-text-muted">
      Taking longer than usual. The payment went through — check{' '}
      <Link href="/account" className="font-medium text-text-primary underline underline-offset-4">
        your orders
      </Link>{' '}
      in a moment.
    </p>
  );
}
