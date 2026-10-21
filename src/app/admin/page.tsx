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
    <section className="container section admin-dashboard-section">
      <header className="page-head admin-head">
        <div>
          <p className="eyebrow"><span className="rule" aria-hidden="true" />Store Management</p>
          <h1 className="admin-title">Bakery Control Centre</h1>
          <p className="muted">Live overview of orders, inventory, catering requests, and revenue.</p>
        </div>
        <Link href="/" className="link-arrow">
          ← View Live Storefront
        </Link>
      </header>

      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className="stat-grid admin-stat-grid">
        <div className="stat card">
          <div className="stat__icon-box">💰</div>
          <div className="stat__details">
            <span className="stat__label">Verified Revenue</span>
            <span className="stat__value">{summary ? formatZAR(summary.revenue_cents) : '—'}</span>
            <span className="stat__hint muted small">Settled via PayFast</span>
          </div>
        </div>

        <div className="stat card">
          <div className="stat__icon-box">📦</div>
          <div className="stat__details">
            <span className="stat__label">Total Orders</span>
            <span className="stat__value">{summary ? summary.orders : '—'}</span>
            <span className="stat__hint muted small">Processed to date</span>
          </div>
        </div>
      </div>

      <div className="admin-quick-actions card">
        <h2 className="admin-actions-title">Store Management Portals</h2>
        <div className="admin-actions-grid">
          <Link href="/admin/orders" className="admin-action-card">
            <div className="admin-action-icon">📋</div>
            <div className="admin-action-copy">
              <strong>Orders &amp; Fulfilment</strong>
              <p className="muted small">Review customer orders, verify payment, and update collection states.</p>
            </div>
            <span className="admin-action-arrow">→</span>
          </Link>

          <Link href="/admin/products" className="admin-action-card">
            <div className="admin-action-icon">🥐</div>
            <div className="admin-action-copy">
              <strong>Product Catalogue</strong>
              <p className="muted small">Update cakes, bread, pricing, descriptions, and stock availability.</p>
            </div>
            <span className="admin-action-arrow">→</span>
          </Link>

          <Link href="/admin/inventory" className="admin-action-card">
            <div className="admin-action-icon">📦</div>
            <div className="admin-action-copy">
              <strong>Inventory &amp; Stock</strong>
              <p className="muted small">Adjust stock on hand with reasons and view stock movements.</p>
            </div>
            <span className="admin-action-arrow">→</span>
          </Link>

          <Link href="/admin/coupons" className="admin-action-card">
            <div className="admin-action-icon">🎟️</div>
            <div className="admin-action-copy">
              <strong>Coupons &amp; Promos</strong>
              <p className="muted small">Issue discount codes, manage usage limits and expiration.</p>
            </div>
            <span className="admin-action-arrow">→</span>
          </Link>

          <Link href="/admin/catering" className="admin-action-card">
            <div className="admin-action-icon">🥂</div>
            <div className="admin-action-copy">
              <strong>Catering Enquiries</strong>
              <p className="muted small">Respond to wedding and event catering requests, issue quotes.</p>
            </div>
            <span className="admin-action-arrow">→</span>
          </Link>

          <Link href="/admin/categories" className="admin-action-card">
            <div className="admin-action-icon">🏷️</div>
            <div className="admin-action-copy">
              <strong>Categories</strong>
              <p className="muted small">Organise treats into customer-facing departments and categories.</p>
            </div>
            <span className="admin-action-arrow">→</span>
          </Link>

          <Link href="/admin/newsletter" className="admin-action-card">
            <div className="admin-action-icon">✉️</div>
            <div className="admin-action-copy">
              <strong>Subscribers &amp; Newsletters</strong>
              <p className="muted small">Send bakery newsletters, view subscriber counts, and export lists.</p>
            </div>
            <span className="admin-action-arrow">→</span>
          </Link>

          <Link href="/admin/logs" className="admin-action-card">
            <div className="admin-action-icon">🛡️</div>
            <div className="admin-action-copy">
              <strong>Audit &amp; Email Outbox</strong>
              <p className="muted small">Review system audit trail and verify email delivery queues.</p>
            </div>
            <span className="admin-action-arrow">→</span>
          </Link>
        </div>
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
