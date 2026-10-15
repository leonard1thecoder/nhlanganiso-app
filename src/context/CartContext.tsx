'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { MAX_QTY_PER_LINE, STORAGE_KEYS } from '@/lib/config';

/**
 * The cart lives in localStorage. It stores only ids, names and qty.
 * Prices shown here are a snapshot for convenience; the server re-prices
 * everything through POST /cart/quote and again when the order is created.
 */

export interface CartLine {
  product_id: string;
  slug: string;
  name: string;
  price_cents: number;
  qty: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  /** false until localStorage has been read (avoids SSR/hydration mismatch) */
  ready: boolean;
  addItem: (product: Pick<CartLine, 'product_id' | 'slug' | 'name' | 'price_cents'>, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const clampQty = (qty: number) => Math.max(1, Math.min(MAX_QTY_PER_LINE, Math.floor(qty)));

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.cart);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      // Corrupt storage: start with an empty cart.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(lines));
  }, [lines, ready]);

  const addItem = useCallback<CartContextValue['addItem']>((product, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product_id === product.product_id);
      if (existing) {
        return prev.map((l) =>
          l.product_id === product.product_id
            ? { ...l, qty: clampQty(l.qty + qty), price_cents: product.price_cents }
            : l,
        );
      }
      return [...prev, { ...product, qty: clampQty(qty) }];
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) => (l.product_id === productId ? { ...l, qty: clampQty(qty) } : l)),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.product_id !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      ready,
      addItem,
      setQty,
      removeItem,
      clear,
    }),
    [lines, ready, addItem, setQty, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
