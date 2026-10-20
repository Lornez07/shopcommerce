'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/hooks/useCart';

/** The webhook empties the cart server-side; this clears the header badge too. */
export function CartReset() {
  const { refresh } = useCart();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void refresh();
  }, [refresh]);

  return null;
}
