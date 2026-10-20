'use client';

import { Toaster } from '@/components/ui';
import { CartProvider } from '@/hooks/useCart';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <Toaster />
    </CartProvider>
  );
}