'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { Field, TextInput } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { describeError, OAUTH_ERROR_MESSAGES } from '@/lib/api';
import { authService } from '@/lib/services';
import { useAuth } from '@/context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterForm() {
  const params = useSearchParams();
  const next = params.get('next');
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : '/login';
  const oauthError = params.get('error');
  const oauthErrorMessage = oauthError
    ? (OAUTH_ERROR_MESSAGES[oauthError] ?? OAUTH_ERROR_MESSAGES.failed)
    : null;
  const { loginWithGoogle } = useAuth();

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
        email: form.email.trim().toLowerCase(),
        password: form.password,
        full_name: form.full_name.trim(),
      });
      setDone(true);
    } catch (err) {
      setServerError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <section className="container section center auth-page-container">
        <div className="auth-box card text-center">
          <div className="empty-cart-icon">✉️</div>
          <p className="eyebrow"><span className="rule" aria-hidden="true" />Check Your Inbox</p>
          <h1 className="auth-title">Verify your email</h1>
          <p className="muted">
            We sent a verification link to <strong>{form.email}</strong>. Please check your email to activate your Nhlanganiso account.
          </p>
          <Link href={loginHref} className="btn btn-primary btn-lg mt-4">
            Proceed to Sign In →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container section auth-page-container">
      <div className="auth-box card">
        <div className="auth-head">
          <p className="eyebrow"><span className="rule" aria-hidden="true" />Join Nhlanganiso</p>
          <h1 className="auth-title">Create an Account</h1>
          <p className="muted small">Quick checkout, order history tracking, and exclusive bakery notices.</p>
        </div>

        {oauthErrorMessage && <Notice tone="error">{oauthErrorMessage}</Notice>}
        {serverError && <Notice tone="error">{serverError}</Notice>}

        <form onSubmit={onSubmit} className="auth-form" noValidate>
          <Field id="reg-name" label="Full Name" required error={errors.full_name}>
            <TextInput
              id="reg-name"
              value={form.full_name}
              onChange={set('full_name')}
              placeholder="e.g. Thabo Ndlovu"
              autoComplete="name"
            />
          </Field>

          <Field id="reg-email" label="Email Address" required error={errors.email}>
            <TextInput
              id="reg-email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="thabo@domain.co.za"
              autoComplete="email"
            />
          </Field>

          <Field id="reg-password" label="Password" required hint="At least 8 characters" error={errors.password}>
            <div className="password-wrapper">
              <TextInput
                id="reg-password"
                type={showPasswords ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPasswords((v) => !v)}
                aria-label={showPasswords ? 'Hide password' : 'Show password'}
              >
                {showPasswords ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>

          <Field id="reg-confirm" label="Confirm Password" required error={errors.confirm}>
            <TextInput
              id="reg-confirm"
              type={showPasswords ? 'text' : 'password'}
              value={form.confirm}
              onChange={set('confirm')}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block auth-btn"
            disabled={submitting}
          >
            {submitting ? 'Creating Account…' : 'Create Account →'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or sign up with</span>
        </div>

        <button
          type="button"
          className="btn btn-outline btn-block oauth-google-btn"
          onClick={() => void loginWithGoogle()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="auth-footer-prompt">
          Already have an account?{' '}
          <Link href={loginHref} className="auth-highlight-link">
            Sign in
          </Link>
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
