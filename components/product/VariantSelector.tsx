'use client';

import { cn } from '@/lib/utils';
import type { ProductVariant } from '@/lib/actions/products';

type VariantSelectorProps = {
  variants: ProductVariant;
  size: string | null;
  color: string | null;
  onSizeChange: (value: string) => void;
  onColorChange: (value: string) => void;
  showErrors: boolean;
};

export function VariantSelector({
  variants,
  size,
  color,
  onSizeChange,
  onColorChange,
  showErrors
}: VariantSelectorProps) {
  const sizes = variants.sizes ?? [];
  const colors = variants.colors ?? [];

  if (sizes.length === 0 && colors.length === 0) return null;

  return (
    <div className="space-y-6">
      {sizes.length > 0 ? (
        <fieldset>
          <legend className="text-sm font-medium text-text-primary">Size</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onSizeChange(option)}
                aria-pressed={size === option}
                className={cn(
                  'rounded-sm border px-3 py-1.5 text-sm transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2',
                  size === option
                    ? 'border-text-primary bg-text-primary text-white'
                    : 'border-border bg-surface text-text-primary hover:border-text-muted'
                )}
              >
                {option}
              </button>
            ))}
          </div>
          {showErrors && !size ? (
            <p className="mt-2 text-sm text-error" role="alert">
              Pick a size.
            </p>
          ) : null}
        </fieldset>
      ) : null}

      {colors.length > 0 ? (
        <fieldset>
          <legend className="text-sm font-medium text-text-primary">Colour</legend>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
            {colors.map((option) => {
              const selected = color === option.name;
              return (
                <button
                  key={option.name}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={option.name}
                  title={option.name}
                  onClick={() => onColorChange(option.name)}
                  className={cn(
                    'h-10 w-10 rounded-full border-2 transition-all duration-150 ease-spring',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2',
                    selected
                      ? 'scale-105 border-text-primary ring-2 ring-text-primary ring-offset-2'
                      : 'border-border hover:border-text-muted'
                  )}
                  style={{ backgroundColor: option.hex }}
                />
              );
            })}
          </div>
          {color ? <p className="mt-2 text-sm text-text-muted">{color}</p> : null}
          {showErrors && !color ? (
            <p className="mt-1 text-sm text-error" role="alert">
              Pick a colour.
            </p>
          ) : null}
        </fieldset>
      ) : null}
    </div>
  );
}