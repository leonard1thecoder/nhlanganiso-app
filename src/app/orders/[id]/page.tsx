'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Field, TextArea, TextInput } from '@/components/Field';
import { FulfilmentBadge, PaymentBadge } from '@/components/StatusBadge';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { describeError } from '@/lib/api';
import { CONTACT, HAS_REAL_CONTACT_EMAIL } from '@/lib/config';
import { formatZAR } from '@/lib/format';
import { orderService, refundService } from '@/lib/services';
import type { OrderDetail, Refund } from '@/lib/types';

function OrderView() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [refunds, setRefunds] = useState<Refund[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Refund request form state
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundSent, setRefundSent] = useState(false);

  const load = useCallback(async () => {
    try {
      setOrder(await orderService.get(id));
      setError(null);
    } catch (err) {
      setError(describeError(err));
    }
    // Refunds are supplementary: a failure here must not break the order view.
    try {
      setRefunds(await refundService.forOrder(id));
    } catch {
      setRefunds(null);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const onCancel = async () => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setBusy(true);
    setMessage(null);
    try {
      await orderService.cancel(id);
      setMessage('Your order has been cancelled.');
      await load();
    } catch (err) {
      setMessage(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  const onRequestRefund = async () => {
    setRefundError(null);
    if (!refundReason.trim()) {
      setRefundError('Tell us why you would like a refund.');
      return;
    }
    const amount = refundAmount.trim();
    const grossCents = amount ? Math.round(Number(amount.replace(',', '.')) * 100) : undefined;
    if (grossCents !== undefined && (!Number.isFinite(grossCents) || grossCents <= 0)) {
      setRefundError('Enter a refund amount greater than zero, or leave it empty for the full amount.');
      return;
    }
    setBusy(true);
    try {
      await refundService.request(id, {
        gross_cents: grossCents,
        reason: refundReason.trim(),
      });
      setRefundSent(true);
      setRefundReason('');
      setRefundAmount('');
      await load();
    } catch (err) {
      setRefundError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <section className="container section">
        <Notice tone="error" title="Could not load this order">{error}</Notice>
        <Link href="/orders" className="link-arrow">← Back to my orders</Link>
      </section>
    );
  }

  if (!order) return <div className="page-loading" role="status">Loading order…</div>;

  const canCancel = order.payment_status !== 'paid' && order.fulfilment_status !== 'cancelled';

  // A refund can be requested for a paid order that has no refund in progress.
  const hasOpenRefund = (refunds ?? []).some((r) =>
    ['requested', 'pending', 'succeeded', 'manual_action_required'].includes(r.status),
  );
  const canRequestRefund =
    (order.payment_status === 'paid' || order.payment_status === 'partially_refunded') &&
    !hasOpenRefund &&
    !refundSent;

  return (
    <section className="container section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/orders">My orders</Link> <span aria-hidden="true">/</span> <span>{order.reference}</span>
      </nav>

      <header className="page-head">
        <div>
          <p className="eyebrow">Order</p>
          <h1><code>{order.reference}</code></h1>
        </div>
      </header>

      {message ? <Notice tone={message.includes('cancelled') ? 'success' : 'error'}>{message}</Notice> : null}

      <div className="card detail-grid">
        <div>
          <p className="muted small">Total</p>
          <p className="price price--lg">{formatZAR(order.total_cents)}</p>
        </div>
        <div>
          <p className="muted small">Payment</p>
          <PaymentBadge status={order.payment_status} />
        </div>
        <div>
          <p className="muted small">Progress</p>
          <FulfilmentBadge status={order.fulfilment_status} />
        </div>
      </div>

      {refunds && refunds.length > 0 ? (
        <div className="card" style={{ marginTop: '16px' }}>
          <h2 className="card__title">Refunds</h2>
          {refunds.map((r) => (
            <div key={r.id} className="receipt" style={{ marginBottom: '12px' }}>
              <p>
                <strong>Refund receipt</strong>
              </p>
              <p>Refund amount: {formatZAR(r.gross_cents)}</p>
              <p>
                Bank charge ({r.bank_charge_pct}%): −{formatZAR(r.bank_charge_cents)}
              </p>
              <p>Amount returned: {formatZAR(r.net_cents)}</p>
              <p>Status: {r.status.replace(/_/g, ' ')}</p>
              {r.reason ? <p>Reason: {r.reason}</p> : null}
              {r.decision_note ? <p>Note: {r.decision_note}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {canRequestRefund ? (
        <div className="card" style={{ marginTop: '16px' }}>
          <h2 className="card__title">Request a refund</h2>
          {refundSent ? (
            <Notice tone="success">
              Your refund request has been sent. We will review it and email you with a decision.
            </Notice>
          ) : (
            <>
              <p className="muted small">
                Tell us what went wrong. A bank charge of 8% is deducted from the refund, and
                our team reviews every request before it is processed.
              </p>
              {refundError ? <Notice tone="error">{refundError}</Notice> : null}
              <div className="form-stack">
                <Field id="refund-amount" label="Amount (R)" hint="Leave empty to request the full amount.">
                  <TextInput
                    id="refund-amount"
                    inputMode="decimal"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                  />
                </Field>
                <Field id="refund-reason" label="Reason" required>
                  <TextArea
                    id="refund-reason"
                    rows={4}
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Why are you requesting a refund?"
                  />
                </Field>
                <div className="cta-row">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onRequestRefund}
                    disabled={busy}
                  >
                    {busy ? 'Sending…' : 'Request refund'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}

      {HAS_REAL_CONTACT_EMAIL ? (
        <p className="muted small">
          Questions about this order? Email us at <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> and quote the reference.
        </p>
      ) : (
        <p className="muted small">
          Questions about this order? Please quote reference <strong>{order.reference}</strong> when you contact us.
        </p>
      )}

      {canCancel ? (
        <div className="cta-row">
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={busy}>
            {busy ? 'Cancelling…' : 'Cancel order'}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default function OrderPage() {
  return (
    <RequireAuth>
      <OrderView />
    </RequireAuth>
  );
}
