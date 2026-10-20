'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-text-primary mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-text-primary',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent',
            'disabled:bg-background disabled:cursor-not-allowed',
            error && 'border-error focus:ring-error',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-sm text-error" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${selectId}-hint`} className="mt-1.5 text-sm text-text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

interface ColorSwatchProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  name: string;
}

export function ColorSwatch({ options, value, onChange, disabled, error, label, name }: ColorSwatchProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              onClick={() => !disabled && onChange(option.value)}
              disabled={disabled}
              className={cn(
                'relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-150 ease-spring',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                selected
                  ? 'border-text-primary shadow-md scale-105'
                  : 'border-border hover:border-text-muted/50',
                error && 'border-error'
              )}
              style={{ backgroundColor: option.color }}
              title={option.label}
            >
              {selected && (
                <Check className="h-4 w-4 text-white drop-shadow" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-sm text-error" role="alert">{error}</p>}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}