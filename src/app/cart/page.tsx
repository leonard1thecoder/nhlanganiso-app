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

/**
 * The bag shows only server-quoted totals. The browser never calculates a price,
 * because checkout charges whatever the server quotes. Coupons are not applied at
 * checkout yet, so the coupon form has been removed rather than shown with a
 * discount that would not be charged.
 */
export default function CartPage() {
  const { lines, setQty, removeItem, ready } = useCart();
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [attempt, setAttempt] = useState(0);

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
      .then((q) => {
        if (cancelled) return;
        setQuote(q);
      })
      .catch((err) => {
        if (cancelled) return;
        setQuote(null);
        setQuoteError(describeError(err));
      })
      .finally(() => {
        if (!cancelled) setQuoting(false);
      });
    return () => {
      cancelled = true;
    };
    // `lines` is represented by `signature`; re-quote only when the basket changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, ready, attempt]);

  if (!ready) {
    return <div className="page-loading" role="status">Loading your bag…</div>;
  }

  if (lines.length === 0) {
    return (
      <section className="container section empty-cart-section">
        <h1 className="empty-cart-title">Your bag is empty</h1>
        <p className="muted empty-cart-desc">
          Add something from the bakery and it will appear here, with the total confirmed before you pay.
        </p>
        <div className="cta-row">
          <Link href="/products" className="btn btn-primary btn-lg">Shop the bakery</Link>
          <Link href="/cakes" className="btn btn-outline btn-lg">See cakes</Link>
        </div>
      </section>
    );
  }

  const totalItemsCount = lines.reduce((acc, l) => acc + l.qty, 0);
  const total = quote?.subtotal_cents;

  return (
    <section className="container section cart-section">
      <header className="cart-head">
        <div>
          <p className="eyebrow">Your bag</p>
          <h1 className="cart-title">Review your order</h1>
          <p className="muted">
            {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in your bag.
          </p>
        </div>
        <Link href="/products" className="link-arrow">
          ← Keep shopping
        </Link>
      </header>

      {quoteError ? (
        <Notice tone="error" title="We could not confirm the total">
          <p>{quoteError}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </button>
        </Notice>
      ) : null}

      <div className="cart-layout">
        <div className="cart-lines-container">
          <ul className="cart-lines" aria-label="Items in your bag">
            {lines.map((l) => {
              const lineTotal = l.price_cents * l.qty;
              return (
                <li key={l.product_id} className="cart-line-card">
                  <div className="cart-line__media" aria-hidden="true">
                    <span>{l.name.charAt(0).toUpperCase()}</span>
                  </div>

                  <div className="cart-line__info">
                    <Link href={`/products/${l.slug}`} className="cart-line__name">
                      {l.name}
                    </Link>
                    <div className="cart-line__unit-price">{formatZAR(l.price_cents)} each</div>
                    <button
                      type="button"
                      className="cart-line__remove-btn"
                      onClick={() => removeItem(l.product_id)}
                      aria-label={`Remove ${l.name} from your bag`}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="cart-line__qty-stepper" role="group" aria-label={`Quantity of ${l.name}`}>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => setQty(l.product_id, l.qty - 1)}
                      disabled={l.qty <= 1}
                      aria-label={`Decrease ${l.name} quantity`}
                    >
                      −
                    </button>
                    <span className="qty-val" aria-live="polite">{l.qty}</span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => setQty(l.product_id, l.qty + 1)}
                      disabled={l.qty >= MAX_QTY_PER_LINE}
                      aria-label={`Increase ${l.name} quantity`}
                    >
                      +
                    </button>
                  </div>

                  <div className="cart-line__total">
                    <span className="cart-line__total-label">Line total</span>
                    <strong>{formatZAR(lineTotal)}</strong>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="cart-summary-sidebar" aria-labelledby="cart-summary-title">
          <div className="cart-summary-card">
            <h2 id="cart-summary-title" className="cart-summary-title">Order summary</h2>

            <dl className="cart-summary-rows">
              <div className="cart-summary-row">
                <dt>Subtotal</dt>
                <dd>{quoting && total === undefined ? 'Calculating…' : total !== undefined ? formatZAR(total) : '—'}</dd>
              </div>
              <div className="cart-summary-row">
                <dt>Collection</dt>
                <dd>From our bakery</dd>
              </div>
              <div className="cart-summary-row cart-summary-row--total">
                <dt>Total</dt>
                <dd className="total-amount">{total !== undefined ? formatZAR(total) : quoting ? 'Calculating…' : '—'}</dd>
              </div>
            </dl>
            <p className="cart-summary-note">
              The total is confirmed by our server. You review it again before paying.
            </p>

            <Link
              href="/checkout"
              className={`btn btn-primary btn-lg btn-block ${total === undefined || quoteError ? 'is-disabled' : ''}`}
              aria-disabled={total === undefined || Boolean(quoteError)}
              tabIndex={total === undefined || quoteError ? -1 : undefined}
            >
              Continue to checkout
            </Link>
            <p className="cart-summary-payment">Payment is taken by PayFast on the next step.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
