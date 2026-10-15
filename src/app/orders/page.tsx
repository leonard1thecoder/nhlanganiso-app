'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { Notice } from '@/components/Notice';
import { describeError } from '@/lib/api';
import { formatZAR } from '@/lib/format';
import { orderService } from '@/lib/services';
import type { OrderSummary } from '@/lib/types';
import { PaymentBadge } from '@/components/StatusBadge';

function OrdersList() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    orderService
      .mine()
      .then((o) => !cancelled && setOrders(o))
      .catch((err) => !cancelled && setError(describeError(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="container section">
      <header className="page-head">
        <div>
          <p className="eyebrow">Account</p>
          <h1>My orders</h1>
        </div>
      </header>

      {error ? <Notice tone="error">{error}</Notice> : null}
      {!error && orders === null ? <div className="page-loading" role="status">Loading orders…</div> : null}

      {orders && orders.length === 0 ? (
        <div className="empty">
          <p>You have not placed any orders yet.</p>
          <Link href="/products" className="btn btn-primary">Start shopping</Link>
        </div>
      ) : null}

      {orders && orders.length > 0 ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Reference</th>
                <th scope="col">Total</th>
                <th scope="col">Payment</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td data-label="Reference"><code>{o.reference}</code></td>
                  <td data-label="Total">{formatZAR(o.total_cents)}</td>
                  <td data-label="Payment"><PaymentBadge status={o.payment_status} /></td>
                  <td data-label="">
                    <Link href={`/orders/${o.id}`} className="link-arrow">View →</Link>
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

export default function OrdersPage() {
  return (
    <RequireAuth>
      <OrdersList />
    </RequireAuth>
  );
}
