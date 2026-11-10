'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { formatZAR } from '@/lib/format';
import type { Product } from '@/lib/types';

/**
 * One product in a grid. The name link and the add button are the only
 * interactive elements; the image is decorative for keyboard users and
 * duplicates the name link, so it is hidden from assistive tech.
 */
export function ProductCard({ product, demo = false }: { product: Product; demo?: boolean }) {
  const initial = product.name.trim().charAt(0).toUpperCase() || '•';
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const onAdd = () => {
    if (demo) return;
    addItem(
      { product_id: product.id, slug: product.slug, name: product.name, price_cents: product.price_cents },
      1,
    );
    setAdded(true);
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setAdded(false), 2400);
  };

  return (
    <article className="tile">
      <Link href={`/products/${product.slug}`} className="tile__media" tabIndex={-1} aria-hidden="true">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt="" loading="lazy" className="tile__image" />
        ) : (
          <span className="tile__initial">{initial}</span>
        )}
      </Link>

      <div className="tile__body">
        <h3 className="tile__name">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>

        {product.description ? (
          <p className="tile__desc">{product.description}</p>
        ) : null}

        <div className="tile__foot">
          <span className="price tile__price">{formatZAR(product.price_cents)}</span>
          {demo ? (
            <span className="muted small" aria-label="Demo item, ordering disabled">Preview only</span>
          ) : (
            <button
              type="button"
              className={`btn btn-primary btn-sm tile__add ${added ? 'is-added' : ''}`}
              onClick={onAdd}
            >
              {added ? 'Added' : 'Add to bag'}
              <span className="sr-only"> {product.name}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
