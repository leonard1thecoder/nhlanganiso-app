'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { Field, TextInput } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { describeError } from '@/lib/api';
import { authService } from '@/lib/services';

function ResetForm() {
  const token = useSearchParams().get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <section className="container section">
        <div className="auth-card card center">
          <h1>Invalid reset link</h1>
          <p className="muted">This link is incomplete. Request a new one.</p>
          <Link href="/forgot-password" className="btn btn-primary">Request a new link</Link>
        </div>
      </section>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setSubmitting(true);
    try {
      await authService.confirmPasswordReset(token, password);
      setDone(true);
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
        <h1>Choose a new password</h1>

        {done ? (
          <>
            <Notice tone="success" title="Password updated">
              For your security, all other sessions have been signed out.
            </Notice>
            <Link href="/login" className="btn btn-primary btn-block">Sign in</Link>
          </>
        ) : (
          <>
            {error ? <Notice tone="error">{error}</Notice> : null}
            <form className="form-stack" onSubmit={onSubmit} noValidate>
              <Field id="password" label="New password" required hint="At least 8 characters.">
                <TextInput id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
              <Field id="confirm" label="Confirm new password" required>
                <TextInput id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </Field>
              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Saving…' : 'Update password'}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="page-loading" role="status">Loading…</div>}>
      <ResetForm />
    </Suspense>
  );
}
