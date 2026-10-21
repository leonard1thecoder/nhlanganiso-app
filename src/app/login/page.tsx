'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { Field, TextInput } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { useAuth } from '@/context/AuthContext';
import { describeError, OAUTH_ERROR_MESSAGES } from '@/lib/api';
import { safeNext } from '@/lib/redirect';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get('next');
  const next = safeNext(rawNext, '/products');
  const oauthError = params.get('error');
  const oauthErrorMessage = oauthError
    ? (OAUTH_ERROR_MESSAGES[oauthError] ?? OAUTH_ERROR_MESSAGES.failed)
    : null;
  const { login, loginWithGoogle, linkGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please provide your email address and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);

      if (next === '/link-google') {
        await linkGoogle();
        return;
      }

      router.push(next);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : '/register';

  return (
    <section className="container section auth-page-container">
      <div className="auth-box card">
        <div className="auth-head">
          <p className="eyebrow"><span className="rule" aria-hidden="true" />Welcome Back</p>
          <h1 className="auth-title">Sign in to Nhlanganiso</h1>
          <p className="muted small">Access your orders, track bakery collections, and manage your account.</p>
        </div>

        {oauthErrorMessage && <Notice tone="error">{oauthErrorMessage}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}

        <form onSubmit={onSubmit} className="auth-form" noValidate>
          <Field id="login-email" label="Email Address" required>
            <TextInput
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.co.za"
              autoComplete="email"
            />
          </Field>

          <Field id="login-password" label="Password" required>
            <div className="password-wrapper">
              <TextInput
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>

          <div className="auth-options">
            <Link href="/forgot-password" className="auth-link-subtle">
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block auth-btn"
            disabled={submitting}
          >
            {submitting ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
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
          Don&apos;t have an account yet?{' '}
          <Link href={registerHref} className="auth-highlight-link">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="page-loading" role="status">Loading sign in…</div>}>
      <LoginForm />
    </Suspense>
  );
}
