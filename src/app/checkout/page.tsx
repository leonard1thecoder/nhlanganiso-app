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
    cartService
      .quote(lines.map((l) => ({ product_id: l.product_id, qty: l.qty })))
      .then(setQuote)
      .catch((err) => setSubmitError(describeError(err)));
  }, [ready, lines]);

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

  const snapshotTotal = lines.reduce((acc, l) => acc + l.price_cents * l.qty, 0);
  const payableTotal = quote?.subtotal_cents ?? snapshotTotal;

  return (
    <section className="container section checkout-section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/cart">← Return to Shopping Bag</Link>
      </nav>

      <header className="page-head checkout-head">
        <div>
          <p className="eyebrow"><span className="rule" aria-hidden="true" />Secure Checkout</p>
          <h1 className="checkout-title">Customer &amp; Collection Details</h1>
          <p className="muted">
            Complete your contact details below. You will be redirected to PayFast for protected payment verification.
          </p>
        </div>
      </header>

      {submitError && (
        <Notice tone="error" title="Checkout Notice">
          {submitError}
        </Notice>
      )}

      <div className="checkout-grid">
        <div className="checkout-form-container">
          <form className="checkout-form card" onSubmit={onSubmit} noValidate>
            <div className="form-section-head">
              <span className="form-step-badge">1</span>
              <div>
                <h2 className="form-section-title">Contact Information</h2>
                <p className="muted small">We will send your order confirmation and pickup notification here.</p>
              </div>
            </div>

            <div className="field-grid-2">
              <Field id="checkout-name" label="Full Name" required error={errors.name}>
                <TextInput
                  id="checkout-name"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. Nhlanganiso Khumalo"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                />
              </Field>

              <Field id="checkout-email" label="Email Address" required error={errors.email}>
                <TextInput
                  id="checkout-email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="name@domain.co.za"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                />
              </Field>
            </div>

            <Field
              id="checkout-phone"
              label="Contact Phone Number"
              hint="Required for SMS or WhatsApp notification when your order is fresh out of the oven."
              error={errors.phone}
            >
              <TextInput
                id="checkout-phone"
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+27 82 000 0000"
                autoComplete="tel"
                aria-invalid={Boolean(errors.phone)}
              />
            </Field>

            <div className="form-divider" />

            <div className="form-section-head">
              <span className="form-step-badge">2</span>
              <div>
                <h2 className="form-section-title">Special Bakery Instructions</h2>
                <p className="muted small">Specify any allergies, cake inscription notes, or requested collection timing.</p>
              </div>
            </div>

            <Field id="checkout-notes" label="Order Notes &amp; Requests (Optional)">
              <TextArea
                id="checkout-notes"
                value={form.notes}
                onChange={set('notes')}
                rows={3}
                placeholder="e.g. Please pipe 'Happy 30th Birthday Thando' in chocolate cream; collecting at 14:00."
              />
            </Field>

            <div className="checkout-trust-banner">
              <div className="trust-strip">
                <span className="trust-icon" aria-hidden="true">🔒</span>
                <div>
                  <strong>PayFast Official Payment Gateway</strong>
                  <p className="small muted">
                    Your card and EFT details are processed on PayFast&apos;s 256-bit encrypted banking server. Our server verifies payment signatures securely.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block checkout-submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <span className="btn-spinner-wrap">
                  <span className="spinner" aria-hidden="true" />
                  <span>Connecting to PayFast…</span>
                </span>
              ) : (
                <span>Pay {formatZAR(payableTotal)} via PayFast →</span>
              )}
            </button>
          </form>
        </div>

        <aside className="checkout-summary-sidebar">
          <div className="checkout-summary-card card">
            <h2 className="summary-card-title">Order Items ({lines.length})</h2>

            <ul className="checkout-item-list">
              {lines.map((l) => (
                <li key={l.product_id} className="checkout-item-row">
                  <div className="checkout-item-info">
                    <strong className="checkout-item-name">{l.name}</strong>
                    <span className="checkout-item-meta">
                      Qty: {l.qty} × {formatZAR(l.price_cents)}
                    </span>
                  </div>
                  <span className="checkout-item-price">
                    {formatZAR(l.price_cents * l.qty)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="checkout-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>{formatZAR(payableTotal)}</span>
              </div>
              <div className="total-row">
                <span>Collection Fulfilment</span>
                <span className="badge-free">Free (Bakery Pickup)</span>
              </div>
              <div className="total-row total-row--final">
                <strong>Total Due</strong>
                <strong className="grand-total">{formatZAR(payableTotal)}</strong>
              </div>
            </div>

            <div className="pickup-notice">
              <span className="pickup-icon" aria-hidden="true">📍</span>
              <p className="small muted">
                <strong>Collection Location:</strong> Nhlanganiso Bakery. We will prepare your items fresh for the appointed date.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
