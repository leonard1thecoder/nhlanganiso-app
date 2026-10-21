'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Field, TextArea, TextInput } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { FULFILMENT_OPTIONS, FulfilmentBadge, PaymentBadge } from '@/components/StatusBadge';
import { describeError } from '@/lib/api';
import { formatZAR } from '@/lib/format';
import { adminService, refundService } from '@/lib/services';
import type { FulfilmentStatus, OrderDetail, RefundableAmount } from '@/lib/types';

type RefundState = {
  info: RefundableAmount;
  reason: string;
  amount: string;
  submitting: boolean;
  error: string | null;
  done: string | null;
};

/**
 * Inline refund panel for one order. Shows the refundable amount, the bank
 * charge and what the customer actually receives before anything is sent.
 */
function RefundPanel({
  orderId,
  onClose,
  onDone,
}: {
  orderId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [state, setState] = useState<RefundState | null>(null);

  useEffect(() => {
    let cancelled = false;
    refundService
      .refundable(orderId)
      .then((info) => {
        if (cancelled) return;
        setState({
          info,
          reason: '',
          amount: String(info.refundable_cents / 100),
          submitting: false,
          error: null,
          done: null,
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            info: {
              order_id: orderId,
              payment_status: 'unknown',
              paid_cents: 0,
              refunded_cents: 0,
              refundable_cents: 0,
              bank_charge_pct: 8,
              bank_charge_cents: 0,
              net_to_customer_cents: 0,
              currency: 'ZAR',
            },
            reason: '',
            amount: '0',
            submitting: false,
            error: describeError(err),
            done: null,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (!state) {
    return (
      <div className="reply-builder">
        <p className="muted small">Loading refund details…</p>
      </div>
    );
  }

  const { info } = state;
  const gross = Number(state.amount.replace(',', '.')) || 0;
  const grossCents = Math.round(gross * 100);
  const chargeCents = Math.round((grossCents * info.bank_charge_pct) / 100);
  const netCents = grossCents - chargeCents;
  const overRefunding = grossCents > info.refundable_cents;

  const submit = async () => {
    if (!state.reason.trim()) {
      setState({ ...state, error: 'Add a reason so the customer and the books agree.' });
      return;
    }
    if (grossCents <= 0) {
      setState({ ...state, error: 'Enter a refund amount greater than zero.' });
      return;
    }
    setState({ ...state, submitting: true, error: null });
    try {
      const refund = await refundService.create(orderId, {
        gross_cents: grossCents,
        reason: state.reason.trim(),
      });
      setState({
        ...state,
        submitting: false,
        done:
          refund.status === 'succeeded'
            ? `Refunded ${formatZAR(refund.net_cents)} to the customer (after a ${info.bank_charge_pct}% bank charge).`
            : refund.status === 'manual_action_required'
              ? 'Refund recorded. Complete it in the PayFast sandbox dashboard.'
              : 'Refund could not be completed. See the refunds list for details.',
      });
      onDone();
    } catch (err) {
      setState({ ...state, submitting: false, error: describeError(err) });
    }
  };

  if (state.done) {
    return (
      <div className="reply-builder">
        <h3 className="card__title">Refund recorded</h3>
        <Notice tone="success">{state.done}</Notice>
        <button type="button" className="btn" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="reply-builder">
      <h3 className="card__title">Refund this order</h3>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}

      <p className="muted small">
        Paid {formatZAR(info.paid_cents)} · already refunded {formatZAR(info.refunded_cents)} ·
        refundable <strong>{formatZAR(info.refundable_cents)}</strong>
      </p>

      <div className="form-stack">
        <Field id={`rf-amount-${orderId}`} label="Refund amount (R)" required>
          <TextInput
            id={`rf-amount-${orderId}`}
            inputMode="decimal"
            value={state.amount}
            onChange={(e) => setState({ ...state, amount: e.target.value })}
          />
        </Field>

        <div className="receipt">
          <p>
            <strong>Refund summary</strong>
          </p>
          <p>Refund amount: {formatZAR(grossCents)}</p>
          <p>
            Bank charge ({info.bank_charge_pct}%): −{formatZAR(chargeCents)}
          </p>
          <p>Customer receives: {formatZAR(Math.max(netCents, 0))}</p>
        </div>

        {overRefunding ? (
          <Notice tone="error">
            That is more than the refundable amount ({formatZAR(info.refundable_cents)}).
          </Notice>
        ) : null}

        <Field id={`rf-reason-${orderId}`} label="Reason" required>
          <TextArea
            id={`rf-reason-${orderId}`}
            rows={3}
            value={state.reason}
            onChange={(e) => setState({ ...state, reason: e.target.value })}
            placeholder="Why is this order being refunded?"
          />
        </Field>

        <div className="cta-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={submit}
            disabled={state.submitting || overRefunding}
          >
            {state.submitting ? 'Refunding…' : `Refund ${formatZAR(Math.max(netCents, 0))}`}
          </button>
          <button type="button" className="btn" onClick={onClose} disabled={state.submitting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminOrders() {
  const [orders, setOrders] = useState<OrderDetail[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [refundId, setRefundId] = useState<string | null>(null);

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

  const reload = () => {
    adminService
      .orders()
      .then(setOrders)
      .catch((err) => setError(describeError(err)));
  };

  const canRefund = (o: OrderDetail) =>
    o.payment_status === 'paid' || o.payment_status === 'partially_refunded';

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
                <th scope="col">Refund</th>
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
                  <td data-label="Refund">
                    {canRefund(o) ? (
                      <button
                        type="button"
                        className="btn btn--sm"
                        onClick={() => setRefundId(refundId === o.id ? null : o.id)}
                      >
                        {refundId === o.id ? 'Close' : 'Refund'}
                      </button>
                    ) : (
                      <span className="muted small">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {refundId ? (
        <RefundPanel orderId={refundId} onClose={() => setRefundId(null)} onDone={reload} />
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
