// Client-side configuration. NEXT_PUBLIC_* values are inlined at build time,
// so each variable must be referenced literally (as below).

const trimSlash = (s: string) => s.replace(/\/+$/, '');

export const API_BASE_URL = trimSlash(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080');

/** Every API route lives under this prefix. */
export const API_PREFIX = '/api/v1';

export const SITE_URL = trimSlash(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000');

export const SITE_NAME = 'Nhlanganiso Catering & Baking';

export const CURRENCY = 'ZAR';

export const CONTACT = {
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hello@example.co.za',
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '+27 00 000 0000',
} as const;

/** Storage keys (versioned so a future shape change can invalidate old data). */
export const STORAGE_KEYS = {
  tokens: 'nhl.auth.tokens.v1',
  cart: 'nhl.cart.v1',
  lastOrder: 'nhl.lastOrder.v1',
} as const;

/** Mirrors the API's per-line limit in cart/orders handlers. */
export const MAX_QTY_PER_LINE = 99;
