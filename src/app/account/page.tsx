'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AdminNav } from '@/components/AdminNav';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/context/AuthContext';
import { describeError } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { authService } from '@/lib/services';
import type { Session } from '@/lib/types';

function PowerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2v10" />
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    </svg>
  );
}

function AccountView() {
  const { user, logout, refreshUser } = useAuth();
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      setSessions(await authService.sessions());
      setError(null);
    } catch (err) {
      setError(describeError(err));
    }
  }, []);

  useEffect(() => {
    void refreshUser();
    void loadSessions();
  }, [refreshUser, loadSessions]);

  const revoke = async (id: string) => {
    setBusyId(id);
    setNotice(null);
    try {
      await authService.revokeSession(id);
      setNotice('Session signed out successfully.');
      await loadSessions();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusyId(null);
    }
  };

  const accountSection = (
    <section className="container section account-section">
      <header className="page-head account-head">
        <div>
          <p className="eyebrow"><span className="rule" aria-hidden="true" />Customer Profile</p>
          <h1 className="account-title">My Account</h1>
          <p className="muted">Manage your profile details, past orders, and active sign-in sessions.</p>
        </div>
        <div className="account-quick-links">
          <Link href="/orders" className="btn btn-primary btn-sm">View My Orders →</Link>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => void logout()}>
            <PowerIcon />
            Sign Out
          </button>
        </div>
      </header>

      {notice && <Notice tone="success">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <div className="account-grid">
        <div className="account-card card">
          <h2 className="account-card__title">Personal Details</h2>
          <div className="account-detail-list">
            <div className="account-detail-row">
              <span className="account-detail-label">Full Name</span>
              <strong className="account-detail-val">{user?.full_name ?? '—'}</strong>
            </div>
            <div className="account-detail-row">
              <span className="account-detail-label">Email Address</span>
              <span className="account-detail-val">{user?.email ?? '—'}</span>
            </div>
            <div className="account-detail-row">
              <span className="account-detail-label">Account Role</span>
              <span className="account-detail-val">{user?.role === 'admin' ? 'Bakery Admin' : 'Customer'}</span>
            </div>
            <div className="account-detail-row">
              <span className="account-detail-label">Status</span>
              <span className="badge-pill in-stock">Active</span>
            </div>
          </div>
        </div>

        <div className="account-card card">
          <div className="account-card__head-row">
            <div>
              <h2 className="account-card__title">Security &amp; Active Devices</h2>
              <p className="muted small">Sessions currently signed in to your account.</p>
            </div>
          </div>

          {!sessions ? (
            <div className="page-loading" role="status">Loading active sessions…</div>
          ) : sessions.length === 0 ? (
            <p className="muted small">No other active sessions detected.</p>
          ) : (
            <ul className="sessions-list">
              {sessions.map((s) => (
                <li key={s.id} className="session-item">
                  <div className="session-info">
                    <strong className="session-agent">{s.user_agent || 'Standard Web Browser'}</strong>
                    <div className="session-meta muted small">
                      {s.ip ? <span>IP: {s.ip} · </span> : null}
                      <span>Created: {formatDateTime(s.created_at)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={busyId === s.id}
                    onClick={() => revoke(s.id)}
                  >
                    <PowerIcon />
                    {busyId === s.id ? 'Revoking…' : 'Sign out'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );

  return user?.role === 'admin' ? (
    <div className="admin-layout">
      <AdminNav />
      <div className="admin-content">{accountSection}</div>
    </div>
  ) : accountSection;
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountView />
    </RequireAuth>
  );
}
