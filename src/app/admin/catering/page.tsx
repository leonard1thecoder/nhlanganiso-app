'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Field, TextArea, TextInput } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { describeError } from '@/lib/api';
import { adminService } from '@/lib/services';
import type { AdminCateringRequest } from '@/lib/types';

interface ContactRequest extends AdminCateringRequest {
  contact_name?: string | null;
  contact_email?: string | null;
  message?: string | null;
}

function ReplyBuilder({ requestId }: { requestId: string }) {
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setServerError(null);
    setErrors({});
    if (!message.trim()) {
      setErrors({ message: 'Please write a reply before sending.' });
      return;
    }

    setSubmitting(true);
    try {
      await adminService.reply(requestId, message.trim());
      setSent(true);
      setMessage('');
    } catch (err) {
      setServerError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="card reply-builder">
        <h3 className="card__title">Reply sent</h3>
        <Notice tone="success">
          Your reply has been sent to the customer.
        </Notice>
      </div>
    );
  }

  return (
    <div className="card reply-builder">
      <h3 className="card__title">Send reply</h3>
      {serverError ? <Notice tone="error">{serverError}</Notice> : null}

      <form className="form-stack" onSubmit={onSubmit} noValidate>
        <Field id="reply-message" label="Your reply" required error={errors.message}>
          <TextArea
            id="reply-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your reply to the customer…"
            rows={5}
          />
        </Field>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send reply'}
        </button>
      </form>
    </div>
  );
}

function AdminContactRequests() {
  const [requests, setRequests] = useState<ContactRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setRequests(await adminService.cateringRequests());
      setError(null);
    } catch (err) {
      setError(describeError(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const changeStatus = async (id: string, status: 'new' | 'reviewing' | 'replied' | 'closed') => {
    setSavingId(id);
    try {
      await adminService.setCateringStatus(id, status as any);
      setRequests(
        (list) => list?.map((r) => (r.id === id ? { ...r, status: status as any } : r)) ?? null,
      );
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="container section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/admin">Dashboard</Link> <span aria-hidden="true">/</span> <span>Messages</span>
      </nav>
      <header className="page-head">
        <div>
          <p className="eyebrow">Back office</p>
          <h1>Contact requests</h1>
          <p className="muted small">Most recent enquiries from the contact form.</p>
        </div>
      </header>

      {error ? <Notice tone="error">{error}</Notice> : null}
      {requests === null && !error ? <div className="page-loading" role="status">Loading…</div> : null}
      {requests && requests.length === 0 ? (
        <p className="muted">No contact requests yet.</p>
      ) : null}

      {requests && requests.length > 0 ? (
        <div className="stack-lg">
          {requests.map((r) => {
            const open = openId === r.id;
            return (
              <article key={r.id} className="card request-card">
                <div className="request-card__head">
                  <div>
                    <strong>{r.event_type || 'Contact request'}</strong>
                    <p className="muted small">
                      Reference <code>{r.id}</code> · {r.contact_email ? r.contact_email : '—'}
                      {r.contact_name ? ` · ${r.contact_name}` : ''}
                    </p>
                    <span
                      className={`badge badge--${(r as any).status === 'replied' || (r as any).status === 'accepted' ? 'accepted' : (r as any).status === 'declined' || (r as any).status === 'c_declined' ? 'cancelled' : 'pending'}`}
                    >
                    {(r as any).status?.replace('_', ' ') || 'New'}
                  </span>
                </div>
                <div className="request-card__actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setOpenId(open ? null : r.id)}
                      aria-expanded={open}
                      disabled={savingId === r.id}
                    >
                      {open ? 'Close reply' : 'Reply'}
                    </button>
                  </div>
                </div>
                {open && (
                  <ReplyBuilder requestId={r.id} />
                )}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export default function AdminContactRequestsPage() {
  return (
    <RequireAuth adminOnly>
      <AdminContactRequests />
    </RequireAuth>
  );
}
