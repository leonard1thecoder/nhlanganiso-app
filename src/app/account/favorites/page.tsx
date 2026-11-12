'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useStoredLikes } from '@/components/LikeButton';
import { Notice } from '@/components/Notice';
import { ProductCard } from '@/components/ProductCard';
import { RecipeCard } from '@/components/RecipeCard';
import { RequireAuth } from '@/components/RequireAuth';
import { useFavorites } from '@/context/FavoritesContext';
import { describeError } from '@/lib/api';
import { RECIPE_LIKES_KEY, RECIPES } from '@/lib/recipes';
import { favoriteService } from '@/lib/services';
import type { FavoriteProduct } from '@/lib/types';

function FavoritesView() {
  const { isFavorite, ready: savedListReady } = useFavorites();
  const likedRecipeIds = useStoredLikes(RECIPE_LIKES_KEY);
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
  const likedRecipes = RECIPES.filter((recipe) => likedRecipeIds.includes(recipe.id));

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
          <p className="muted">The bakes you have liked, and the recipes you have saved.</p>
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

      <h2 className="favorites-section__title">Recipes</h2>
      {likedRecipes.length > 0 ? (
        <ul className="recipe-grid">
          {likedRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </ul>
      ) : (
        <p className="muted">
          No saved recipes yet.{' '}
          <Link href="/recipes" className="link-arrow">
            Browse recipes <span aria-hidden="true">→</span>
          </Link>
        </p>
      )}
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
