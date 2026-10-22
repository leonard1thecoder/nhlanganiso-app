// Client-side configuration. NEXT_PUBLIC_* values are inlined at build time,
// so each variable must be referenced literally (as below).

const trimSlash = (s: string) => s.replace(/\/+$/, '');

// Always same-origin: use the Next.js /api/v1 rewrite proxy, never call the
// API cross-origin from the browser, so CORS can never block us.
// (NEXT_PUBLIC_API_URL is intentionally ignored here; the upstream is chosen
// server-side in next.config.mjs via API_UPSTREAM / NEXT_PUBLIC_API_URL.)
export const API_BASE_URL = '';

/** Every API route lives under this prefix. */
export const API_PREFIX = '/api/v1';

export const SITE_URL = trimSlash(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nhlanganiso-app.vercel.app');

export const SITE_NAME = 'Nhlanganiso Catering & Baking';

export const CURRENCY = 'ZAR';

export const CONTACT = {
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hello@example.co.za',
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '+27 00 000 0000',
} as const;

/**
 * Never render fabricated contact details. These are true only when the
 * operator configured real values; callers must hide contact rows otherwise.
 */
export const HAS_REAL_CONTACT_EMAIL =
  CONTACT.email !== 'hello@example.co.za' && CONTACT.email.includes('@');
export const HAS_REAL_CONTACT_PHONE = CONTACT.phone !== '+27 00 000 0000';

/** Storage keys (versioned so a future shape change can invalidate old data). */
export const STORAGE_KEYS = {
  tokens: 'nhl.auth.tokens.v1',
  cart: 'nhl.cart.v1',
  lastOrder: 'nhl.lastOrder.v1',
} as const;

/** Mirrors the API's per-line limit in cart/orders handlers. */
export const MAX_QTY_PER_LINE = 99;
