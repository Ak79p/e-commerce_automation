import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cartService } from '../services/cartService';
import type { ApiResult, CartItem, CartLine, PriceSummary } from '../types';

interface CartContextValue {
  items: CartItem[];
  lines: CartLine[];
  summary: PriceSummary;
  quantityOf: (productId: string) => number;
  addItem: (productId: string, quantity?: number) => ApiResult<CartItem[]>;
  setQuantity: (productId: string, quantity: number) => ApiResult<CartItem[]>;
  removeItem: (productId: string) => ApiResult<CartItem[]>;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Holds cart state in React and persists every successful change through cartService. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => cartService.load());
  // Ref mirrors the latest items so rapid consecutive operations never act on stale state.
  const itemsRef = useRef(items);

  const commit = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    cartService.save(next);
    setItems(next);
  }, []);

  useEffect(
    () =>
      cartService.subscribe(() => {
        const next = cartService.load();
        itemsRef.current = next;
        setItems(next);
      }),
    [],
  );

  const apply = useCallback(
    (result: ApiResult<CartItem[]>) => {
      if (result.ok) commit(result.data);
      return result;
    },
    [commit],
  );

  const addItem = useCallback(
    (productId: string, quantity = 1) => apply(cartService.addItem(itemsRef.current, productId, quantity)),
    [apply],
  );
  const setQuantity = useCallback(
    (productId: string, quantity: number) => apply(cartService.setQuantity(itemsRef.current, productId, quantity)),
    [apply],
  );
  const removeItem = useCallback(
    (productId: string) => apply(cartService.removeItem(itemsRef.current, productId)),
    [apply],
  );
  const clear = useCallback(() => {
    itemsRef.current = [];
    cartService.clear();
    setItems([]);
  }, []);

  const value = useMemo(() => {
    const lines = cartService.toLines(items);
    return {
      items,
      lines,
      summary: cartService.summarize(lines),
      quantityOf: (productId: string) => items.find((i) => i.productId === productId)?.quantity ?? 0,
      addItem,
      setQuantity,
      removeItem,
      clear,
    };
  }, [items, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
