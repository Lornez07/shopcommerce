'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, showToast } from '@/components/ui';
import { AddressForm } from '@/components/account/AddressForm';
import { deleteAddress, setDefaultAddress, type Address } from '@/lib/actions/addresses';

type Mode = { kind: 'idle' } | { kind: 'create' } | { kind: 'edit'; address: Address };

export function AddressManager({ initial }: { initial: Address[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setPendingId(id);

    try {
      const result = await deleteAddress(id);
      if (!result.ok) {
        showToast('error', 'Could not delete address', { description: result.error });
        return;
      }
      showToast('success', 'Address deleted');
      setConfirmingId(null);
      router.refresh();
    } catch {
      showToast('error', 'Could not delete address', {
        description: 'Check your connection and try again.'
      });
    } finally {
      setPendingId(null);
    }
  }

  async function handleDefault(id: string) {
    setPendingId(id);

    try {
      const result = await setDefaultAddress(id);
      if (!result.ok) {
        showToast('error', 'Could not change default', { description: result.error });
        return;
      }
      showToast('success', 'Default address updated');
      router.refresh();
    } catch {
      showToast('error', 'Could not change default', {
        description: 'Check your connection and try again.'
      });
    } finally {
      setPendingId(null);
    }
  }

  const isEditing = mode.kind !== 'idle';

  return (
    <div>
      {initial.length === 0 && !isEditing ? (
        <div className="rounded-md border border-border bg-surface p-6">
          <p className="font-medium text-text-primary">No addresses saved.</p>
          <p className="mt-1 text-sm text-text-muted">
            Add one now and checkout gets a lot shorter.
          </p>
        </div>
      ) : null}

      {initial.length > 0 ? (
        <ul className="space-y-3">
          {initial.map((address) => (
            <li key={address.id} className="rounded-md border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-text-primary">{address.name}</p>
                  <p className="mt-1 text-text-muted">
                    {address.line1}
                    {address.line2 ? ', ' + address.line2 : ''}
                  </p>
                  <p className="text-text-muted">
                    {address.city}, {address.state} {address.postal_code}
                  </p>
                </div>
                {address.is_default ? (
                  <Badge variant="default" size="sm">
                    Default
                  </Badge>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => setMode({ kind: 'edit', address })}
                  className="py-1 font-medium text-text-muted underline-offset-4 transition-colors hover:text-text-primary hover:underline"
                >
                  Edit
                </button>

                {!address.is_default ? (
                  <button
                    type="button"
                    onClick={() => handleDefault(address.id)}
                    disabled={pendingId === address.id}
                    className="py-1 font-medium text-text-muted underline-offset-4 transition-colors hover:text-text-primary hover:underline disabled:opacity-40"
                  >
                    Set as default
                  </button>
                ) : null}

                {confirmingId === address.id ? (
                  <span className="ml-auto flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(address.id)}
                      disabled={pendingId === address.id}
                      className="py-1 font-medium text-error underline-offset-4 hover:underline disabled:opacity-40"
                    >
                      {pendingId === address.id ? 'Deleting…' : 'Confirm delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="py-1 font-medium text-text-muted underline-offset-4 hover:text-text-primary hover:underline"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(address.id)}
                    className="ml-auto py-1 font-medium text-text-muted underline-offset-4 transition-colors hover:text-error hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {mode.kind === 'create' ? (
        <div className="mt-4">
          <AddressForm
            onDone={() => setMode({ kind: 'idle' })}
            onCancel={() => setMode({ kind: 'idle' })}
          />
        </div>
      ) : null}

      {mode.kind === 'edit' ? (
        <div className="mt-4">
          <AddressForm
            address={mode.address}
            onDone={() => setMode({ kind: 'idle' })}
            onCancel={() => setMode({ kind: 'idle' })}
          />
        </div>
      ) : null}

      {!isEditing ? (
        <div className="mt-4">
          <Button
            variant={initial.length === 0 ? 'primary' : 'secondary'}
            size="lg"
            onClick={() => setMode({ kind: 'create' })}
          >
            Add address
          </Button>
        </div>
      ) : null}
    </div>
  );
}
