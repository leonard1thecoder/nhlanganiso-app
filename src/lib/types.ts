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
export type CateringStatus = 'new' | 'reviewing' | 'quoted' | 'accepted' | 'declined';
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
  event_type: string;
  /** YYYY-MM-DD */
  event_date: string;
  guest_count: number;
  venue?: string;
  budget_cents?: number;
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
