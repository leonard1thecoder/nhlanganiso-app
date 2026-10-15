'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/context/AuthContext';
import { describeError } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { authService } from '@/lib/services';
import type { Session } from '@/lib/types';

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
      setNotice('Session signed out.');
      await loadSessions();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusyId(null);
    }
  };

  const logoutEverywhere = async () => {
    if (!window.confirm('Sign out of every device, including this one?')) return;
    try {
      await authService.logoutAll();
    } catch {
      // Even if the call fails, clear this device.
    }
    await logout();
  };

  return (
    <section className="container section">
      <header className="page-head">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Hello, {user?.full_name.split(' ')[0]}</h1>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => void logout()}>
          Sign out
        </button>
      </header>

      <div className="two-col">
        <div className="card">
          <h2 className="card__title">Profile</h2>
          <dl className="dl">
            <dt>Name</dt>
            <dd>{user?.full_name}</dd>
            <dt>Email</dt>
            <dd>{user?.email}</dd>
            <dt>Role</dt>
            <dd className="capitalize">{user?.role}</dd>
          </dl>
          <p className="muted small">
            Need to change your password? <Link href="/forgot-password">Send yourself a reset link</Link>.
          </p>
          <div className="cta-row">
            <Link href="/orders" className="btn btn-primary">My orders</Link>
            <Link href="/catering" className="btn btn-outline">Catering enquiry</Link>
          </div>
        </div>

        <div className="card">
          <h2 className="card__title">Signed-in devices</h2>
          {notice ? <Notice tone="success">{notice}</Notice> : null}
          {error ? <Notice tone="error">{error}</Notice> : null}
          {sessions === null && !error ? <p className="muted">Loading…</p> : null}
          {sessions && sessions.length === 0 ? <p className="muted">No active sessions.</p> : null}
          {sessions && sessions.length > 0 ? (
            <ul className="session-list">
              {sessions.map((s) => (
                <li key={s.id} className="session-list__item">
                  <div>
                    <strong>{s.user_agent ? s.user_agent.slice(0, 60) : 'Unknown device'}</strong>
                    <p className="muted small">
                      {s.ip ?? 'Unknown IP'} · Signed in {formatDateTime(s.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => void revoke(s.id)}
                    disabled={busyId === s.id}
                  >
                    {busyId === s.id ? 'Signing out…' : 'Sign out'}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <button type="button" className="link-danger" onClick={() => void logoutEverywhere()}>
            Sign out of all devices
          </button>
        </div>
      </div>
    </section>
  );
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountView />
    </RequireAuth>
  );
}
