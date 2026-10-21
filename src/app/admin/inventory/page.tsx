'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { describeError } from '@/lib/api';
import { inventoryService, productService } from '@/lib/services';
import type { InventoryMovement, Product } from '@/lib/types';

function InventoryView() {
  const [movements, setMovements] = useState<InventoryMovement[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [adjustForm, setAdjustForm] = useState({
    product_id: '',
    qty_delta: 5,
    reason: 'Fresh bakery batch restock',
  });

  const loadData = () => {
    inventoryService
      .movements()
      .then(setMovements)
      .catch((err) => setError(describeError(err)));

    productService
      .list({ per_page: 50 })
      .then((res) => {
        setProducts(res.data);
        if (res.data.length > 0 && !adjustForm.product_id) {
          setAdjustForm((f) => ({ ...f, product_id: res.data[0].id }));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjust = async (e: FormEvent) => {
    e.preventDefault();
    if (!adjustForm.product_id) return;
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const res = await inventoryService.adjust(
        adjustForm.product_id,
        Number(adjustForm.qty_delta),
        adjustForm.reason.trim(),
      );
      setNotice(`Stock adjusted. New stock on hand: ${res.stock_on_hand}`);
      loadData();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container section admin-inventory-section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/admin">Dashboard</Link>
        <span className="crumb-sep" aria-hidden="true">/</span>
        <span className="current" aria-current="page">Inventory &amp; Stock</span>
      </nav>

      <header className="page-head admin-head">
        <div>
          <p className="eyebrow"><span className="rule" aria-hidden="true" />Warehouse &amp; Kitchen</p>
          <h1 className="admin-title">Inventory Movements &amp; Stock Adjustment</h1>
          <p className="muted">Log daily bakery batch restocks, write-offs, and track stock deltas.</p>
        </div>
      </header>

      {notice && <Notice tone="success">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <div className="admin-grid-layout">
        {/* Adjustment Form */}
        <div className="admin-card card">
          <h2>Stock Adjustment</h2>
          <form onSubmit={handleAdjust} className="admin-form mt-3">
            <div className="field">
              <label htmlFor="inv-product" className="field__label">Select Baked Good *</label>
              <select
                id="inv-product"
                className="input"
                value={adjustForm.product_id}
                onChange={(e) => setAdjustForm({ ...adjustForm, product_id: e.target.value })}
                required
              >
                {products ? (
                  products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                ) : (
                  <option value="">Loading products…</option>
                )}
              </select>
            </div>

            <div className="field">
              <label htmlFor="inv-delta" className="field__label">
                Quantity Delta * <small className="muted">(Use positive to add, negative to deduct)</small>
              </label>
              <input
                id="inv-delta"
                className="input"
                type="number"
                value={adjustForm.qty_delta}
                onChange={(e) => setAdjustForm({ ...adjustForm, qty_delta: Number(e.target.value) })}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="inv-reason" className="field__label">Reason for Movement *</label>
              <input
                id="inv-reason"
                className="input"
                type="text"
                placeholder="e.g. Daily morning oven batch, damaged item, etc."
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block mt-3" disabled={submitting}>
              {submitting ? 'Applying…' : 'Apply Stock Adjustment →'}
            </button>
          </form>
        </div>

        {/* Movements History Log */}
        <div className="admin-card card">
          <h2>Recent Inventory Movements</h2>

          {!movements ? (
            <div className="page-loading" role="status">Loading stock history…</div>
          ) : movements.length === 0 ? (
            <p className="muted small mt-2">No inventory adjustments recorded yet.</p>
          ) : (
            <div className="table-wrap mt-3">
              <table className="table">
                <thead>
                  <tr>
                    <th>Change</th>
                    <th>Reason</th>
                    <th>Product ID</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <strong className={m.qty_delta >= 0 ? 'text-success' : 'text-danger'}>
                          {m.qty_delta > 0 ? `+${m.qty_delta}` : m.qty_delta}
                        </strong>
                      </td>
                      <td>{m.reason}</td>
                      <td><code>{m.product_id.slice(0, 8)}…</code></td>
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

export default function AdminInventoryPage() {
  return (
    <RequireAuth adminOnly>
      <InventoryView />
    </RequireAuth>
  );
}
