'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { CateringBadge, CATERING_OPTIONS } from '@/components/StatusBadge';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { describeError } from '@/lib/api';
import { formatZAR, randsToCents, todayISO } from '@/lib/format';
import { adminService } from '@/lib/services';
import type { AdminCateringRequest, CateringStatus } from '@/lib/types';

interface LineDraft {
  description: string;
  qty: string;
  unit: string; // rand text
}

const blankLine = (): LineDraft => ({ description: '', qty: '1', unit: '' });

function QuoteBuilder({ requestId, onCreated }: { requestId: string; onCreated: () => void }) {
  const [lines, setLines] = useState<LineDraft[]>([blankLine()]);
  const [validUntil, setValidUntil] = useState('');
  const [deposit, setDeposit] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Default: 14 days from today (client-side to avoid SSR date drift).
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setValidUntil(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    );
  }, []);

  const update = (i: number, patch: Partial<LineDraft>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const parsed = lines.map((l) => ({
    description: l.description.trim(),
    qty: Number(l.qty),
    unit_price_cents: randsToCents(l.unit),
  }));
  const total = parsed.reduce(
    (sum, l) => sum + (Number.isInteger(l.qty) && l.unit_price_cents !== undefined ? l.qty * l.unit_price_cents : 0),
    0,
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (parsed.some((l) => !l.description || !Number.isInteger(l.qty) || l.qty < 1 || l.unit_price_cents === undefined)) {
      setError('Each line needs a description, a whole-number quantity and a price.');
      return;
    }
    if (!validUntil) {
      setError('Choose when the quote expires.');
      return;
    }
    setBusy(true);
    try {
      const res = await adminService.createQuote(requestId, {
        items: parsed.map((l) => ({ description: l.description, qty: l.qty, unit_price_cents: l.unit_price_cents as number })),
        valid_until: validUntil,
        deposit_cents: randsToCents(deposit),
      });
      setOk(`Quote created (${formatZAR(res.total_cents)}) and emailed to the customer.`);
      setLines([blankLine()]);
      onCreated();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="quote-builder" onSubmit={onSubmit} noValidate>
      <h3 className="card__title">Build quote</h3>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {ok ? <Notice tone="success">{ok}</Notice> : null}

      {lines.map((l, i) => (
        <div className="quote-line" key={i}>
          <label className="sr-only" htmlFor={`d-${requestId}-${i}`}>Description</label>
          <input id={`d-${requestId}-${i}`} className="input" placeholder="Description" value={l.description} onChange={(e) => update(i, { description: e.target.value })} />
          <label className="sr-only" htmlFor={`q-${requestId}-${i}`}>Quantity</label>
          <input id={`q-${requestId}-${i}`} className="input input--sm" inputMode="numeric" placeholder="Qty" value={l.qty} onChange={(e) => update(i, { qty: e.target.value })} />
          <label className="sr-only" htmlFor={`u-${requestId}-${i}`}>Unit price (R)</label>
          <input id={`u-${requestId}-${i}`} className="input input--sm" inputMode="decimal" placeholder="Unit R" value={l.unit} onChange={(e) => update(i, { unit: e.target.value })} />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))} disabled={lines.length === 1}>
            Remove
          </button>
        </div>
      ))}

      <button type="button" className="btn btn-outline btn-sm" onClick={() => setLines((ls) => [...ls, blankLine()])}>
        + Add line
      </button>

      <div className="form-row">
        <div className="field">
          <label className="field__label" htmlFor={`v-${requestId}`}>Valid until</label>
          <input id={`v-${requestId}`} type="date" className="input" min={todayISO()} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </div>
        <div className="field">
          <label className="field__label" htmlFor={`dep-${requestId}`}>Deposit (R, optional)</label>
          <input id={`dep-${requestId}`} className="input" inputMode="decimal" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
        </div>
      </div>

      <p className="quote-total">Total <strong>{formatZAR(total)}</strong></p>
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? 'Creating…' : 'Create and send quote'}
      </button>
    </form>
  );
}

function AdminCatering() {
  const [items, setItems] = useState<AdminCateringRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setItems(await adminService.cateringRequests());
      setError(null);
    } catch (err) {
      setError(describeError(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const changeStatus = async (id: string, status: CateringStatus) => {
    setSavingId(id);
    try {
      await adminService.setCateringStatus(id, status);
      setItems((list) => list?.map((r) => (r.id === id ? { ...r, status } : r)) ?? null);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="container section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/admin">Dashboard</Link> <span aria-hidden="true">/</span> <span>Catering</span>
      </nav>
      <header className="page-head">
        <div>
          <p className="eyebrow">Back office</p>
          <h1>Catering requests</h1>
          <p className="muted small">Most recent 100 enquiries.</p>
        </div>
      </header>

      {error ? <Notice tone="error">{error}</Notice> : null}
      {items === null && !error ? <div className="page-loading" role="status">Loading…</div> : null}
      {items && items.length === 0 ? <p className="muted">No enquiries yet.</p> : null}

      {items && items.length > 0 ? (
        <div className="stack-lg">
          {items.map((r) => (
            <article key={r.id} className="card request-card">
              <div className="request-card__head">
                <div>
                  <strong>{r.event_type}</strong>
                  <p className="muted small"><code>{r.id}</code></p>
                </div>
                <CateringBadge status={r.status} />
                <div className="request-card__actions">
                  <label className="sr-only" htmlFor={`cs-${r.id}`}>Status for {r.event_type}</label>
                  <select
                    id={`cs-${r.id}`}
                    className="input input--sm"
                    value={r.status}
                    disabled={savingId === r.id}
                    onChange={(e) => changeStatus(r.id, e.target.value as CateringStatus)}
                  >
                    {CATERING_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpenId(openId === r.id ? null : r.id)} aria-expanded={openId === r.id}>
                    {openId === r.id ? 'Close quote builder' : 'Create quote'}
                  </button>
                </div>
              </div>
              {openId === r.id ? <QuoteBuilder requestId={r.id} onCreated={() => void load()} /> : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default function AdminCateringPage() {
  return (
    <RequireAuth adminOnly>
      <AdminCatering />
    </RequireAuth>
  );
}
