'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Notice } from '@/components/Notice';
import { ProductLikeButton } from '@/components/ProductLikeButton';
import { describeError } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { MAX_QTY_PER_LINE } from '@/lib/config';
import { formatZAR } from '@/lib/format';
import { productService } from '@/lib/services';
import type { Availability, ProductDetail } from '@/lib/types';
import { findDemoProduct } from '@/lib/demo-catalogue';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem, lines } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setNotFound(false);
    const demoProduct = findDemoProduct(slug);
    if (demoProduct) {
      setProduct(demoProduct);
      setAvailability(null);
      return () => { cancelled = true; };
    }
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
        <h1>We could not find that bake</h1>
        <p className="muted">It may have sold out or been taken off the menu.</p>
        <Link href="/products" className="btn btn-primary btn-lg">Back to the shop</Link>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container section">
        <Notice tone="error" title="Could not load this product">{error}</Notice>
        <Link href="/products" className="link-arrow mt-4">← Back to the shop</Link>
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

  const isDemoProduct = Boolean(findDemoProduct(slug));
  const inCart = lines.find((l) => l.product_id === product.id)?.qty ?? 0;
  const outOfStock = availability !== null && (!availability.active || availability.stock_on_hand === 0);
  const maxQty =
    availability?.stock_on_hand != null
      ? Math.max(0, Math.min(MAX_QTY_PER_LINE, availability.stock_on_hand))
      : MAX_QTY_PER_LINE;

  const onAdd = () => {
    if (isDemoProduct) return;
    addItem({ product_id: product.id, slug: product.slug, name: product.name, price_cents: product.price_cents }, qty);
    setAdded(true);
    window.clearTimeout(addedTimer.current);
    addedTimer.current = window.setTimeout(() => setAdded(false), 3000);
  };

  const initial = product.name.trim().charAt(0).toUpperCase() || '•';
  const inStock = availability?.stock_on_hand != null && availability.stock_on_hand > 0;

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
        <div className="product-detail__media-wrapper">
          {product.image_url ? (
            <div className="product-detail__image-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image_url} alt={product.name} className="product-detail__image" />
            </div>
          ) : (
            <div className="product-detail__placeholder" role="img" aria-label={`${product.name}: photo not yet available`}>
              <span className="product-detail__monogram" aria-hidden="true">{initial}</span>
              <p className="product-detail__placeholder-note">Photo coming soon</p>
            </div>
          )}
        </div>

        <div className="product-detail__info">
          {availability ? (
            inStock ? (
              <p className="stock-pill in-stock">In stock{availability.stock_on_hand != null ? `, ${availability.stock_on_hand} available` : ''}</p>
            ) : outOfStock ? (
              <p className="stock-pill out-of-stock">Sold out for today</p>
            ) : null
          ) : null}

          <h1 className="product-detail__title">{product.name}</h1>

          <p className="product-detail__price">{formatZAR(product.price_cents)}</p>

          {isDemoProduct ? null : (
            <div className="product-detail__like">
              <ProductLikeButton id={product.id} name={product.name} count={product.favorite_count} showLabel />
            </div>
          )}

          {product.description ? (
            <div className="product-detail__description">
              <p>{product.description}</p>
            </div>
          ) : null}

          {isDemoProduct ? (
            <div className="product-detail__oos-box">
              <p>This is a catalogue preview. Ordering and checkout are disabled until the live catalogue is connected.</p>
            </div>
          ) : outOfStock ? (
            <div className="product-detail__oos-box">
              <p>This bake is sold out for today. Check back tomorrow, or enquire about a custom order.</p>
              <Link href="/contact" className="btn btn-outline btn-block">Enquire about a custom order</Link>
            </div>
          ) : (
            <div className="product-detail__actions">
              <div className="product-detail__qty-row">
                <span className="product-detail__qty-label" id="product-qty-label">Quantity</span>
                <div className="qty-stepper" role="group" aria-labelledby="product-qty-label">
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
                    inputMode="numeric"
                    min={1}
                    max={maxQty}
                    value={qty}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(maxQty, Number(e.target.value) || 1));
                      setQty(val);
                    }}
                    className="qty-stepper__input"
                    aria-labelledby="product-qty-label"
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

              <button
                type="button"
                className={`btn btn-lg btn-block product-detail__add ${added ? 'btn-success' : 'btn-primary'}`}
                onClick={onAdd}
              >
                {added ? 'Added to bag' : `Add to bag · ${formatZAR(product.price_cents * qty)}`}
              </button>

              <p className="product-detail__status" role="status" aria-live="polite">
                {added ? (
                  <>
                    <Link href="/cart">View your bag and check out</Link>
                  </>
                ) : inCart > 0 ? (
                  <>You already have {inCart} in your <Link href="/cart">bag</Link>.</>
                ) : null}
              </p>
            </div>
          )}

          <ul className="product-detail__notes">
            <li>
              <strong>Collect from our bakery</strong>
              <span className="muted">Orders are for collection. Delivery is not available online yet.</span>
            </li>
            {!isDemoProduct ? (
              <li>
                <strong>Pay securely with PayFast</strong>
                <span className="muted">You confirm the total on the checkout page before paying.</span>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  );
}
