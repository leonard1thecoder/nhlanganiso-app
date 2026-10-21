import { api } from './api';
import { API_BASE_URL, API_PREFIX } from './config';
import type {
  AdminCateringRequest,
  AdminCoupon,
  AdminNewsletter,
  AdminSubscriber,
  AdminSummary,
  AuditLogItem,
  Availability,
  CartQuote,
  CartQuoteItem,
  CateringQuote,
  CateringRequestBody,
  CateringStatus,
  Category,
  CheckoutFields,
  CouponValidation,
  CreateCouponBody,
  CreateNewsletterBody,
  CreateOrderBody,
  CreateProductBody,
  CreateQuoteBody,
  CreatedOrder,
  EmailOutboxItem,
  FavoriteProduct,
  FulfilmentStatus,
  InventoryMovement,
  Me,
  NewsletterReceipt,
  OrderDetail,
  OrderSummary,
  Paged,
  Product,
  ProductDetail,
  PublicAnnouncement,
  Session,
  SubscriberStats,
  TokenPair,
} from './types';

/**
 * Typed endpoint wrappers. Components should import from here, never call `api` directly.
 * Envelope handling lives here so the rest of the app sees clean types.
 */

// ---------- Auth ----------

export const authService = {
  register: (body: { full_name: string; email: string; password: string }) =>
    api.post<{ id: string; email: string }>('/auth/register', body).then((r) => r.data),

  login: (body: { email: string; password: string }) =>
    api.post<TokenPair>('/auth/login', body).then((r) => r.data),

  /** Revokes the given refresh token when provided. Requires a valid access token. */
  logout: (refreshToken?: string) =>
    (refreshToken
      ? api.post<{ ok: boolean }>('/auth/logout', { refresh_token: refreshToken })
      : api.post<{ ok: boolean }>('/auth/logout')
    ).then((r) => r.data),

  logoutAll: () => api.post<{ ok: boolean }>('/auth/logout-all').then((r) => r.data),

  me: () => api.get<Me>('/auth/me').then((r) => r.data),

  sessions: () => api.get<Session[]>('/auth/sessions').then((r) => r.data),

  revokeSession: (id: string) => api.delete<{ ok: boolean }>(`/auth/sessions/${id}`).then((r) => r.data),

  verifyEmail: (token: string) =>
    api.get<{ ok: boolean }>('/auth/verify-email', { params: { token } }).then((r) => r.data),

  requestPasswordReset: (email: string) =>
    api.post<{ ok: boolean }>('/auth/password-reset/request', { email }).then((r) => r.data),

  confirmPasswordReset: (token: string, newPassword: string) =>
    api
      .post<{ ok: boolean }>('/auth/password-reset/confirm', { token, new_password: newPassword })
      .then((r) => r.data),

  /**
   * Starts the Google OAuth 2.0 / OIDC flow.
   *
   * The API issues a state + nonce + PKCE challenge, then redirects the browser
   * to Google. We navigate the whole window (not fetch) because Google shows
   * its own consent UI. The API later redirects back to /auth/google/callback
   * with a single-use `code`, which we exchange for a token pair.
   *
   * The URL is same-origin, so Next rewrites it to the API - no CORS involved.
   */
  googleSignInUrl: (next?: string) => {
    const base = `${API_BASE_URL}${API_PREFIX}/auth/google`;
    // `next` is only used by the frontend after the round trip; it is passed
    // through the redirect so we can return the user where they started.
    return next ? `${base}?next=${encodeURIComponent(next)}` : base;
  },

  /** Exchanges the single-use OAuth code for the normal token pair. */
  googleExchange: (code: string) =>
    api.post<TokenPair>('/auth/google/exchange', { code }).then((r) => r.data),

  /**
   * Starts linking a Google identity to the account that is currently signed
   * in. Requires a valid access token, so it must be called after a password
   * sign-in. Returns the Google URL to navigate to.
   */
  googleLink: () =>
    api.post<{ authorization_url: string }>('/auth/google/link').then((r) => r.data),
};

