'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Notice } from './Notice';

/**
 * Guards a page. Anonymous users are sent to /login with a `next` param.
 * Pass `adminOnly` for back-office pages (the API still enforces the role on every call).
 */
export function RequireAuth({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status === 'loading' || status === 'anonymous') {
    return <div className="page-loading" role="status">Loading…</div>;
  }

  if (adminOnly && user?.role !== 'admin') {
    return (
      <div className="container section">
        <Notice tone="error" title="Admins only">
          Your account does not have access to this area. <Link href="/">Back to the shop</Link>
        </Notice>
      </div>
    );
  }

  return <>{children}</>;
}
