'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { FULFILMENT_OPTIONS, FulfilmentBadge, PaymentBadge } from '@/components/StatusBadge';
import { describeError } from '@/lib/api';
import { formatZAR } from '@/lib/format';
import { adminService } from '@/lib/services';
import type { FulfilmentStatus, OrderDetail } from '@/lib/types';

function AdminOrders() {
  const [orders, setOrders] = useState<OrderDetail[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminService
      .orders()
      .then((o) => !cancelled && setOrders(o))
      .catch((err) => !cancelled && setError(describeError(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  const changeFulfilment = async (id: string, status: FulfilmentStatus) => {
    setSavingId(id);
    setError(null);
    try {
      await adminService.setFulfilment(id, status);
      setOrders((list) => list?.map((o) => (o.id === id ? { ...o, fulfilment_status: status } : o)) ?? null);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="container section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/admin">Dashboard</Link> <span aria-hidden="true">/</span> <span>Orders</span>
      </nav>
      <header className="page-head">
        <div>
          <p className="eyebrow">Back office</p>
          <h1>Orders</h1>
          <p className="muted small">Most recent 100 orders.</p>
        </div>
      </header>

      {error ? <Notice tone="error">{error}</Notice> : null}
      {!error && orders === null ? <div className="page-loading" role="status">Loading orders…</div> : null}

      {orders && orders.length === 0 ? <p className="muted">No orders yet.</p> : null}

      {orders && orders.length > 0 ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Reference</th>
                <th scope="col" className="num">Total</th>
                <th scope="col">Payment</th>
                <th scope="col">Fulfilment</th>
                <th scope="col">Update</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td data-label="Reference"><code>{o.reference}</code></td>
                  <td data-label="Total" className="num">{formatZAR(o.total_cents)}</td>
                  <td data-label="Payment"><PaymentBadge status={o.payment_status} /></td>
                  <td data-label="Fulfilment"><FulfilmentBadge status={o.fulfilment_status} /></td>
                  <td data-label="Update">
                    <label className="sr-only" htmlFor={`f-${o.id}`}>Fulfilment status for {o.reference}</label>
                    <select
                      id={`f-${o.id}`}
                      className="input input--sm"
                      value={o.fulfilment_status}
                      disabled={savingId === o.id}
                      onChange={(e) => changeFulfilment(o.id, e.target.value as FulfilmentStatus)}
                    >
                      {FULFILMENT_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

export default function AdminOrdersPage() {
  return (
    <RequireAuth adminOnly>
      <AdminOrders />
    </RequireAuth>
  );
}
