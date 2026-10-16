'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { formatZAR } from '@/lib/format';
import type { Product } from '@/lib/types';

/** Shows the product image when the API provides one; otherwise a branded monogram tile. */
export function ProductCard({ product }: { product: Product }) {
  const initial = product.name.trim().charAt(0).toUpperCase() || '•';
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const onAdd = () => {
    // Snapshot price is for display only; the server re-prices via /cart/quote and at checkout.
    addItem(
      { product_id: product.id, slug: product.slug, name: product.name, price_cents: product.price_cents },
      1,
    );
    setAdded(true);
  };

  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} className="product-card__media" aria-label={product.name}>
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} loading="lazy" />
        ) : (
          <span className="product-card__monogram" aria-hidden="true">{initial}</span>
        )}
      </Link>
      <div className="product-card__body">
        <h3 className="product-card__name">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        {product.description ? <p className="muted product-card__desc">{product.description}</p> : null}
        <div className="product-card__foot">
          <span className="price">{formatZAR(product.price_cents)}</span>
          <span className="product-card__actions">
            {added ? <span className="product-card__added" role="status">Added ✓</span> : null}
            <button type="button" className="btn btn-primary btn-sm" onClick={onAdd} aria-label={`Add ${product.name} to cart`}>
              Add
            </button>
          </span>
        </div>
      </div>
    </article>
  );
}
