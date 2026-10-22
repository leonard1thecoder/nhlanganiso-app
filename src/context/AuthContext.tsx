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
  login: (email: string, password: string) => Promise<Me>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** Navigates the browser to Google to start the OAuth flow. */
  loginWithGoogle: (next?: string) => void;
  /** Completes the OAuth round trip with the single-use code from the callback. */
  completeGoogleSignIn: (code: string) => Promise<Me>;
  /**
   * Links the current (already signed-in) account to a Google identity.
   * Used when Google reports that the email already belongs to an account.
   */
  linkGoogle: () => Promise<void>;
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
    return me;
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

  // Google sign-in: send the browser to the API, which handles the redirect to
  // Google and comes back to /auth/google/callback?code=...
  const loginWithGoogle = useCallback((next?: string) => {
    window.location.assign(authService.googleSignInUrl(next));
  }, []);

  // Finish the OAuth round trip: exchange the one-time code for a token pair,
  // store it, and load the signed-in user.
  const completeGoogleSignIn = useCallback(async (code: string) => {
    const pair = await authService.googleExchange(code);
    setTokens(pair);
    const me = await authService.me();
    setUser(me);
    setStatus('authenticated');
    return me;
  }, []);

  // Attach a Google identity to the account that is signed in right now.
  const linkGoogle = useCallback(async () => {
    const { authorization_url } = await authService.googleLink();
    window.location.assign(authorization_url);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isAdmin: user?.role === 'admin',
      login,
      logout,
      refreshUser,
      loginWithGoogle,
      completeGoogleSignIn,
      linkGoogle,
    }),
    [
      status,
      user,
      login,
      logout,
      refreshUser,
      loginWithGoogle,
      completeGoogleSignIn,
      linkGoogle,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
