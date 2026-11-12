'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Notice } from '@/components/Notice';
import { ProductCard } from '@/components/ProductCard';
import { RequireAuth } from '@/components/RequireAuth';
import { useFavorites } from '@/context/FavoritesContext';
import { describeError } from '@/lib/api';
import { favoriteService } from '@/lib/services';
import type { FavoriteProduct } from '@/lib/types';

function FavoritesView() {
  const { isFavorite, ready: savedListReady } = useFavorites();
  const [favorites, setFavorites] = useState<FavoriteProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    favoriteService
      .list()
      .then(setFavorites)
      .catch((err) => setError(describeError(err)));
  }, []);

  // A product drops off this page as soon as its heart is cleared. Until the saved list has
  // loaded, every product stays visible.
  const savedProducts = favorites
    ? favorites.filter((product) => !savedListReady || isFavorite(product.id))
    : null;

  return (
    <section className="container section favorites-section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/account">My Account</Link>
        <span className="crumb-sep" aria-hidden="true">/</span>
        <span className="current" aria-current="page">Saved Favourites</span>
      </nav>

      <header className="page-head">
        <div>
          <p className="eyebrow"><span className="rule" aria-hidden="true" />Your Wishlist</p>
          <h1>Your favourites</h1>
          <p className="muted">The bakes you have liked.</p>
        </div>
      </header>

      {error && <Notice tone="error">{error}</Notice>}

      <h2 className="favorites-section__title">Products</h2>
      {!error && savedProducts === null ? (
        <div className="grid-products" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="product-card product-card--skeleton" />
          ))}
        </div>
      ) : null}

      {savedProducts && savedProducts.length === 0 ? (
        <p className="muted">No liked products yet. Tap the heart on a bake you love.</p>
      ) : null}

      {savedProducts && savedProducts.length > 0 ? (
        <div className="grid-products">
          {savedProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={{
                id: p.id,
                name: p.name,
                slug: p.slug,
                price_cents: Number(p.price_cents),
                currency: p.currency,
                active: p.active,
              }}
            />
          ))}
        </div>
      ) : null}

    </section>
  );
}

export default function FavoritesPage() {
  return (
    <RequireAuth>
      <FavoritesView />
    </RequireAuth>
  );
}
