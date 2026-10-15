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
  if (!f.name.trim()) e.name = 'Please enter your name.';
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address.';
  if (f.phone.trim() && !/^[+\d\s()-]{7,20}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number.';
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

  // Prefill from the signed-in account (guests fill the form manually).
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

  if (!ready) return <div className="page-loading" role="status">Loading…</div>;

  if (lines.length === 0) {
    return (
      <section className="container section center">
        <h1>Nothing to check out</h1>
        <p className="muted">Your cart is empty.</p>
        <Link href="/products" className="btn btn-primary">Browse the shop</Link>
      </section>
    );
  }

  const set = (key: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitting(true);
    try {
      // 1. Create the order (guest allowed; the API attaches the account if signed in).
      const order = await orderService.create({
        items: lines.map((l) => ({ product_id: l.product_id, qty: l.qty })),
        fulfilment_method: 'pickup',
        contact_name: form.name.trim(),
        contact_email: form.email.trim().toLowerCase(),
        contact_phone: form.phone.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });

      // Remember the order for the success page (cart is cleared there, after payment returns).
      try {
        window.sessionStorage.setItem(
          STORAGE_KEYS.lastOrder,
          JSON.stringify({ id: order.id, reference: order.reference, total_cents: order.total_cents }),
        );
      } catch {
        /* storage may be unavailable (private mode); not fatal */
      }

      // 2. Ask the API for signed PayFast fields (amount is computed server-side).
      const nameParts = form.name.trim().split(/\s+/);
      const checkout = await paymentService.checkout({
        order_id: order.id,
        name_first: nameParts[0],
        name_last: nameParts.slice(1).join(' ') || undefined,
        email_address: form.email.trim().toLowerCase(),
      });

      // 3. Hand the browser over to PayFast. The page navigates away from here.
      postToPayFast(checkout.checkout_url, checkout.fields);
    } catch (err) {
      setSubmitError(describeError(err));
      setSubmitting(false);
    }
  };

  return (
    <section className="container section">
      <header className="page-head">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1>Your details</h1>
          {status !== 'authenticated' ? (
            <p className="muted small">
              Already have an account? <Link href={`/login?next=${encodeURIComponent('/checkout')}`}>Sign in</Link> to
              track your order later.
            </p>
          ) : null}
        </div>
      </header>

      {submitError ? <Notice tone="error" title="We could not start your payment">{submitError}</Notice> : null}

      <div className="cart-layout">
        <form className="card form-stack" onSubmit={onSubmit} noValidate aria-describedby="checkout-help">
          <p id="checkout-help" className="muted small">
            Fields marked * are required. You will be redirected to PayFast to pay securely.
          </p>

          <Field id="name" label="Full name" required error={errors.name}>
            <TextInput
              id="name"
              autoComplete="name"
              value={form.name}
              onChange={set('name')}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
          </Field>

          <Field id="email" label="Email" required hint="We send your receipt here." error={errors.email}>
            <TextInput
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
              aria-invalid={!!errors.email}
            />
          </Field>

          <Field id="phone" label="Phone (optional)" error={errors.phone}>
            <TextInput id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} aria-invalid={!!errors.phone} />
          </Field>

          <fieldset className="fieldset">
            <legend className="field__label">Fulfilment</legend>
            <div className="radio-card is-selected">
              <input type="radio" id="pickup" name="fulfilment" value="pickup" defaultChecked />
              <label htmlFor="pickup">
                <strong>Collect from the bakery</strong>
                <span className="muted small">No delivery fee.</span>
              </label>
            </div>
            <p className="muted small">Delivery is not yet available online. Contact us for delivery requests.</p>
          </fieldset>

          <Field id="notes" label="Order notes (optional)">
            <TextArea id="notes" value={form.notes} onChange={set('notes')} placeholder="Allergies, decorations, collection time…" />
          </Field>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting || !quote}>
            {submitting ? 'Preparing secure payment…' : `Pay ${quote ? formatZAR(quote.subtotal_cents) : ''} securely`}
          </button>
          <p className="muted small center">Payments are processed by PayFast. We never see your card details.</p>
        </form>

        <aside className="summary card" aria-label="Order summary">
          <h2 className="summary__title">Items</h2>
          <ul className="summary__items">
            {lines.map((l) => (
              <li key={l.product_id}>
                <span>{l.qty} × {l.name}</span>
                <span>{formatZAR(l.price_cents * l.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="summary__row">
            <span>Subtotal</span>
            <span>{quote ? formatZAR(quote.subtotal_cents) : 'Calculating…'}</span>
          </div>
          <div className="summary__row">
            <span>Delivery</span>
            <span>Free (pickup)</span>
          </div>
          <div className="summary__row summary__total">
            <span>Total</span>
            <span>{quote ? formatZAR(quote.subtotal_cents) : '—'}</span>
          </div>
          <Link href="/cart" className="link-arrow center block">Edit cart</Link>
        </aside>
      </div>
    </section>
  );
}
