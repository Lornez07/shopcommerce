'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { signOut } from '@/lib/actions/auth';

export function AdminSignOut() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);
    try {
      await signOut();
      router.push('/');
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut} isLoading={isPending}>
      Sign out
    </Button>
  );
}
