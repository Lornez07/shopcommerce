'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'interactive';
  isLoading?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', isLoading, children, ...props }, ref) => {
    const variants = {
      default: 'bg-surface border border-border rounded-md shadow-sm',
      hover: 'bg-surface border border-border rounded-md shadow-sm transition-all duration-150 ease-spring hover:shadow-md hover:-translate-y-0.5',
      interactive: 'bg-surface border border-border rounded-md shadow-sm transition-all duration-150 ease-spring hover:shadow-md hover:-translate-y-0.5 cursor-pointer active:scale-[0.99]'
    };

    if (isLoading) {
      return (
        <div
          ref={ref}
          className={cn(variants[variant], 'animate-pulse', className)}
          {...props}
        >
          <div className="aspect-[16/10] bg-border rounded-sm mb-3" />
          <div className="h-5 bg-border rounded-sm w-3/4 mb-2" />
          <div className="h-4 bg-border rounded-sm w-1/2" />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-4 pt-4 pb-2', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-4 pb-4', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';