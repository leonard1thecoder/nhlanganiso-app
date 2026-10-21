'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { favoriteService } from '@/lib/services';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { formatZAR } from '@/lib/format';
import type { Product } from '@/lib/types';

export function ProductCardWithFavorite({ product }: { product: Product }) {
  const { status } = useAuth();
  const initial = product.name.trim().charAt(0).toUpperCase() || '•';
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(
      { product_id: product.id, slug: product.slug, name: product.name, price_cents: product.price_cents },
      1,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2400);
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (status !== 'authenticated') {
      window.location.href = `/login?next=/products/${product.slug}`;
      return;
    }

    setFavLoading(true);
    try {
      if (isFavorited) {
        await favoriteService.remove(product.id);
        setIsFavorited(false);
      } else {
        await favoriteService.add(product.id);
        setIsFavorited(true);
      }
    } catch {
      // Graceful fallback
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <article className="product-card group">
      <Link href={`/products/${product.slug}`} className="product-card__media-wrap" aria-label={product.name}>
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="product-card__image"
          />
        ) : (
          <div className="product-card__placeholder">
            <span className="product-card__monogram" aria-hidden="true">{initial}</span>
            <span className="product-card__craft-tag">Artisanal Bake</span>
          </div>
        )}

        <button
          type="button"
          className={`product-card__favorite-btn ${isFavorited ? 'is-favorited' : ''}`}
          onClick={toggleFavorite}
          disabled={favLoading}
          aria-label={isFavorited ? `Remove ${product.name} from favourites` : `Save ${product.name} to favourites`}
          title={isFavorited ? 'Saved in Favourites' : 'Add to Favourites'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorited ? '#C8893B' : 'none'} stroke={isFavorited ? '#C8893B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        <span className="product-card__quick-view">View Details</span>
      </Link>

      <div className="product-card__body">
        <div className="product-card__meta">
          <span className="product-card__badge">Fresh</span>
        </div>

        <h3 className="product-card__name">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>

        {product.description ? (
          <p className="product-card__desc line-clamp-2">{product.description}</p>
        ) : null}

        <div className="product-card__foot">
          <div className="product-card__price-box">
            <span className="product-card__currency-tag">ZAR</span>
            <span className="price">{formatZAR(product.price_cents)}</span>
          </div>

          <div className="product-card__actions">
            <button
              type="button"
              className={`btn btn-sm ${added ? 'btn-success' : 'btn-primary'} product-card__btn`}
              onClick={onAdd}
              aria-label={`Add ${product.name} to cart`}
            >
              {added ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Added</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add to Bag</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