// ---------- Catalogue ----------

export const productService = {
  /** GET /products is the one endpoint that returns { data, meta }. */
  list: (params: { search?: string; page?: number; per_page?: number } = {}) =>
    api.get<Paged<Product>>('/products', { params }).then((r) => r.data),

  bySlug: (slug: string) =>
    api.get<ProductDetail>(`/products/${encodeURIComponent(slug)}`).then((r) => r.data),

  availability: (id: string) =>
    api.get<Availability>(`/products/${id}/availability`).then((r) => r.data),
};

// ---------- Categories ----------

export const categoryService = {
  /** GET /categories returns the array directly (not paged). */
  list: async (): Promise<Category[]> => {
    const res = await api.get<Category[] | { data: Category[] }>('/categories');
    return Array.isArray(res.data) ? res.data : res.data.data;
  },
};

// ---------- Cart (server-side price check) ----------

export const cartService = {
  /** Server recalculates every price. The browser total is for display only. */
  quote: (items: CartQuoteItem[]) =>
    api.post<CartQuote>('/cart/quote', { items }).then((r) => r.data),
};

// ---------- Orders & payments ----------

export const orderService = {
  create: (body: CreateOrderBody) =>
    api.post<CreatedOrder>('/orders', body).then((r) => r.data),

  mine: () => api.get<OrderSummary[]>('/orders/mine').then((r) => r.data),

  get: (id: string) => api.get<OrderDetail>(`/orders/${id}`).then((r) => r.data),

  paymentStatus: (id: string) =>
    api.get<OrderDetail>(`/orders/${id}/payment-status`).then((r) => r.data),

  cancel: (id: string) => api.post<{ ok: boolean }>(`/orders/${id}/cancel`).then((r) => r.data),
};

export const paymentService = {
  /** Returns the PayFast URL and signed fields. The caller must POST them from a form. */
  checkout: (body: {
    order_id: string;
    name_first?: string;
    name_last?: string;
    email_address?: string;
  }) => api.post<CheckoutFields>('/payments/checkout', body).then((r) => r.data),
};

// ---------- Catering ----------

export const cateringService = {
  createRequest: (body: CateringRequestBody) =>
    api.post<{ id: string }>('/catering/requests', body).then((r) => r.data),

  getQuote: (id: string) => api.get<CateringQuote>(`/catering/quotes/${id}`).then((r) => r.data),

  /** Acceptance does NOT take payment. A deposit, if any, is paid through a normal order. */
  acceptQuote: (id: string) =>
    api.post<{ ok: boolean }>(`/catering/quotes/${id}/accept`).then((r) => r.data),
};

// ---------- Newsletter ----------

export const newsletterService = {
  /**
   * Subscribe an email address to the newsletter. Returns the receipt the
   * storefront shows (reference, status). A confirmation email is sent; the
   * subscription only becomes active once that link is followed.
   */
  subscribe: (email: string) =>
    api.post<NewsletterReceipt>('/subscribers', { email }).then((r) => r.data),

  /** Confirm a subscription with the token from the confirmation email. */
  verify: (token: string) =>
    api.get<NewsletterReceipt>('/subscribers/verify', { params: { token } }).then((r) => r.data),
};

export const subscriberAdminService = {
  list: () => api.get<AdminSubscriber[]>('/admin/subscribers').then((r) => r.data),

  stats: () => api.get<SubscriberStats>('/admin/subscribers/stats').then((r) => r.data),

  unsubscribe: (id: string) =>
    api.delete<{ ok: boolean }>(`/admin/subscribers/${id}`).then((r) => r.data),
};

