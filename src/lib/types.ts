/**
 * Wire types for the Nhlanganiso Rust API (services/api).
 *
 * IMPORTANT: the backend is not uniform about its envelope.
 *  - Most endpoints return the object/array directly (no `data` wrapper).
 *  - GET /api/v1/products is the exception and returns `{ data, meta }`.
 * The service layer (services.ts) is the only place that knows this.
 *
 * Money is always integer cents (ZAR). Use formatZAR() to display it.
 */

export type Uuid = string;

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';
export type FulfilmentStatus = 'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type CateringStatus =
  | 'new'
  | 'reviewing'
  | 'quoted'
  | 'replied'
  | 'closed'
  | 'accepted'
  | 'declined';
export type UserRole = 'customer' | 'admin';

export interface ApiErrorBody {
  code: string;
  message: string;
  fields?: unknown;
  request_id?: string;
}

// ---------- Auth ----------

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  /** Access-token lifetime in seconds (server default 900). */
  expires_in: number;
}

export interface Me {
  id: Uuid;
  email: string;
  full_name: string;
  role: UserRole | string;
}

/** Body accepted by POST /api/v1/auth/google/exchange. */
export interface GoogleExchangeBody {
  /** Single-use code handed over by the OAuth callback redirect. */
  code: string;
}

/** Response of POST /api/v1/auth/google/link (start a Google link). */
export interface GoogleLinkStart {
  authorization_url: string;
}

export interface Session {
  id: Uuid;
  created_at: string;
  user_agent: string | null;
  ip: string | null;
}

// ---------- Catalogue ----------

export interface Product {
  id: Uuid;
  name: string;
  slug: string;
  price_cents: number;
  currency: string;
  active: boolean;
  /**
   * NOTE: the current list/detail endpoints do not return these yet
   * (the DB has the columns). They are optional so the UI lights up
   * automatically once the API exposes them.
   */
  description?: string | null;
  image_url?: string | null;
}

export interface ProductDetail {
  id: Uuid;
  name: string;
  slug: string;
  price_cents: number;
  description?: string | null;
  image_url?: string | null;
}

export interface Availability {
  active: boolean;
  /** null = not tracked / unlimited */
  stock_on_hand: number | null;
}

export interface PageMeta {
  page: number;
  per_page: number;
  total: number;
}

export interface Paged<T> {
  data: T[];
  meta: PageMeta;
}

export interface Category {
  id: Uuid;
  name: string;
  slug: string;
}

/** POST /api/v1/products (admin Bearer token required). */
export interface CreateProductBody {
  name: string;
  slug: string;
  price_cents: number;
  description?: string | null;
  image_url?: string | null;
  active?: boolean;
  category_id?: Uuid | null;
}

// ---------- Cart / orders / payments ----------

export interface CartQuoteItem {
  product_id: Uuid;
  qty: number;
  variant_id?: Uuid;
}

export interface CartQuote {
  currency: string;
  subtotal_cents: number;
}

export interface CreateOrderBody {
  items: CartQuoteItem[];
  fulfilment_method: 'pickup' | 'delivery';
  delivery_zone_id?: Uuid;
  delivery_address?: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  notes?: string;
}

export interface CreatedOrder {
  id: Uuid;
  reference: string;
  total_cents: number;
  currency: string;
}

export interface OrderSummary {
  id: Uuid;
  reference: string;
  total_cents: number;
  payment_status: PaymentStatus;
}

/** Returned by GET /orders/:id and /orders/:id/payment-status. Note: no line items yet. */
export interface OrderDetail extends OrderSummary {
  fulfilment_status: FulfilmentStatus;
}

export interface CheckoutFields {
  checkout_url: string;
  /** Signed PayFast form fields — POST these to checkout_url from a browser form. */
  fields: Record<string, string>;
}

// ---------- Catering ----------

export interface CateringRequestBody {
  /** The subject line of the contact form. */
  event_type: string;
  /** Free-text message from the contact form. */
  menu_requirements?: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
}

export interface CateringQuoteItem {
  description: string;
  qty: number;
  unit_price_cents: number;
}

export interface CateringQuote {
  id: Uuid;
  total_cents: number;
  /** sent | accepted | expired */
  status: string;
  items: CateringQuoteItem[];
}

export interface AdminCateringRequest {
  id: Uuid;
  event_type: string;
  status: CateringStatus;
  /** Who sent the enquiry (the contact form captures this). */
  contact_name?: string | null;
  contact_email?: string | null;
  /** The message the customer wrote. */
  message?: string | null;
}

export interface CreateQuoteBody {
  items: CateringQuoteItem[];
  /** YYYY-MM-DD */
  valid_until: string;
  deposit_cents?: number;
}

export interface AdminSummary {
  revenue_cents: number;
  orders: number;
  currency: string;
}

// ---------- Newsletter ----------

/** Receipt returned when a visitor subscribes to the newsletter. */
export interface NewsletterReceipt {
  id: Uuid;
  /** Human-readable receipt code, e.g. NL-20261020-AB12CD. */
  reference: string | null;
  email: string;
  /** pending | verified | unsubscribed */
  status: string;
  created_at: string;
  /** True when the email was already subscribed. */
  already_subscribed?: boolean;
  /** True when a confirmation email was queued. */
  verification_sent?: boolean;
  subscribed_at?: string | null;
}

export interface SubscriberStats {
  total: number;
  verified: number;
  pending: number;
  unsubscribed: number;
}

export interface AdminSubscriber {
  id: Uuid;
  email: string;
  status: string;
  reference: string | null;
  subscribed_at: string | null;
}

export interface AdminNewsletter {
  id: Uuid;
  title: string;
  /** draft | sent | failed */
  status: string;
  audience: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface CreateNewsletterBody {
  title: string;
  body_html: string;
  body_text?: string;
  /** subscribers | all */
  audience?: 'subscribers' | 'all';
  /** Send straight away instead of saving as a draft. */
  send_now?: boolean;
}
