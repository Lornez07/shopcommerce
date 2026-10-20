'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, showToast } from '@/components/ui';
import { createAddress, updateAddress, type Address } from '@/lib/actions/addresses';

type FormValues = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
};

type AddressFormProps = {
  address?: Address;
  onDone: () => void;
  onCancel: () => void;
};

export function AddressForm({ address, onDone, onCancel }: AddressFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>({
    name: address?.name ?? '',
    line1: address?.line1 ?? '',
    line2: address?.line2 ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    postal_code: address?.postal_code ?? '',
    is_default: address?.is_default ?? false
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function update(field: keyof FormValues, value: string | boolean) {
    setValues((prev) => {
      const next = { ...prev };
      if (field === 'is_default') {
        next.is_default = value === true;
      } else {
        next[field] = String(value);
      }
      return next;
    });

    setFieldErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    setFormError(null);
    setIsPending(true);

    try {
      const result = address
        ? await updateAddress(address.id, values)
        : await createAddress(values);

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setFormError(result.error);
        return;
      }

      showToast('success', address ? 'Address updated' : 'Address saved');
      router.refresh();
      onDone();
    } catch {
      setFormError('Could not save the address. Check your connection and try again.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-border bg-surface p-5"
      noValidate
    >
      <h3 className="font-display text-lg font-semibold text-text-primary">
        {address ? 'Edit address' : 'New address'}
      </h3>

      <div className="mt-4 space-y-4">
        <Input
          label="Recipient"
          value={values.name}
          onChange={(event) => update('name', event.target.value)}
          error={fieldErrors.name}
          autoComplete="name"
          required
        />

        <Input
          label="Street address"
          value={values.line1}
          onChange={(event) => update('line1', event.target.value)}
          error={fieldErrors.line1}
          autoComplete="address-line1"
          required
        />

        <Input
          label="Apartment, suite (optional)"
          value={values.line2}
          onChange={(event) => update('line2', event.target.value)}
          error={fieldErrors.line2}
          autoComplete="address-line2"
        />

        <Input
          label="City"
          value={values.city}
          onChange={(event) => update('city', event.target.value)}
          error={fieldErrors.city}
          autoComplete="address-level2"
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="State"
            value={values.state}
            onChange={(event) => update('state', event.target.value.toUpperCase())}
            error={fieldErrors.state}
            autoComplete="address-level1"
            maxLength={2}
            placeholder="CA"
            required
          />
          <Input
            label="Postcode"
            value={values.postal_code}
            onChange={(event) => update('postal_code', event.target.value)}
            error={fieldErrors.postal_code}
            autoComplete="postal-code"
            inputMode="numeric"
            placeholder="94110"
            required
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={values.is_default}
            onChange={(event) => update('is_default', event.target.checked)}
            className="h-4 w-4 rounded-sm border-border text-primary focus:ring-2 focus:ring-secondary focus:ring-offset-2"
          />
          Use as my default address
        </label>
      </div>

      {formError ? (
        <p role="alert" className="mt-4 text-sm text-error">
          {formError}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" size="lg" isLoading={isPending}>
          {address ? 'Save changes' : 'Save address'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
