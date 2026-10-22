'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Notice } from '@/components/Notice';
import { describeError } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { MAX_QTY_PER_LINE } from '@/lib/config';
import { formatZAR } from '@/lib/format';
import { cartService, couponService } from '@/lib/services';
import type { CartQuote } from '@/lib/types';

export default function CartPage() {
  const { lines, setQty, removeItem, ready } = useCart();
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

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

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    if (!couponCode.trim()) return;
    if (!subscriberEmail.trim()) {
      setCouponError('Please enter the email address used for your bakery newsletter.');
      return;
    }

    setValidatingCoupon(true);
    try {
      const res = await couponService.validate(couponCode.trim(), subscriberEmail.trim());
      setAppliedDiscount(res.discount_percentage);
    } catch (err) {
      setAppliedDiscount(null);
      setCouponError(describeError(err));
    } finally {
      setValidatingCoupon(false);
    }
  };

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
          <Link href="/contact" className="btn btn-outline btn-lg">Contact &amp; Catering</Link>
        </div>
      </section>
    );
  }

  const rawSubtotal = quote?.subtotal_cents ?? lines.reduce((acc, l) => acc + l.price_cents * l.qty, 0);
  const discountAmount = appliedDiscount ? Math.round((rawSubtotal * appliedDiscount) / 100) : 0;
  const displayTotal = rawSubtotal - discountAmount;
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

          {/* Coupon Code Section */}
          <div className="coupon-box card mt-4">
            <h3 className="coupon-box__title">Have a Promotional Coupon?</h3>
            <p className="muted small">Enter your coupon code and verified subscriber email to apply your discount.</p>
            <form onSubmit={handleApplyCoupon} className="coupon-form mt-2">
              <div className="coupon-inputs-row">
                <input
                  type="text"
                  placeholder="Coupon Code (e.g. WELCOME10)"
                  className="input input-sm"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <input
                  type="email"
                  placeholder="Subscriber Email"
                  className="input input-sm"
                  value={subscriberEmail}
                  onChange={(e) => setSubscriberEmail(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-outline btn-sm"
                  disabled={validatingCoupon}
                >
                  {validatingCoupon ? 'Validating…' : 'Apply'}
                </button>
              </div>
            </form>

            {couponError && <p className="text-danger small mt-2">{couponError}</p>}
            {appliedDiscount && (
              <p className="text-success small mt-2">
                ✓ Coupon <strong>{couponCode.toUpperCase()}</strong> applied ({appliedDiscount}% off)!
              </p>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="cart-summary-sidebar">
          <div className="cart-summary-card card">
            <h2 className="cart-summary-title">Order Summary</h2>

            <div className="cart-summary-rows">
              <div className="cart-summary-row">
                <span>Items Subtotal</span>
                <span>{quoting ? 'Calculating…' : formatZAR(rawSubtotal)}</span>
              </div>
              {appliedDiscount && (
                <div className="cart-summary-row text-success">
                  <span>Promo Discount ({appliedDiscount}%)</span>
                  <span>-{formatZAR(discountAmount)}</span>
                </div>
              )}
              <div className="cart-summary-row">
                <span>Fulfilment</span>
                <span className="badge-free">Bakery Collection</span>
              </div>
              <div className="cart-summary-row cart-summary-row--total">
                <span>Estimated Total</span>
                <span className="total-amount">{quoting ? '…' : formatZAR(displayTotal)}</span>
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
