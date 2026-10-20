'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toApiError } from '@/lib/api';

/**
 * Landing page for the Google OAuth round trip.
 *
 * The API redirects here with a single-use `code`; we exchange it for a token
 * pair and sign the user in. Any failure sends the user back to the sign-in
 * page with a readable reason instead of stranding them on a dead end.
 */
function GoogleCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const { completeGoogleSignIn } = useAuth();

  // React 18/19 StrictMode double-invokes effects in dev; the code is
  // single-use, so only the first attempt may exchange it.
  const started = useRef(false);

  const code = params.get('code');
  const oauthError = params.get('error');
  const next = params.get('next') ?? '/products';

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const backToSignIn = (reason: string, nextPath?: string) => {
      const q = new URLSearchParams({ error: reason });
      if (nextPath) q.set('next', nextPath);
      router.replace(`/login?${q.toString()}`);
    };

    if (oauthError) {
      backToSignIn('cancelled');
      return;
    }
    if (!code) {
      backToSignIn('failed');
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
          backToSignIn('account_exists', '/link-google');
          return;
        }
        if (e2.status === 401) {
          backToSignIn('expired');
          return;
        }
        backToSignIn('failed');
      });
  }, [code, oauthError, next, completeGoogleSignIn, router]);

  return (
    <section className="container section">
      <div className="auth-card card center">
        <h1>Signing you in</h1>
        <p className="muted" role="status">
          Completing your Google sign-in…
        </p>
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
