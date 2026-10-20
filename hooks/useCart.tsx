'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import {
  addToCart as addToCartAction,
  getCartSummary,
  type CartSummary,
  type CartVariant
} from '@/lib/actions/cart';

type AddItemResult =
  | { ok: true }
  | { ok: false; error: string; needsAuth?: boolean };

type CartContextValue = {
  itemCount: number;
  isLoading: boolean;
  summary: CartSummary | null;
  addItem: (productId: string, variant: CartVariant, quantity?: number) => Promise<AddItemResult>;
  refresh: () => Promise<void>;
  sync: (summary: CartSummary) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const next = await getCartSummary();
      setSummary(next);
    } catch {
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sync = useCallback((next: CartSummary) => {
    setSummary(next);
    setIsLoading(false);
  }, []);

  const addItem = useCallback(
    async (productId: string, variant: CartVariant, quantity = 1): Promise<AddItemResult> => {
      const result = await addToCartAction({ productId, variant, quantity });
      if (result.ok) {
        await refresh();
        return { ok: true };
      }
      return { ok: false, error: result.error, needsAuth: result.reason === 'auth' };
    },
    [refresh]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      itemCount: summary?.item_count ?? 0,
      isLoading,
      summary,
      addItem,
      refresh,
      sync
    }),
    [summary, isLoading, addItem, refresh, sync]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}