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

  // Key that changes only when the cart contents change, to avoid redundant quote calls.
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
    // `lines` is intentionally represented by `signature` to avoid re-quoting on unrelated renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, ready]);

  if (!ready) {
    return <div className="page-loading" role="status">Loading cart…</div>;
  }

  if (lines.length === 0) {
    return (
      <section className="container section center">
        <p className="eyebrow">Your cart</p>
        <h1>Your cart is empty</h1>
        <p className="muted">Browse our fresh bakes and add something you love.</p>
        <Link href="/products" className="btn btn-primary btn-lg">Start shopping</Link>
      </section>
    );
  }

  return (
    <section className="container section">
      <header className="page-head">
        <div>
          <p className="eyebrow">Your cart</p>
          <h1>Review your order</h1>
        </div>
      </header>

      <div className="cart-layout">
        <div className="cart-lines">
          {lines.map((l) => (
            <div key={l.product_id} className="cart-line">
              <div className="cart-line__media" aria-hidden="true">{l.name.charAt(0).toUpperCase()}</div>
              <div className="cart-line__info">
                <Link href={`/products/${l.slug}`} className="cart-line__name">{l.name}</Link>
                <p className="muted small">{formatZAR(l.price_cents)} each</p>
              </div>
              <div className="qty">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setQty(l.product_id, l.qty - 1)}
                  disabled={l.qty <= 1}
                  aria-label={`Decrease ${l.name}`}
                >
                  −
                </button>
                <span className="qty__value" aria-live="polite">{l.qty}</span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setQty(l.product_id, l.qty + 1)}
                  disabled={l.qty >= MAX_QTY_PER_LINE}
                  aria-label={`Increase ${l.name}`}
                >
                  +
                </button>
              </div>
              <button type="button" className="link-danger" onClick={() => removeItem(l.product_id)}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <aside className="summary card" aria-label="Order summary">
          <h2 className="summary__title">Summary</h2>
          {quoteError ? <Notice tone="error">{quoteError}</Notice> : null}
          <div className="summary__row">
            <span>Subtotal</span>
            <span aria-live="polite">
              {quoting && !quote ? 'Calculating…' : quote ? formatZAR(quote.subtotal_cents) : '—'}
            </span>
          </div>
          <div className="summary__row muted small">
            <span>Delivery</span>
            <span>Pickup (free)</span>
          </div>
          <p className="muted small">Final prices are re-checked by our server at checkout.</p>
          <Link
            href="/checkout"
            className={`btn btn-primary btn-block${quoteError || !quote ? ' is-disabled' : ''}`}
            aria-disabled={!quote || !!quoteError}
            tabIndex={!quote || quoteError ? -1 : undefined}
          >
            Proceed to checkout
          </Link>
          <Link href="/products" className="link-arrow center block">Continue shopping</Link>
        </aside>
      </div>
    </section>
  );
}
