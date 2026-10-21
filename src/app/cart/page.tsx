'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Notice } from '@/components/Notice';
import { describeError } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { MAX_QTY_PER_LINE } from '@/lib/config';
import { formatZAR } from '@/lib/format';
import { cartService } from '@/lib/services';
import type { CartQuote } from '@/lib/types';

export default function CartPage() {
  const { lines, setQty, removeItem, ready } = useCart();
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);

  const signature = useMemo(
    () => lines.map((l) => `${l.product_id}:${l.qty}`).join('|'),
    [lines],
  );

  useEffect(() => {
    if (!ready) return;
    if (lines.length === 0) {
      setQuote(null);
      setQuoteError(null);
      return;
    }
    let cancelled = false;
    setQuoting(true);
    setQuoteError(null);
    cartService
      .quote(lines.map((l) => ({ product_id: l.product_id, qty: l.qty })))
      .then((q) => !cancelled && setQuote(q))
      .catch((err) => !cancelled && setQuoteError(describeError(err)))
      .finally(() => !cancelled && setQuoting(false));
    return () => {
      cancelled = true;
    };
  }, [signature, ready]);

  if (!ready) {
    return <div className="page-loading" role="status">Loading your shopping bag…</div>;
  }

  if (lines.length === 0) {
    return (
      <section className="container section center empty-cart-section">
        <div className="empty-cart-icon" aria-hidden="true">🧺</div>
        <p className="eyebrow"><span className="rule" aria-hidden="true" />Your Order</p>
        <h1 className="empty-cart-title">Your shopping bag is empty</h1>
        <p className="muted empty-cart-desc">
          Your basket currently has no baked goods. Browse our fresh sourdough, celebration cakes, and delicious treats!
        </p>
        <div className="cta-row center">
          <Link href="/products" className="btn btn-primary btn-lg">Explore Bakery Shop</Link>
          <Link href="/catering" className="btn btn-outline btn-lg">Catering Enquiries</Link>
        </div>
      </section>
    );
  }

  // Display subtotal from quote or computed from snapshot
  const displaySubtotal = quote?.subtotal_cents ?? lines.reduce((acc, l) => acc + l.price_cents * l.qty, 0);
  const totalItemsCount = lines.reduce((acc, l) => acc + l.qty, 0);

  return (
    <section className="container section cart-section">
      <header className="page-head cart-head">
        <div>
          <p className="eyebrow"><span className="rule" aria-hidden="true" />Review &amp; Checkout</p>
          <h1 className="cart-title">Your Shopping Bag</h1>
          <p className="muted">
            You have {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} selected for order.
          </p>
        </div>
        <Link href="/products" className="link-arrow">
          ← Continue Shopping
        </Link>
      </header>

      {quoteError ? (
        <Notice tone="error" title="Cart price check issue">
          {quoteError} — Don&apos;t worry, final amounts are re-checked safely upon placing your order.
        </Notice>
      ) : null}

      <div className="cart-layout">
        {/* Left Column: Cart Items List */}
        <div className="cart-lines-container">
          <div className="cart-lines-header">
            <span>Item</span>
            <span className="cart-lines-header__qty">Quantity</span>
            <span className="cart-lines-header__total">Total</span>
          </div>

          <div className="cart-lines">
            {lines.map((l) => {
              const lineTotal = l.price_cents * l.qty;
              return (
                <div key={l.product_id} className="cart-line-card">
                  <div className="cart-line__media" aria-hidden="true">
                    <span>{l.name.charAt(0).toUpperCase()}</span>
                  </div>

                  <div className="cart-line__info">
                    <Link href={`/products/${l.slug}`} className="cart-line__name">
                      {l.name}
                    </Link>
                    <div className="cart-line__unit-price">
                      {formatZAR(l.price_cents)} each
                    </div>
                    <button
                      type="button"
                      className="cart-line__remove-btn"
                      onClick={() => removeItem(l.product_id)}
                      aria-label={`Remove ${l.name} from bag`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="cart-line__qty-stepper">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => setQty(l.product_id, l.qty - 1)}
                      disabled={l.qty <= 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="qty-val">{l.qty}</span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => setQty(l.product_id, l.qty + 1)}
                      disabled={l.qty >= MAX_QTY_PER_LINE}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <div className="cart-line__total">
                    <strong>{formatZAR(lineTotal)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="cart-summary-sidebar">
          <div className="cart-summary-card card">
            <h2 className="cart-summary-title">Order Summary</h2>

            <div className="cart-summary-rows">
              <div className="cart-summary-row">
                <span>Items Subtotal</span>
                <span>{quoting ? 'Calculating…' : formatZAR(displaySubtotal)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Fulfilment</span>
                <span className="badge-free">Bakery Collection</span>
              </div>
              <div className="cart-summary-row cart-summary-row--total">
                <span>Estimated Total</span>
                <span className="total-amount">{quoting ? '…' : formatZAR(displaySubtotal)}</span>
              </div>
              <p className="cart-summary-note">
                Final total is verified by our server before processing securely via PayFast.
              </p>
            </div>

            <div className="cart-summary-actions">
              <Link href="/checkout" className="btn btn-primary btn-lg btn-block">
                Proceed to Checkout →
              </Link>
            </div>

            <div className="cart-summary-trust">
              <div className="trust-item">
                <span className="trust-icon" aria-hidden="true">🔒</span>
                <span>100% Encrypted &amp; Secure Payment</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon" aria-hidden="true">🇿🇦</span>
                <span>South African Rand (ZAR)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
