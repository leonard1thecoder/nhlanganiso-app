'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Notice } from '@/components/Notice';
import { describeError } from '@/lib/api';
import { authService } from '@/lib/services';

function VerifyView() {
  const token = useSearchParams().get('token');
  const [state, setState] = useState<'checking' | 'ok' | 'error'>('checking');
  const [message, setMessage] = useState<string | null>(null);

  // Verification tokens are single-use. React's dev-mode double effect would otherwise
  // call the endpoint twice and report the second call as "invalid". Guard it.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setState('error');
      setMessage('This link is missing its verification token.');
      return;
    }
    authService
      .verifyEmail(token)
      .then(() => setState('ok'))
      .catch((err) => {
        setState('error');
        setMessage(describeError(err));
      });
  }, [token]);

  return (
    <section className="container section">
      <div className="auth-card card center">
        {state === 'checking' ? <p className="muted" role="status">Verifying your email…</p> : null}

        {state === 'ok' ? (
          <>
            <h1>Email verified</h1>
            <p className="muted">Thanks — your account is ready.</p>
            <Link href="/login" className="btn btn-primary">Sign in</Link>
          </>
        ) : null}

        {state === 'error' ? (
          <>
            <h1>We could not verify this link</h1>
            <Notice tone="error">{message}</Notice>
            <p className="muted small">Links expire after 24 hours. You can register again or contact us for help.</p>
            <Link href="/register" className="btn btn-outline">Create an account</Link>
          </>
        ) : null}
      </div>
    </section>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="page-loading" role="status">Loading…</div>}>
      <VerifyView />
    </Suspense>
  );
}
