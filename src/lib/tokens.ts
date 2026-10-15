import { STORAGE_KEYS } from './config';
import type { TokenPair } from './types';

/**
 * Token storage.
 *
 * The API returns the refresh token in the JSON body (no httpOnly cookie),
 * so it has to live in JS-accessible storage. Keep the access TTL short
 * (server default 15 min) and never render tokens into the DOM.
 * If you later add a Next.js BFF or cookie-issuing endpoint, move these there.
 */

export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  /** epoch ms when the access token expires (informational; the API is the authority) */
  expires_at: number;
}

const hasWindow = () => typeof window !== 'undefined';

export function getTokens(): StoredTokens | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.tokens);
    return raw ? (JSON.parse(raw) as StoredTokens) : null;
  } catch {
    return null;
  }
}

export function setTokens(pair: TokenPair): void {
  if (!hasWindow()) return;
  const stored: StoredTokens = {
    access_token: pair.access_token,
    refresh_token: pair.refresh_token,
    expires_at: Date.now() + pair.expires_in * 1000,
  };
  window.localStorage.setItem(STORAGE_KEYS.tokens, JSON.stringify(stored));
}

export function clearTokens(): void {
  if (!hasWindow()) return;
  window.localStorage.removeItem(STORAGE_KEYS.tokens);
}
