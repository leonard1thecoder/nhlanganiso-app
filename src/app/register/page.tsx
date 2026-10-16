'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { Field, TextInput } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { describeError, toApiError } from '@/lib/api';
import { authService } from '@/lib/services';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterForm() {
  const params = useSearchParams();
  const next = params.get('next');
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : '/login';

  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'Please enter your full name.';
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address.';
    if (form.password.length < 8) e.password = 'Use at least 8 characters.';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.';
    return e;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setServerError(null);
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    setSubmitting(true);
    try {
      await authService.register({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      setDone(true);
    } catch (err) {
      const e2 = toApiError(err);
      setServerError(
        e2.status === 409
          ? 'An account with this email already exists. Try signing in instead.'
          : describeError(err),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <section className="container section">
        <div className="auth-card card center">
          <h1>Check your inbox</h1>
          <p className="muted">
            We sent a verification link to <strong>{form.email.trim().toLowerCase()}</strong>. It expires in 24 hours.
          </p>
          <Link href={loginHref} className="btn btn-primary">Continue to sign in</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container section">
      <div className="auth-card card">
        <p className="eyebrow">Join us</p>
        <h1>Create your account</h1>
        <p className="muted small">Track orders, reorder favourites and manage catering enquiries.</p>

        {serverError ? <Notice tone="error">{serverError}</Notice> : null}

        <form className="form-stack" onSubmit={onSubmit} noValidate>
          <Field id="full_name" label="Full name" required error={errors.full_name}>
            <TextInput id="full_name" autoComplete="name" value={form.full_name} onChange={set('full_name')} />
          </Field>
          <Field id="email" label="Email" required error={errors.email}>
            <TextInput id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
          </Field>
          <Field id="password" label="Password" required hint="At least 8 characters." error={errors.password}>
            <TextInput id="password" type={showPasswords ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={set('password')} />
          </Field>
          <Field id="confirm" label="Confirm password" required error={errors.confirm}>
            <TextInput id="confirm" type={showPasswords ? 'text' : 'password'} autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
          </Field>
          <label className="muted small" htmlFor="show-passwords">
            <input
              id="show-passwords"
              type="checkbox"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
            />{' '}
            Show passwords
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-links">
          <span className="muted">Already registered?</span> <Link href={loginHref}>Sign in</Link>
        </p>
      </div>
    </section>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="page-loading" role="status">Loading…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
