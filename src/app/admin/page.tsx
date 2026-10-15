'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { describeError } from '@/lib/api';
import { formatZAR } from '@/lib/format';
import { adminService } from '@/lib/services';
import type { AdminSummary } from '@/lib/types';

function Dashboard() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminService
      .summary()
      .then((s) => !cancelled && setSummary(s))
      .catch((err) => !cancelled && setError(describeError(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="container section">
      <header className="page-head">
        <div>
          <p className="eyebrow">Back office</p>
          <h1>Dashboard</h1>
        </div>
      </header>

      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className="stat-grid">
        <div className="stat card">
          <span className="stat__label">Paid revenue</span>
          <span className="stat__value">{summary ? formatZAR(summary.revenue_cents) : '—'}</span>
        </div>
        <div className="stat card">
          <span className="stat__label">Orders</span>
          <span className="stat__value">{summary ? summary.orders : '—'}</span>
        </div>
      </div>

      <div className="cta-row">
        <Link href="/admin/orders" className="btn btn-primary">Manage orders</Link>
        <Link href="/admin/catering" className="btn btn-outline">Catering requests</Link>
      </div>
    </section>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth adminOnly>
      <Dashboard />
    </RequireAuth>
  );
}
