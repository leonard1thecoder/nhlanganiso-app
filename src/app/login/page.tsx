'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { Field, TextInput } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { useAuth } from '@/context/AuthContext';
import { describeError, toApiError } from '@/lib/api';
import { safeNext } from '@/lib/redirect';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace(next);
    } catch (err) {
      const e2 = toApiError(err);
      // Do not reveal whether the account exists; the API already responds generically.
      setError(e2.status === 401 ? 'Incorrect email or password.' : describeError(err));
      setSubmitting(false);
    }
  };

  return (
    <section className="container section">
      <div className="auth-card card">
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in</h1>

        {error ? <Notice tone="error">{error}</Notice> : null}

        <form className="form-stack" onSubmit={onSubmit} noValidate>
          <Field id="email" label="Email" required>
            <TextInput id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field id="password" label="Password" required>
            <TextInput id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-links">
          <Link href="/forgot-password">Forgot password?</Link>
          <Link href={`/register?next=${encodeURIComponent(next)}`}>Create an account</Link>
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="page-loading" role="status">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
