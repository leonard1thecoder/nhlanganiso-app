'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { describeError } from '@/lib/api';
import { auditService } from '@/lib/services';
import type { AuditLogItem, EmailOutboxItem } from '@/lib/types';

function SystemLogsView() {
  const [logs, setLogs] = useState<AuditLogItem[] | null>(null);
  const [outbox, setOutbox] = useState<EmailOutboxItem[] | null>(null);
  const [activeTab, setActiveTab] = useState<'audit' | 'outbox'>('audit');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    auditService
      .logs()
      .then((res) => !cancelled && setLogs(res))
      .catch((err) => !cancelled && setError(describeError(err)));

    auditService
      .outbox()
      .then((res) => !cancelled && setOutbox(res))
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="container section admin-logs-section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/admin">Dashboard</Link>
        <span className="crumb-sep" aria-hidden="true">/</span>
        <span className="current" aria-current="page">System Logs</span>
      </nav>

      <header className="page-head admin-head">
        <div>
          <p className="eyebrow"><span className="rule" aria-hidden="true" />Security &amp; Diagnostics</p>
          <h1 className="admin-title">Audit Logs &amp; Email Outbox</h1>
          <p className="muted">Monitor privileged actions and asynchronous notification queues.</p>
        </div>
      </header>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="tab-bar">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'audit' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          Audit Logs ({logs ? logs.length : '…'})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'outbox' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('outbox')}
        >
          Email Outbox ({outbox ? outbox.length : '…'})
        </button>
      </div>

      <div className="admin-card card mt-4">
        {activeTab === 'audit' ? (
          <div>
            <h2>Audit Trail</h2>
            {!logs ? (
              <div className="page-loading" role="status">Loading audit events…</div>
            ) : logs.length === 0 ? (
              <p className="muted small mt-2">No audit log records found.</p>
            ) : (
              <div className="table-wrap mt-3">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Event ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l.id}>
                        <td><code>{l.action}</code></td>
                        <td>{l.entity}</td>
                        <td><small className="muted">{l.id}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2>Email Notification Outbox</h2>
            {!outbox ? (
              <div className="page-loading" role="status">Loading email outbox…</div>
            ) : outbox.length === 0 ? (
              <p className="muted small mt-2">No outgoing emails currently queued.</p>
            ) : (
              <div className="table-wrap mt-3">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Recipient</th>
                      <th>Status</th>
                      <th>Attempts</th>
                      <th>Message ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outbox.map((o) => (
                      <tr key={o.id}>
                        <td><strong>{o.recipient}</strong></td>
                        <td>
                          <span className={`badge-pill ${o.status === 'sent' ? 'in-stock' : 'badge-free'}`}>
                            {o.status}
                          </span>
                        </td>
                        <td>{o.attempts}</td>
                        <td><small className="muted">{o.id}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default function AdminLogsPage() {
  return (
    <RequireAuth adminOnly>
      <SystemLogsView />
    </RequireAuth>
  );
}
