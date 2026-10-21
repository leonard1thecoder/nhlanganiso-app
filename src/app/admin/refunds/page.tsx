'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Field, TextArea } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { describeError } from '@/lib/api';
import { formatZAR } from '@/lib/format';
import { refundService } from '@/lib/services';
import type { Refund } from '@/lib/types';

const STATUS_LABEL: Record<string, string> = {
  requested: 'Awaiting decision',
  pending: 'Pending',
  succeeded: 'Refunded',
  failed: 'Failed',
  rejected: 'Declined',
  manual_action_required: 'Action needed in PayFast',
};

function AdminRefunds() {
  const [refunds, setRefunds] = useState<Refund[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = () => {
    refundService
      .list()
      .then(setRefunds)
      .catch((err) => setError(describeError(err)));
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await refundService.approve(id);
      setError(null);
      if (res.status === 'failed') {
        setError('The refund could not be completed. Check the PayFast response.');
      }
      load();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    if (!rejectReason.trim()) {
      setError('Add a note so the customer knows why it was declined.');
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      await refundService.reject(id, rejectReason.trim());
      setRejectingId(null);
      setRejectReason('');
      load();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusyId(null);
    }
  };

  const requested = (refunds ?? []).filter((r) => r.status === 'requested');
  const history = (refunds ?? []).filter((r) => r.status !== 'requested');

  return (
    <section className="container section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/admin">Dashboard</Link> <span aria-hidden="true">/</span> <span>Refunds</span>
      </nav>
      <header className="page-head">
        <div>
          <p className="eyebrow">Back office</p>
          <h1>Refunds</h1>
          <p className="muted small">
            Customer requests, and the refund history. A bank charge of 8% is deducted from every
            refund.
          </p>
        </div>
      </header>

      {error ? <Notice tone="error">{error}</Notice> : null}
      {!error && refunds === null ? (
        <div className="page-loading" role="status">Loading refunds…</div>
      ) : null}

      {requested.length > 0 ? (
        <div className="stack-lg" style={{ marginBottom: '32px' }}>
          <h2 className="card__title">Waiting for a decision</h2>
          {requested.map((r) => (
            <div key={r.id} className="card">
              <div className="receipt">
                <p>
                  <strong>Refund request</strong>
                </p>
                <p>Order: {r.order_id.slice(0, 8)}…</p>
                <p>Requested: {formatZAR(r.gross_cents)}</p>
                <p>
                  Bank charge ({r.bank_charge_pct}%): −{formatZAR(r.bank_charge_cents)}
                </p>
                <p>Customer receives: {formatZAR(r.net_cents)}</p>
                {r.reason ? <p>Reason: {r.reason}</p> : null}
                <p className="muted small">Requested {new Date(r.created_at).toLocaleString()}</p>
              </div>

              {rejectingId === r.id ? (
                <div className="form-stack" style={{ marginTop: '12px' }}>
                  <Field id={`rej-${r.id}`} label="Why is it declined?" required>
                    <TextArea
                      id={`rej-${r.id}`}
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                  </Field>
                  <div className="cta-row">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => reject(r.id)}
                      disabled={busyId === r.id}
                    >
                      {busyId === r.id ? 'Declining…' : 'Decline refund'}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason('');
                      }}
                      disabled={busyId === r.id}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="cta-row">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => approve(r.id)}
                    disabled={busyId === r.id}
                  >
                    {busyId === r.id ? 'Approving…' : `Approve ${formatZAR(r.net_cents)}`}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setRejectingId(r.id)}
                    disabled={busyId === r.id}
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {refunds !== null && requested.length === 0 ? (
        <p className="muted">No refund requests waiting.</p>
      ) : null}

      {history.length > 0 ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col" className="num">Amount</th>
                <th scope="col" className="num">Charge</th>
                <th scope="col" className="num">Customer gets</th>
                <th scope="col">Status</th>
                <th scope="col">When</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r.id}>
                  <td data-label="Order">
                    <Link href={`/orders/${r.order_id}`}>
                      <code>{r.order_id.slice(0, 8)}…</code>
                    </Link>
                  </td>
                  <td data-label="Amount" className="num">{formatZAR(r.gross_cents)}</td>
                  <td data-label="Charge" className="num">−{formatZAR(r.bank_charge_cents)}</td>
                  <td data-label="Customer gets" className="num">{formatZAR(r.net_cents)}</td>
                  <td data-label="Status">
                    <span className={`badge badge--${r.status}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                  <td data-label="When" className="small">
                    {new Date(r.created_at).toLocaleDateString()}
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

export default function AdminRefundsPage() {
  return (
    <RequireAuth adminOnly>
      <AdminRefunds />
    </RequireAuth>
  );
}
