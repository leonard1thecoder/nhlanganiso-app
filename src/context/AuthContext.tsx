'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { SESSION_EXPIRED_EVENT, toApiError } from '@/lib/api';
import { authService } from '@/lib/services';
import { clearTokens, getTokens, setTokens } from '@/lib/tokens';
import type { Me } from '@/lib/types';

type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: Me | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<Me | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authService.me();
      setUser(me);
      setStatus('authenticated');
    } catch (err) {
      // Only a definitive 401 means the session is gone. A network blip keeps the tokens
      // so a page refresh (or the next request) can recover the session.
      if (toApiError(err).status === 401) clearTokens();
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  // On first load, restore the session if tokens exist.
  useEffect(() => {
    if (getTokens()) {
      void refreshUser();
    } else {
      setStatus('anonymous');
    }
  }, [refreshUser]);

  // The API client fires this when a refresh fails mid-session.
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setStatus('anonymous');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const pair = await authService.login({ email, password });
    setTokens(pair);
    const me = await authService.me();
    setUser(me);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    const refresh = getTokens()?.refresh_token;
    try {
      await authService.logout(refresh);
    } catch {
      // Ignore: we clear local state regardless.
    } finally {
      clearTokens();
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isAdmin: user?.role === 'admin',
      login,
      logout,
      refreshUser,
    }),
    [status, user, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
