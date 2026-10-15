import Link from 'next/link';
import { formatZAR } from '@/lib/format';
import type { Product } from '@/lib/types';

/** Shows the product image when the API provides one; otherwise a branded monogram tile. */
export function ProductCard({ product }: { product: Product }) {
  const initial = product.name.trim().charAt(0).toUpperCase() || '•';
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
          <Link href={`/products/${product.slug}`} className="btn btn-outline btn-sm">
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
