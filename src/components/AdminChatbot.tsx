'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Notice } from '@/components/Notice';
import { describeError } from '@/lib/api';
import { adminService } from '@/lib/services';
import type { AdminCateringRequest } from '@/lib/types';

/** Floating chatbot on admin screens that opens the contact-form request inbox. */
export function AdminChatbot() {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<AdminCateringRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await adminService.cateringRequests();
      setRequests(list);
      setError(null);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void load();
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="chatbot__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close messages' : 'Contact requests'}
        aria-expanded={open}
        title={open ? 'Close messages' : 'Contact requests'}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <polyline points="16 17 16 12 20 12" />
        </svg>
        <span className="chatbot__badge" aria-hidden="true">
          {requests ? requests.length : '•'}
        </span>
      </button>

      {open ? (
        <div className="chatbot__drawer" role="dialog" aria-modal="true" aria-label="Contact requests">
          <div className="chatbot__drawer__head">
            <h3>Contact requests</h3>
            <button
              type="button"
              className="chatbot__close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {error ? <Notice tone="error">{error}</Notice> : null}

          {loading ? (
            <div className="page-loading" role="status">Loading requests…</div>
          ) : requests === null ? (
            <p className="muted small">No requests loaded yet.</p>
          ) : requests.length === 0 ? (
            <p className="muted small">No contact requests yet.</p>
          ) : (
            <ul className="chatbot__list">
              {requests.map((r) => (
                <li key={r.id} className="chatbot__item">
                  <div className="chatbot__item__head">
                    <strong>{r.event_type || 'Contact request'}</strong>
                    <span className="chatbot__ref">#{String(r.id).slice(0, 8)}</span>
                  </div>
                  <p className="chatbot__item__body">
                    {(r as unknown as { contact_name?: string })?.contact_name ||
                    (r as unknown as { name?: string })?.name ||
                    'Customer'}
                  </p>
                  <p className="chatbot__item__body chatbot__item__body--muted">
                    {(r as unknown as { contact_email?: string })?.contact_email ||
                    (r as unknown as { email?: string })?.email ||
                    '—'}
                  </p>
                  <p className="chatbot__item__message">
                    {(r as unknown as { menu_requirements?: string })?.menu_requirements ||
                    (r as unknown as { message?: string })?.message ||
                    'No message details.'}
                  </p>
                  <Link href={`/admin/catering`} className="chatbot__view">
                    Open in back office →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </>
  );
}
