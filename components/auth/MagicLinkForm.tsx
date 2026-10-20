'use client';

import { useState, type FormEvent } from 'react';
import { Button, Input } from '@/components/ui';
import { signInWithMagicLink } from '@/lib/actions/auth';

export function MagicLinkForm({ redirectTo }: { redirectTo: string }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    setError(null);
    setIsPending(true);

    try {
      const result = await signInWithMagicLink(email, redirectTo);
      if (result.ok) {
        setSent(true);
      } else {
        setError(result.error);
      }
    } catch {
      setError('Could not send the link. Check your connection and try again.');
    } finally {
      setIsPending(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-sm rounded-md border border-border bg-surface p-6">
        <p className="font-display text-xl font-semibold text-text-primary">Check your email</p>
        <p className="mt-2 text-sm text-text-muted">
          We sent a sign-in link to <span className="font-medium text-text-primary">{email}</span>.
          It expires in one hour.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <Input
        label="Email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={error ?? undefined}
      />
      <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isPending}>
        Send sign-in link
      </Button>
      <p className="text-sm text-text-muted">
        We only use your email to send the link and order receipts.
      </p>
    </form>
  );
}
