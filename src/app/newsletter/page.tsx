'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { Field, TextInput } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { describeError, toApiError } from '@/lib/api';
import { newsletterService } from '@/lib/services';
import type { NewsletterReceipt } from '@/lib/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function NewsletterForm() {
  const params = useSearchParams();
  const token = params.get('token');

  const [email, setEmail] = useState('');
  const [receipt, setReceipt] = useState<NewsletterReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(Boolean(token));

  // Arriving from the confirmation email: verify the token and show the receipt.
  useEffect(() => {
    if (!token) return;
    void newsletterService
      .verify(token)
      .then((r) => setReceipt(r))
      .catch((err) => setError(describeError(err)))
      .finally(() => setVerifying(false));
  }, [token]);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      const r = await newsletterService.subscribe(email.trim().toLowerCase());
      setReceipt(r);
      setEmail('');
    } catch (err) {
      setError(toApiError(err).status === 409 ? describeError(err) : describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <section className="container section">
        <div className="auth-card card">
          <p className="eyebrow">Newsletter</p>
          <h1>{receipt.status === 'verified' ? 'Subscription confirmed' : 'You are on the list'}</h1>

          <div className="receipt">
            <p>
              <strong>Subscription receipt</strong>
            </p>
            <p>
              Reference: <strong>{receipt.reference ?? '—'}</strong>
            </p>
            <p>Email: {receipt.email}</p>
            <p>
              Status: {receipt.status === 'verified' ? 'confirmed' : 'awaiting confirmation'}
            </p>
          </div>

          {receipt.status !== 'verified' ? (
            <Notice tone="success">
              Check your inbox and click the confirmation link to activate your subscription.
            </Notice>
          ) : null}

          <p className="muted small">
            <Link href="/products">Continue shopping</Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="container section">
      <div className="auth-card card">
        <p className="eyebrow">Newsletter</p>
        <h1>Get our newsletter</h1>
        <p className="muted small">
          New bakes, seasonal menus and offers. One email a month, no spam.
        </p>

        {error ? <Notice tone="error">{error}</Notice> : null}
        {verifying ? <Notice tone="success">Confirming your subscription…</Notice> : null}

        <form className="form-stack" onSubmit={onSubmit} noValidate>
          <Field id="newsletter-email" label="Email address" required>
            <TextInput
              id="newsletter-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Subscribing…' : 'Subscribe'}
          </button>
        </form>
      </div>
    </section>
  );
}

export default function NewsletterPage() {
  return (
    <Suspense fallback={<div className="page-loading" role="status">Loading…</div>}>
      <NewsletterForm />
    </Suspense>
  );
}
