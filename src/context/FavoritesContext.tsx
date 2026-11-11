'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import { favoriteService } from '@/lib/services';

interface FavoritesContextValue {
  /** True once the signed-in shopper's saved list has loaded. Until then, do not filter by it. */
  ready: boolean;
  /** True when the signed-in shopper has saved this product. */
  isFavorite: (productId: string) => boolean;
  /**
   * How far the shown count should move for this shopper. The API count already includes
   * anything they saved before the page loaded, so this only adds their changes since then:
   * +1 if they saved it since, -1 if they removed a save that was there at load, otherwise 0.
   */
  favoriteDelta: (productId: string) => number;
  /** Saves or removes the shopper's like. Only call this when signed in. */
  toggleFavorite: (productId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [loadedIds, setLoadedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [savedIds, setSavedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [ready, setReady] = useState(false);
  // Products with a request in flight, so a quick double click cannot race itself.
  const pending = useRef(new Set<string>());

  useEffect(() => {
    if (status !== 'authenticated') {
      setLoadedIds(new Set());
      setSavedIds(new Set());
      setReady(false);
      return;
    }
    let cancelled = false;
    favoriteService
      .list()
      .then((items) => {
        if (cancelled) return;
        const ids = new Set(items.map((item) => item.id));
        setLoadedIds(ids);
        setSavedIds(ids);
        setReady(true);
      })
      .catch(() => {
        // Likes are best-effort: if the list cannot load, the hearts start empty.
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const setSaved = useCallback((productId: string, saved: boolean) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (saved) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (pending.current.has(productId)) return;
      pending.current.add(productId);

      const wasSaved = savedIds.has(productId);
      setSaved(productId, !wasSaved); // Show the change straight away.
      try {
        const result = wasSaved
          ? await favoriteService.remove(productId)
          : await favoriteService.add(productId);
        setSaved(productId, result.favorited);
      } catch {
        setSaved(productId, wasSaved); // The server refused, so put the heart back.
      } finally {
        pending.current.delete(productId);
      }
    },
    [savedIds, setSaved],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      ready,
      isFavorite: (productId) => savedIds.has(productId),
      favoriteDelta: (productId) =>
        (savedIds.has(productId) ? 1 : 0) - (loadedIds.has(productId) ? 1 : 0),
      toggleFavorite,
    }),
    [ready, savedIds, loadedIds, toggleFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider');
  return ctx;
}
