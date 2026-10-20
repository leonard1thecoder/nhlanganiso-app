'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Field, Select, TextArea, TextInput } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { describeError } from '@/lib/api';
import { newsletterAdminService, subscriberAdminService } from '@/lib/services';
import type { AdminNewsletter, AdminSubscriber, SubscriberStats } from '@/lib/types';

function Newsletters() {
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [subscribers, setSubscribers] = useState<AdminSubscriber[] | null>(null);
  const [sent, setSent] = useState<AdminNewsletter[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'subscribers' | 'all'>('subscribers');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ announced_to: number } | null>(null);

  const load = async () => {
    try {
      const [s, sub, n] = await Promise.all([
        subscriberAdminService.stats(),
        subscriberAdminService.list(),
        newsletterAdminService.list(),
      ]);
      setStats(s);
      setSubscribers(sub);
      setSent(n);
      setError(null);
    } catch (err) {
      setError(describeError(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);
    if (!title.trim() || !body.trim()) {
      setError('Add a title and a message before sending.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await newsletterAdminService.create({
        title: title.trim(),
        body_html: body.trim(),
        audience,
        send_now: true,
      });
      setCreated({ announced_to: res.announced_to ?? 0 });
      setTitle('');
      setBody('');
      await load();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stack-lg">
      {error ? <Notice tone="error">{error}</Notice> : null}

      <section className="card">
        <h2 className="card__title">Newsletter</h2>
        <p className="muted small">
          Send a promotion or announcement to everyone on the list. Recipients only get mail if
          they confirmed their subscription.
        </p>

        {created ? (
          <Notice tone="success">
            Newsletter sent to {created.announced_to} subscriber{created.announced_to === 1 ? '' : 's'}.
          </Notice>
        ) : null}

        <form className="form-stack" onSubmit={onSubmit} noValidate>
          <Field id="nl-title" label="Title" required>
            <TextInput id="nl-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field id="nl-body" label="Message" required hint="Plain text or simple HTML.">
            <TextArea id="nl-body" value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
          </Field>
          <Field id="nl-audience" label="Send to">
            <Select
              id="nl-audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value as 'subscribers' | 'all')}
            >
              <option value="subscribers">Confirmed subscribers</option>
              <option value="all">All subscribers and past customers</option>
            </Select>
          </Field>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send newsletter'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="card__title">Subscribers</h2>
        {stats ? (
          <p className="muted small">
            {stats.total} total · {stats.verified} confirmed · {stats.pending} pending ·{' '}
            {stats.unsubscribed} unsubscribed
          </p>
        ) : null}

        {subscribers && subscribers.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Email</th>
                  <th scope="col">Reference</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.id}>
                    <td>{s.email}</td>
                    <td>
                      <code>{s.reference ?? '—'}</code>
                    </td>
                    <td>
                      <span className={`badge badge--${s.status}`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : subscribers ? (
          <p className="muted small">No subscribers yet.</p>
        ) : null}
      </section>

      {sent && sent.length > 0 ? (
        <section className="card">
          <h2 className="card__title">Previous newsletters</h2>
          <ul>
            {sent.map((n) => (
              <li key={n.id}>
                <strong>{n.title}</strong>{' '}
                <span className="muted small">
                  · {n.status}
                  {n.sent_at ? ` · sent ${new Date(n.sent_at).toLocaleString()}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export default function AdminNewsletterPage() {
  return (
    <RequireAuth adminOnly>
      <section className="container section">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/admin">Dashboard</Link> <span aria-hidden="true">/</span>{' '}
          <span>Newsletter</span>
        </nav>
        <header className="page-head">
          <div>
            <p className="eyebrow">Back office</p>
            <h1>Newsletter</h1>
            <p className="muted small">
              Reach everyone on the list and see who subscribed.
            </p>
          </div>
        </header>
        <Newsletters />
      </section>
    </RequireAuth>
  );
}
