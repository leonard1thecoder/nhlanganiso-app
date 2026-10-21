'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { describeError } from '@/lib/api';
import { couponService } from '@/lib/services';
import type { AdminCoupon, CreateCouponBody } from '@/lib/types';

function CouponsView() {
  const [coupons, setCoupons] = useState<AdminCoupon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<CreateCouponBody>({
    code: '',
    discount_percentage: 10,
    max_usages: 50,
    active: true,
  });

  const loadCoupons = () => {
    couponService
      .adminList()
      .then(setCoupons)
      .catch((err) => setError(describeError(err)));
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await couponService.create({
        code: form.code.trim().toUpperCase(),
        discount_percentage: Number(form.discount_percentage),
        max_usages: form.max_usages ? Number(form.max_usages) : undefined,
        active: true,
      });
      setNotice(`Coupon ${form.code.toUpperCase()} created successfully.`);
      setForm({ code: '', discount_percentage: 10, max_usages: 50, active: true });
      loadCoupons();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: AdminCoupon) => {
    try {
      await couponService.update(coupon.id, { active: !coupon.active });
      loadCoupons();
    } catch (err) {
      setError(describeError(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await couponService.remove(id);
      loadCoupons();
    } catch (err) {
      setError(describeError(err));
    }
  };

  return (
    <section className="container section admin-coupons-section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/admin">Dashboard</Link>
        <span className="crumb-sep" aria-hidden="true">/</span>
        <span className="current" aria-current="page">Coupons &amp; Promotions</span>
      </nav>

      <header className="page-head admin-head">
        <div>
          <p className="eyebrow"><span className="rule" aria-hidden="true" />Promotions Manager</p>
          <h1 className="admin-title">Discount Coupons</h1>
          <p className="muted">Create special promotion codes, subscriber discounts, and usage limits.</p>
        </div>
      </header>

      {notice && <Notice tone="success">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <div className="admin-grid-layout">
        {/* Create Coupon Card */}
        <div className="admin-card card">
          <h2>Create New Coupon</h2>
          <form onSubmit={handleCreate} className="admin-form mt-3">
            <div className="field">
              <label htmlFor="cp-code" className="field__label">Coupon Code *</label>
              <input
                id="cp-code"
                className="input"
                type="text"
                placeholder="e.g. WELCOME10"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
            </div>

            <div className="field-grid-2">
              <div className="field">
                <label htmlFor="cp-discount" className="field__label">Discount (%) *</label>
                <input
                  id="cp-discount"
                  className="input"
                  type="number"
                  min="1"
                  max="100"
                  value={form.discount_percentage}
                  onChange={(e) => setForm({ ...form, discount_percentage: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="cp-usages" className="field__label">Max Usages</label>
                <input
                  id="cp-usages"
                  className="input"
                  type="number"
                  min="1"
                  value={form.max_usages || ''}
                  onChange={(e) => setForm({ ...form, max_usages: Number(e.target.value) })}
                  placeholder="e.g. 50"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block mt-3" disabled={submitting}>
              {submitting ? 'Creating…' : 'Issue Coupon Code →'}
            </button>
          </form>
        </div>

        {/* Coupons List Table */}
        <div className="admin-card card">
          <h2>Existing Coupons</h2>

          {!coupons ? (
            <div className="page-loading" role="status">Loading coupons…</div>
          ) : coupons.length === 0 ? (
            <p className="muted small mt-2">No active or past coupons found.</p>
          ) : (
            <div className="table-wrap mt-3">
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Usages</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id}>
                      <td><strong><code>{c.code}</code></strong></td>
                      <td>{c.discount_percentage}% off</td>
                      <td>{c.usage_count} {c.max_usages ? `/ ${c.max_usages}` : ''}</td>
                      <td>
                        <span className={`badge-pill ${c.active ? 'in-stock' : 'out-of-stock'}`}>
                          {c.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-row">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleToggleActive(c)}
                          >
                            {c.active ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-danger"
                            onClick={() => handleDelete(c.id)}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function AdminCouponsPage() {
  return (
    <RequireAuth adminOnly>
      <CouponsView />
    </RequireAuth>
  );
}