export const newsletterAdminService = {
  /** Newsletters that were sent (or drafted). */
  list: () => api.get<AdminNewsletter[]>('/admin/announcements').then((r) => r.data),

  /** Create a newsletter; `send_now` sends it to the audience immediately. */
  create: (body: CreateNewsletterBody) =>
    api.post<{ id: string; title: string; status: string; announced_to: number }>(
      '/admin/announcements',
      body,
    ).then((r) => r.data),
};

// ---------- Admin ----------

export const adminService = {
  createCategory: (body: { name: string; slug: string }) =>
    api.post<{ id: string }>('/categories', body).then((r) => r.data),

  createProduct: (body: CreateProductBody) =>
    api.post<Product>('/products', body).then((r) => r.data),

  orders: () => api.get<OrderDetail[]>('/admin/orders').then((r) => r.data),

  setFulfilment: (id: string, status: FulfilmentStatus) =>
    api.patch<{ ok: boolean }>(`/admin/orders/${id}/fulfilment`, { status }).then((r) => r.data),

  summary: () => api.get<AdminSummary>('/admin/reports/summary').then((r) => r.data),

  cateringRequests: () =>
    api.get<AdminCateringRequest[]>('/admin/catering/requests').then((r) => r.data),

  setCateringStatus: (id: string, status: CateringStatus) =>
    api
      .patch<{ ok: boolean }>(`/admin/catering/requests/${id}`, { status })
      .then((r) => r.data),

  /** Send a reply message to the customer who made the contact request. */
  reply: (requestId: string, message: string) =>
    api
      .post<{ ok: boolean }>(`/admin/catering/requests/${requestId}/reply`, { message })
      .then((r) => r.data),

  createQuote: (requestId: string, body: CreateQuoteBody) =>
    api
      .post<{ id: string; total_cents: number }>(`/admin/catering/requests/${requestId}/quotes`, body)
      .then((r) => r.data),
};

// ---------- Favorites Service ----------
export const favoriteService = {
  list: () => api.get<FavoriteProduct[]>('/products/favorites').then((r) => r.data),
  add: (productId: string) =>
    api.post<{ product_id: string; favorited: boolean }>(`/products/${productId}/favorite`).then((r) => r.data),
  remove: (productId: string) =>
    api.delete<{ product_id: string; favorited: boolean }>(`/products/${productId}/favorite`).then((r) => r.data),
};

// ---------- Coupon Service ----------
export const couponService = {
  validate: (code: string, email: string, productId?: string) =>
    api
      .get<CouponValidation>(`/coupons/${encodeURIComponent(code)}/validate`, {
        params: { email, product_id: productId },
      })
      .then((r) => r.data),

  adminList: () => api.get<AdminCoupon[]>('/admin/coupons').then((r) => r.data),
  create: (body: CreateCouponBody) =>
    api.post<AdminCoupon>('/admin/coupons', body).then((r) => r.data),
  update: (id: string, body: Partial<CreateCouponBody>) =>
    api.patch<{ ok: boolean }>(`/admin/coupons/${id}`, body).then((r) => r.data),
  remove: (id: string) =>
    api.delete<{ ok: boolean }>(`/admin/coupons/${id}`).then((r) => r.data),
};

// ---------- Announcements Service ----------
export const announcementService = {
  publicList: (status?: string) =>
    api.get<PublicAnnouncement[]>('/announcements', { params: { status } }).then((r) => r.data),
};

// ---------- Inventory & System Services ----------
export const inventoryService = {
  movements: () => api.get<InventoryMovement[]>('/admin/inventory/movements').then((r) => r.data),
  adjust: (productId: string, delta: number, reason: string) =>
    api
      .post<{ ok: boolean; stock_on_hand: number }>('/admin/inventory/adjust', {
        product_id: productId,
        qty_delta: delta,
        reason,
      })
      .then((r) => r.data),
};

export const auditService = {
  logs: () => api.get<AuditLogItem[]>('/admin/audit-logs').then((r) => r.data),
  outbox: () => api.get<EmailOutboxItem[]>('/admin/notifications/outbox').then((r) => r.data),
};
