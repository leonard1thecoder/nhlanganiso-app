'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Notice } from '@/components/Notice';
import { useAuth } from '@/context/AuthContext';
import { describeError, toApiError } from '@/lib/api';
import { safeNext } from '@/lib/redirect';

function GoogleCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const { completeGoogleSignIn } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  // React 18/19 StrictMode double-invokes effects in dev; the code is
  // single-use, so only the first attempt may exchange it.
  const started = useRef(false);

  const code = params.get('code');
  const oauthError = params.get('error');
  const next = safeNext(params.get('next'), '/products');

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (oauthError) {
      setError('Google sign-in was cancelled or refused. Please try again.');
      return;
    }
    if (!code) {
      setError('We could not complete the Google sign-in. Please try again.');
      return;
    }

    void completeGoogleSignIn(code)
      .then((me) => {
        // Admins land on the back office unless a destination was requested.
        router.replace(me.role === 'admin' && next === '/products' ? '/admin' : next);
      })
      .catch((err) => {
        const e2 = toApiError(err);
        if (e2.status === 409) {
          // The email already belongs to a password account. We never merge
          // accounts on email alone, so the user signs in and links instead.
          setConflict(true);
          return;
        }
        setError(
          e2.status === 401
            ? 'That sign-in link has expired. Please try again.'
            : describeError(err),
        );
      });
  }, [code, oauthError, next, completeGoogleSignIn, router]);

  if (conflict) {
    return (
      <section className="container section">
        <div className="auth-card card center">
          <h1>Account already exists</h1>
          <Notice tone="error">
            There is already an account with this email address. Sign in with your password to
            continue, then link your Google account to it.
          </Notice>
          <p className="muted small">
            <Link href="/login?next=%2Flink-google">Sign in and link Google</Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="container section">
      <div className="auth-card card center">
        <h1>{error ? 'Sign-in failed' : 'Signing you in'}</h1>
        {error ? (
          <>
            <Notice tone="error">{error}</Notice>
            <p className="muted small">
              <Link href="/login">Back to sign in</Link>
            </p>
          </>
        ) : (
          <p className="muted" role="status">
            Completing your Google sign-in…
          </p>
        )}
      </div>
    </section>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className="page-loading" role="status">Loading…</div>}>
      <GoogleCallback />
    </Suspense>
  );
}
