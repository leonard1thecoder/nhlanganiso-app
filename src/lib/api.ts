import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_PREFIX } from './config';
import { clearTokens, getTokens, setTokens } from './tokens';
import type { ApiErrorBody, TokenPair } from './types';

/** Name of the window event fired when the session can no longer be refreshed. */
export const SESSION_EXPIRED_EVENT = 'nhl:session-expired';

/** Normalised error every UI component can rely on. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: unknown;
  readonly requestId?: string;

  constructor(message: string, status: number, code: string, fields?: unknown, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.requestId = requestId;
  }
}

/** Convert anything thrown by axios (or elsewhere) into an ApiError. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return new ApiError(
        'We could not reach the server. Check your connection and try again.',
        0,
        'NETWORK_ERROR',
      );
    }
    const body = err.response.data as Partial<ApiErrorBody> | undefined;
    return new ApiError(
      body?.message ?? 'Something went wrong. Please try again.',
      err.response.status,
      body?.code ?? 'HTTP_ERROR',
      body?.fields,
      body?.request_id,
    );
  }
  return new ApiError(err instanceof Error ? err.message : 'Unexpected error', 0, 'UNKNOWN');
}

/** Human-friendly message for a few well-known codes; falls back to the server message. */
export function describeError(err: unknown): string {
  const e = toApiError(err);
  switch (e.code) {
    case 'RATE_LIMITED':
      return 'Too many attempts. Please wait a minute and try again.';
    case 'UNAUTHORIZED':
      return 'Please sign in to continue.';
    case 'FORBIDDEN':
      return 'You do not have permission to do that.';
    case 'NOT_FOUND':
      return 'We could not find what you were looking for.';
    case 'VALIDATION_ERROR':
      return 'Please check the highlighted details and try again.';
    default:
      return e.message;
  }
}

const baseURL = `${API_BASE_URL}${API_PREFIX}`;

/** The single axios instance used by the whole app. */
export const api = axios.create({
  baseURL,
  timeout: 20_000,
  headers: { Accept: 'application/json' },
});

// Attach the access token to every request when we have one.
// Guest flows (browse, guest checkout) simply go out without it.
api.interceptors.request.use((config) => {
  const tokens = getTokens();
  if (tokens) config.headers.set('Authorization', `Bearer ${tokens.access_token}`);
  return config;
});

// Refresh once on 401, then retry the original request.
// Concurrent 401s share a single refresh call (single-flight).
let refreshing: Promise<TokenPair> | null = null;

async function refreshTokens(): Promise<TokenPair> {
  const current = getTokens();
  if (!current) throw new Error('No refresh token');
  // Plain axios (not `api`) so the refresh call does not re-enter these interceptors.
  const res = await axios.post<TokenPair>(
    `${baseURL}/auth/refresh`,
    { refresh_token: current.refresh_token },
    { timeout: 15_000 },
  );
  setTokens(res.data);
  return res.data;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const url = original?.url ?? '';
    const isAuthCall = /\/auth\/(login|refresh)$/.test(url);

    const tokens = getTokens();

    if (error.response?.status === 401 && original && !original._retried && !isAuthCall && tokens) {
      original._retried = true;
      try {
        // Another request already rotated the tokens while this one was in flight:
        // just retry with the current access token instead of refreshing again.
        const sentWith = String(original.headers.get('Authorization') ?? '');
        const alreadyRotated = sentWith !== '' && sentWith !== `Bearer ${tokens.access_token}`;
        if (!alreadyRotated) {
          refreshing ??= refreshTokens().finally(() => {
            refreshing = null;
          });
          await refreshing;
        }
        return api.request(original); // request interceptor adds the current token
      } catch {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
        }
      }
    }
    return Promise.reject(error);
  },
);
