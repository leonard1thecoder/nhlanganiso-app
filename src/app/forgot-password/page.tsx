'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Field, TextInput } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { describeError } from '@/lib/api';
import { authService } from '@/lib/services';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // The API always answers generically (no account enumeration), so we do too.
      await authService.requestPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container section">
      <div className="auth-card card">
        <p className="eyebrow">Account</p>
        <h1>Reset your password</h1>

        {sent ? (
          <Notice tone="success" title="Check your email">
            If an account exists for that address, a reset link is on its way. The link is valid for one hour.
          </Notice>
        ) : (
          <>
            <p className="muted">Enter the email you registered with and we will send you a reset link.</p>
            {error ? <Notice tone="error">{error}</Notice> : null}
            <form className="form-stack" onSubmit={onSubmit} noValidate>
              <Field id="email" label="Email" required>
                <TextInput id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !email.trim()}>
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}

        <p className="auth-links"><Link href="/login">← Back to sign in</Link></p>
      </div>
    </section>
  );
}
