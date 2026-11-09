'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Field, TextArea, TextInput } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { describeError } from '@/lib/api';
import { formatZAR } from '@/lib/format';
import { postToPayFast } from '@/lib/payfast';
import { cartService, orderService, paymentService } from '@/lib/services';
import { STORAGE_KEYS } from '@/lib/config';
import type { CartQuote } from '@/lib/types';

interface FormState {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = 'Please enter your full name.';
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address.';
  if (f.phone.trim() && !/^[+\d\s()-]{7,20}$/.test(f.phone.trim())) e.phone = 'Enter a valid contact phone number.';
  if (f.name.length > 120) e.name = 'Name must be 120 characters or fewer.';
  return e;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, clear, ready } = useCart();
  const { user, status } = useAuth();

  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', notes: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteAttempt, setQuoteAttempt] = useState(0);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || user.full_name,
        email: f.email || user.email,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!ready || lines.length === 0) return;
    let cancelled = false;
    setQuoteError(null);
    cartService
      .quote(lines.map((l) => ({ product_id: l.product_id, qty: l.qty })))
      .then((q) => {
        if (!cancelled) setQuote(q);
      })
      .catch((err) => {
        if (cancelled) return;
        setQuote(null);
        setQuoteError(describeError(err));
      });
    return () => {
      cancelled = true;
    };
    // Re-quote when the basket changes or the shopper asks to retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, lines, quoteAttempt]);

  if (!ready) return <div className="page-loading" role="status">Preparing your checkout…</div>;

  if (lines.length === 0) {
    return (
      <section className="container section center empty-checkout-section">
        <div className="empty-cart-icon">🛒</div>
        <h1>Your bag is empty</h1>
        <p className="muted">Add some freshly baked goodies before heading to checkout.</p>
        <Link href="/products" className="btn btn-primary btn-lg">Browse Bakery Shop</Link>
      </section>
    );
  }

  const set = (key: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setSubmitError(null);
    if (quote === null) {
      setSubmitError('We are still confirming your total. Please wait a moment and try again.');
      return;
    }
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;

    setSubmitting(true);
    try {
      const order = await orderService.create({
        contact_name: form.name.trim(),
        contact_email: form.email.trim().toLowerCase(),
        contact_phone: form.phone.trim() || undefined,
        notes: form.notes.trim() || undefined,
        fulfilment_method: 'pickup',
        items: lines.map((l) => ({ product_id: l.product_id, qty: l.qty })),
      });

      try {
        localStorage.setItem(STORAGE_KEYS.lastOrder, JSON.stringify(order));
      } catch {
        // LocalStorage is best-effort
      }

      const [nameFirst, ...rest] = form.name.trim().split(/\s+/);
      const nameLast = rest.join(' ') || undefined;

      const checkoutFields = await paymentService.checkout({
        order_id: order.id,
        name_first: nameFirst || undefined,
        name_last: nameLast,
        email_address: form.email.trim().toLowerCase(),
      });

      clear();
      postToPayFast(checkoutFields.checkout_url, checkoutFields.fields);
    } catch (err) {
      setSubmitError(describeError(err));
      setSubmitting(false);
    }
  };

  // Only the server-quoted total is shown or charged. No browser-side fallback.
  const payableTotal = quote?.subtotal_cents;
  const itemCount = lines.reduce((acc, l) => acc + l.qty, 0);

  return (
    <section className="container section checkout-section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/cart">← Back to your bag</Link>
      </nav>

      <header className="checkout-head">
        <p className="eyebrow">Checkout</p>
        <h1 className="checkout-title">Your details</h1>
        <p className="muted">
          Enter your contact details, then continue to PayFast to pay.
        </p>
      </header>

      {submitError ? (
        <Notice tone="error" title="We could not start your payment">
          {submitError}
        </Notice>
      ) : null}

      {quoteError ? (
        <Notice tone="error" title="We could not confirm your total">
          <p>{quoteError}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setQuoteAttempt((n) => n + 1)}>
            Try again
          </button>
        </Notice>
      ) : null}

      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={onSubmit} noValidate>
          <fieldset className="checkout-fieldset">
            <legend className="form-section-title">
              <span className="form-step-badge" aria-hidden="true">1</span>
              Contact details
            </legend>
            <p className="muted small">We use these to send your order confirmation.</p>

            <div className="field-grid-2">
              <Field id="checkout-name" label="Full name" required error={errors.name}>
                <TextInput
                  id="checkout-name"
                  value={form.name}
                  onChange={set('name')}
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'checkout-name-error' : undefined}
                />
              </Field>

              <Field id="checkout-email" label="Email address" required error={errors.email}>
                <TextInput
                  id="checkout-email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'checkout-email-error' : undefined}
                />
              </Field>
            </div>

            <Field
              id="checkout-phone"
              label="Phone number (optional)"
              hint="Add a number if you would like us to contact you about your order."
              error={errors.phone}
            >
              <TextInput
                id="checkout-phone"
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="e.g. 082 000 0000"
                autoComplete="tel"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'checkout-phone-error' : 'checkout-phone-hint'}
              />
            </Field>
          </fieldset>

          <fieldset className="checkout-fieldset">
            <legend className="form-section-title">
              <span className="form-step-badge" aria-hidden="true">2</span>
              Order notes (optional)
            </legend>
            <p className="muted small">Tell us about allergies or a message for a cake.</p>

            <Field id="checkout-notes" label="Notes">
              <TextArea
                id="checkout-notes"
                value={form.notes}
                onChange={set('notes')}
                rows={3}
                placeholder="For example: a message for the cake, or an allergy"
              />
            </Field>
          </fieldset>

          <div className="checkout-payment-note">
            <p>
              <strong>Next, you pay on PayFast.</strong> You will be taken to PayFast to pay by card or Instant EFT.
              We confirm your order once PayFast confirms payment.
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block checkout-submit-btn"
            disabled={submitting || payableTotal === undefined}
          >
            {submitting ? (
              <span className="btn-spinner-wrap">
                <span className="spinner" aria-hidden="true" />
                <span>Taking you to PayFast…</span>
              </span>
            ) : payableTotal === undefined ? (
              'Confirming your total…'
            ) : (
              `Pay ${formatZAR(payableTotal)} with PayFast`
            )}
          </button>
        </form>

        <aside className="checkout-summary" aria-labelledby="checkout-summary-title">
          <div className="checkout-summary-card">
            <h2 id="checkout-summary-title" className="summary-card-title">
              Your order <span className="muted">({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
            </h2>

            <ul className="checkout-item-list">
              {lines.map((l) => (
                <li key={l.product_id} className="checkout-item-row">
                  <div className="checkout-item-info">
                    <span className="checkout-item-name">{l.name}</span>
                    <span className="checkout-item-meta">
                      {l.qty} × {formatZAR(l.price_cents)}
                    </span>
                  </div>
                  <span className="checkout-item-price">{formatZAR(l.price_cents * l.qty)}</span>
                </li>
              ))}
            </ul>

            <dl className="checkout-totals">
              <div className="total-row">
                <dt>Subtotal</dt>
                <dd>{payableTotal !== undefined ? formatZAR(payableTotal) : 'Confirming…'}</dd>
              </div>
              <div className="total-row">
                <dt>Collection</dt>
                <dd>From our bakery</dd>
              </div>
              <div className="total-row total-row--final">
                <dt>Total</dt>
                <dd className="grand-total">{payableTotal !== undefined ? formatZAR(payableTotal) : 'Confirming…'}</dd>
              </div>
            </dl>

            <p className="checkout-summary-note muted small">
              Collection is from our bakery. Delivery is not available online yet.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
