'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, showToast } from '@/components/ui';
import { VariantSelector } from '@/components/product/VariantSelector';
import { useCart } from '@/hooks/useCart';
import type { ProductVariant } from '@/lib/actions/products';

type AddToCartFormProps = {
  productId: string;
  productName: string;
  variants: ProductVariant;
};

export function AddToCartForm({ productId, productName, variants }: AddToCartFormProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const sizes = variants.sizes ?? [];
  const colors = variants.colors ?? [];
  const missingSize = sizes.length > 0 && !size;
  const missingColor = colors.length > 0 && !color;
  const isIncomplete = missingSize || missingColor;

  const missingLabel = [missingSize ? 'a size' : null, missingColor ? 'a colour' : null]
    .filter(Boolean)
    .join(' and ');

  async function handleAddToCart() {
    if (isPending || isIncomplete) return;
    setIsPending(true);

    try {
      const result = await addItem(
        productId,
        {
          ...(size ? { size } : {}),
          ...(color ? { color } : {})
        },
        1
      );

      if (result.ok) {
        showToast('success', 'Added to cart', { description: productName });
        return;
      }

      if (result.needsAuth) {
        showToast('info', 'Sign in to add items', { description: 'We will bring you right back.' });
        router.push('/login?redirect=' + encodeURIComponent('/product/' + productId));
        return;
      }

      showToast('error', 'Could not add to cart', { description: result.error });
    } catch {
      showToast('error', 'Could not add to cart', {
        description: 'Check your connection and try again.'
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <VariantSelector
        variants={variants}
        size={size}
        color={color}
        onSizeChange={setSize}
        onColorChange={setColor}
        showErrors={false}
      />

      {isIncomplete ? (
        <p className="text-sm text-text-muted">Select {missingLabel} to continue.</p>
      ) : null}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleAddToCart}
        disabled={isIncomplete}
        isLoading={isPending}
      >
        Add to cart
      </Button>

      <p className="text-sm text-text-muted">
        Ships in 2–4 days. Returns accepted within 30 days.
      </p>
    </div>
  );
}
