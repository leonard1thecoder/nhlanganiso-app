'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Notice } from '@/components/Notice';
import { describeError } from '@/lib/api';
import { formatZAR } from '@/lib/format';
import { cateringService } from '@/lib/services';
import type { CateringQuote } from '@/lib/types';

export default function CateringQuotePage() {
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<CateringQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    cateringService
      .getQuote(id)
      .then((q) => !cancelled && setQuote(q))
      .catch((err) => !cancelled && setError(describeError(err)));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onAccept = async () => {
    if (!window.confirm('Accept this quote? We will contact you about the deposit next.')) return;
    setAccepting(true);
    setActionError(null);
    try {
      await cateringService.acceptQuote(id);
      setAccepted(true);
      setQuote((q) => (q ? { ...q, status: 'accepted' } : q));
    } catch (err) {
      setActionError(describeError(err));
    } finally {
      setAccepting(false);
    }
  };

  if (error) {
    return (
      <section className="container section">
        <Notice tone="error" title="We could not find this quote">{error}</Notice>
        <Link href="/catering" className="link-arrow">← Back to catering</Link>
      </section>
    );
  }

  if (!quote) return <div className="page-loading" role="status">Loading quote…</div>;

  const canAccept = quote.status === 'sent' && !accepted;

  return (
    <section className="container section">
      <div className="catering-layout">
        <div>
          <p className="eyebrow">Catering quote</p>
          <h1>Your quote</h1>
          <p className="muted small">Reference <code>{quote.id}</code></p>

          {accepted || quote.status === 'accepted' ? (
            <Notice tone="success" title="Quote accepted">
              Thank you. Our team will be in touch to arrange the deposit and confirm your event details.
            </Notice>
          ) : null}
          {quote.status === 'expired' ? (
            <Notice tone="warning" title="This quote has expired">
              Please contact us and we will prepare an updated quote for you.
            </Notice>
          ) : null}
          {actionError ? <Notice tone="error">{actionError}</Notice> : null}
        </div>

        <div className="card">
          <table className="table table--compact">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col" className="num">Qty</th>
                <th scope="col" className="num">Unit</th>
                <th scope="col" className="num">Line total</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((it, i) => (
                <tr key={i}>
                  <td>{it.description}</td>
                  <td className="num">{it.qty}</td>
                  <td className="num">{formatZAR(it.unit_price_cents)}</td>
                  <td className="num">{formatZAR(it.qty * it.unit_price_cents)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={3}>Total</th>
                <td className="num price">{formatZAR(quote.total_cents)}</td>
              </tr>
            </tfoot>
          </table>

          {canAccept ? (
            <button type="button" className="btn btn-primary btn-block" onClick={onAccept} disabled={accepting}>
              {accepting ? 'Accepting…' : 'Accept quote'}
            </button>
          ) : null}
          <p className="muted small">Accepting does not take payment. Our team will confirm any deposit with you by email.</p>
        </div>
      </div>
    </section>
  );
}
