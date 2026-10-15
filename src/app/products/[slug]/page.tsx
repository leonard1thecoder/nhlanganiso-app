'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Notice } from '@/components/Notice';
import { describeError } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { MAX_QTY_PER_LINE } from '@/lib/config';
import { formatZAR } from '@/lib/format';
import { productService } from '@/lib/services';
import type { Availability, ProductDetail } from '@/lib/types';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem, lines } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setNotFound(false);
    productService
      .bySlug(slug)
      .then(async (p) => {
        if (cancelled) return;
        setProduct(p);
        try {
          const a = await productService.availability(p.id);
          if (!cancelled) setAvailability(a);
        } catch {
          // Availability is best-effort; the server still checks stock at checkout.
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = describeError(err);
        if (/could not find/i.test(msg)) setNotFound(true);
        else setError(msg);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (notFound) {
    return (
      <section className="container section center">
        <h1>Product not found</h1>
        <p className="muted">This item may no longer be available.</p>
        <Link href="/products" className="btn btn-primary">Back to the shop</Link>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container section">
        <Notice tone="error" title="Could not load this product">{error}</Notice>
      </section>
    );
  }

  if (!product) {
    return <div className="page-loading" role="status">Loading product…</div>;
  }

  const inCart = lines.find((l) => l.product_id === product.id)?.qty ?? 0;
  const outOfStock = availability !== null && (!availability.active || availability.stock_on_hand === 0);
  const maxQty =
    availability?.stock_on_hand != null
      ? Math.max(0, Math.min(MAX_QTY_PER_LINE, availability.stock_on_hand))
      : MAX_QTY_PER_LINE;

  const onAdd = () => {
    addItem({ product_id: product.id, slug: product.slug, name: product.name, price_cents: product.price_cents }, qty);
    setAdded(true);
  };

  return (
    <section className="container section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/products">Shop</Link> <span aria-hidden="true">/</span> <span>{product.name}</span>
      </nav>

      <div className="pdp">
        <div className="pdp__media">
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name} width={800} height={800} sizes="(max-width: 900px) 90vw, 480px" />
          ) : (
            <span className="pdp__monogram" aria-hidden="true">{product.name.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="pdp__info">
          <h1>{product.name}</h1>
          <p className="price price--lg">{formatZAR(product.price_cents)}</p>

          {product.description ? <p className="lead">{product.description}</p> : null}

          {availability ? (
            <p className={outOfStock ? 'status status--bad' : 'status status--good'}>
              {!availability.active
                ? 'Currently unavailable'
                : availability.stock_on_hand === 0
                  ? 'Sold out — check back soon'
                  : availability.stock_on_hand != null && availability.stock_on_hand <= 5
                    ? `Only ${availability.stock_on_hand} left`
                    : 'In stock'}
            </p>
          ) : null}

          {!outOfStock ? (
            <div className="buy-row">
              <div className="qty" role="group" aria-label="Quantity">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">−</button>
                <span aria-live="polite" className="qty__value">{qty}</span>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setQty((q) => Math.min(maxQty || 1, q + 1))} disabled={qty >= maxQty} aria-label="Increase quantity">+</button>
              </div>
              <button type="button" className="btn btn-primary btn-lg" onClick={onAdd}>
                Add to cart
              </button>
            </div>
          ) : null}

          {added ? (
            <Notice tone="success" title="Added to your cart">
              {inCart} in cart. <Link href="/cart">View cart →</Link>
            </Notice>
          ) : null}
        </div>
      </div>
    </section>
  );
}
