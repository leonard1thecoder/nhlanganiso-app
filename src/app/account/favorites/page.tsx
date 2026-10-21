'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { ProductCard } from '@/components/ProductCard';
import { describeError } from '@/lib/api';
import { favoriteService } from '@/lib/services';
import type { FavoriteProduct } from '@/lib/types';

function FavoritesView() {
  const [favorites, setFavorites] = useState<FavoriteProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = () => {
    favoriteService
      .list()
      .then(setFavorites)
      .catch((err) => setError(describeError(err)));
  };

  useEffect(() => {
    loadFavorites();
  }, []);

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
          <h1>Saved Bakery Favourites</h1>
          <p className="muted">Quickly re-order the bakes, pastries, and treats you love most.</p>
        </div>
      </header>

      {error && <Notice tone="error">{error}</Notice>}

      {!error && favorites === null ? (
        <div className="grid-products" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="product-card product-card--skeleton" />
          ))}
        </div>
      ) : null}

      {favorites && favorites.length === 0 ? (
        <div className="empty-catalog-state card text-center">
          <div className="empty-cart-icon" aria-hidden="true">❤️</div>
          <h2>No saved items yet</h2>
          <p className="muted">
            Click the heart icon on any cake or loaf to save it directly to your favourites.
          </p>
          <div className="cta-row center mt-4">
            <Link href="/products" className="btn btn-primary">Browse Bakery Shop</Link>
          </div>
        </div>
      ) : null}

      {favorites && favorites.length > 0 ? (
        <div className="grid-products">
          {favorites.map((p) => (
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
