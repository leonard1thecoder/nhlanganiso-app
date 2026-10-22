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
      <section className="container section center product-not-found">
        <div className="empty-catalog-icon">🥐</div>
        <h1>Item Not Found</h1>
        <p className="muted">This delicious bake may have sold out or is no longer listed in our current menu.</p>
        <Link href="/products" className="btn btn-primary btn-lg">Back to Bakery Shop</Link>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container section">
        <Notice tone="error" title="Could not load this product">{error}</Notice>
        <Link href="/products" className="link-arrow mt-4">← Return to shop</Link>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="container section">
        <div className="product-layout product-layout--skeleton" aria-busy="true">
          <div className="product-media-skeleton" />
          <div className="product-info-skeleton">
            <div className="skeleton-line skeleton-line--title" />
            <div className="skeleton-line skeleton-line--price" />
            <div className="skeleton-line skeleton-line--desc" />
            <div className="skeleton-line skeleton-line--btn" />
          </div>
        </div>
      </section>
    );
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
    setTimeout(() => setAdded(false), 3000);
  };

  const initial = product.name.trim().charAt(0).toUpperCase() || '•';

  return (
    <section className="container section product-detail-section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="crumb-sep" aria-hidden="true">/</span>
        <Link href="/products">Shop</Link>
        <span className="crumb-sep" aria-hidden="true">/</span>
        <span className="current" aria-current="page">{product.name}</span>
      </nav>

      <div className="product-detail-layout">
        {/* Product Media Gallery */}
        <div className="product-detail__media-wrapper">
          {product.image_url ? (
            <div className="product-detail__image-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image_url}
                alt={product.name}
                className="product-detail__image"
              />
            </div>
          ) : (
            <div className="product-detail__placeholder">
              <span className="product-detail__monogram" aria-hidden="true">{initial}</span>
              <p className="product-detail__craft-note">Handcrafted with care by Nhlanganiso bakers</p>
            </div>
          )}
        </div>

        {/* Product Summary & Order Action */}
        <div className="product-detail__info">
          <div className="product-detail__badge-strip">
            <span className="product-detail__category-badge">Bakery Special</span>
            {availability && (
              availability.stock_on_hand != null && availability.stock_on_hand > 0 ? (
                <span className="stock-pill in-stock">● In stock ({availability.stock_on_hand} available)</span>
              ) : outOfStock ? (
                <span className="stock-pill out-of-stock">● Currently out of stock</span>
              ) : null
            )}
          </div>

          <h1 className="product-detail__title">{product.name}</h1>

          <div className="product-detail__price-container">
            <span className="product-detail__currency">ZAR</span>
            <span className="product-detail__price">{formatZAR(product.price_cents)}</span>
            <span className="product-detail__vat-note">Inclusive of VAT · Collection order</span>
          </div>

          <div className="product-detail__description">
            <h3 className="product-detail__subhead">About this Bake</h3>
            <p>{product.description || 'Our signature recipe prepared fresh with premium quality ingredients.'}</p>
          </div>

          {outOfStock ? (
            <div className="product-detail__oos-box card">
              <p className="muted">This item is currently sold out for the day. Please check back tomorrow morning!</p>
              <Link href="/contact" className="btn btn-outline btn-block">Ask us about catering</Link>
            </div>
          ) : (
            <div className="product-detail__actions card">
              <div className="product-detail__qty-row">
                <label htmlFor="product-qty" className="product-detail__qty-label">Quantity</label>
                <div className="qty-stepper">
                  <button
                    type="button"
                    className="qty-stepper__btn"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <input
                    id="product-qty"
                    type="number"
                    min={1}
                    max={maxQty}
                    value={qty}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(maxQty, Number(e.target.value) || 1));
                      setQty(val);
                    }}
                    className="qty-stepper__input"
                  />
                  <button
                    type="button"
                    className="qty-stepper__btn"
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    disabled={qty >= maxQty}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="product-detail__cta-group">
                <button
                  type="button"
                  className={`btn btn-lg btn-block ${added ? 'btn-success' : 'btn-primary'}`}
                  onClick={onAdd}
                >
                  {added ? 'Added to Bag ✓' : `Add to Bag • ${formatZAR(product.price_cents * qty)}`}
                </button>
                {inCart > 0 && (
                  <p className="product-detail__in-cart-note">
                    You currently have {inCart} of this item in your <Link href="/cart">shopping bag</Link>.
                  </p>
                )}
              </div>

              {added && (
                <div className="product-detail__added-toast">
                  <span>Bag updated!</span>
                  <Link href="/cart" className="product-detail__added-link">View Bag &amp; Checkout →</Link>
                </div>
              )}
            </div>
          )}

          {/* Delivery & Collection Reassurance */}
          <div className="product-detail__features-list">
            <div className="feature-item">
              <span className="feature-icon" aria-hidden="true">⏱</span>
              <div>
                <strong>Baked Fresh to Order</strong>
                <p className="muted small">Prepared directly in our bakery prior to your scheduled collection.</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon" aria-hidden="true">🔒</span>
              <div>
                <strong>Verified PayFast Payment</strong>
                <p className="muted small">Seamless and protected checkout with debit/credit cards or Instant EFT.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
