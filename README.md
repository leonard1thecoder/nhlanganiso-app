# Nhlanganiso — Storefront (Next.js + axios)

The customer-facing e-commerce front-end for **Nhlanganiso Catering & Baking**. It talks to the Rust API in `services/api` over the versioned REST API under `/api/v1` (see `contracts/openapi.yaml` and the handlers in `services/api/src/modules`).

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **axios** for every HTTP call, with one shared instance, automatic bearer auth, and silent token refresh
- No UI framework: a small hand-written design system built from the logo palette (`src/app/globals.css`)

## Quick start

```bash
# 1. Backend (from the repo root)
cp services/api/.env.example services/api/.env   # set JWT_SECRET, PayFast/Brevo keys later
docker compose up --build                        # API on http://localhost:8080

# 2. Storefront
cd apps/web
cp .env.example .env.local
npm install
npm run dev                                      # http://localhost:3000
```

The API's CORS allow-list must include the storefront origin. The default already does:
`CORS_ALLOWED_ORIGINS=http://localhost:3000`. For another origin, update that variable.

Other scripts: `npm run build`, `npm start`, `npm run typecheck`.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the Rust API, no trailing slash, no `/api/v1` (default `http://localhost:8080`) |
| `NEXT_PUBLIC_SITE_URL` | Public URL of this site (metadata) |
| `NEXT_PUBLIC_CONTACT_EMAIL` / `NEXT_PUBLIC_CONTACT_PHONE` | Shown in the footer and catering page |

`NEXT_PUBLIC_*` values are compiled into the bundle, so rebuild after changing them.

## Project layout

```
src/
  app/                    routes (App Router)
    page.tsx              home
    products/             shop listing (search + pagination) and product detail
    cart/  checkout/      cart (server-priced) and checkout → PayFast
    checkout/success|cancel   payment return pages
    orders/               order history and detail (signed-in)
    catering/             enquiry form, quote view + accept
    login/ register/ forgot-password/ reset-password/ verify-email/
    account/              profile, signed-in devices, sign out everywhere
    admin/                back office (role = admin): dashboard, orders, catering
  components/             Navbar, Footer, ProductCard, RequireAuth, Field, Notice, StatusBadge, …
  context/                AuthContext (session), CartContext (localStorage cart)
  lib/
    api.ts                axios instance, interceptors, refresh-on-401, ApiError
    services.ts           typed endpoint wrappers — components never call axios directly
    types.ts              wire types for the API
    tokens.ts             token storage
    payfast.ts            builds and posts the PayFast form (fixed field order)
    format.ts             money (integer cents → "R 65.00"), dates, rand parsing
    config.ts             env + constants
```

## How the important flows work

**Auth and refresh.** Tokens are stored in `localStorage` (`nhl.auth.tokens.v1`). Every request gets `Authorization: Bearer <access>`. On a `401`, `api.ts` calls `POST /auth/refresh` once, rotates the stored pair, and retries the original request. Concurrent 401s share one refresh call. If the refresh fails, tokens are cleared and a `nhl:session-expired` event is dispatched.

**Cart.** Stored locally as `{product_id, slug, name, price_cents, qty}`. Totals are always fetched from `POST /cart/quote`, so the browser never decides a price.

**Checkout.** Three steps:
1. `POST /orders` creates the order. Guests are allowed, and the account is attached when signed in.
2. `POST /payments/checkout` returns PayFast's URL and signed fields. The amount comes from the server.
3. The browser POSTs those fields to PayFast. The order is only marked paid after the server receives a validated PayFast ITN, never from the return redirect. The success page shows the authoritative status to signed-in customers.

**Catering.** Public enquiry form (`POST /catering/requests`). Quotes are viewable and acceptable at `/catering/quotes/:id`. Acceptance never takes payment.

**Response envelopes.** The API is inconsistent. Most endpoints return the object directly, while `GET /products` returns `{ data, meta }`. `services.ts` is the only place that knows this.

## Known gaps in the API (the UI handles them, but these need backend work)

These are listed so you can prioritise them. Each one has a graceful fallback in the UI.

1. **PayFast field order.** `CheckoutRes.fields` is a `HashMap`, so JSON key order is random. PayFast validates the signature over fields in the order posted. The UI re-orders them (`src/lib/payfast.ts`). The fix is to return `fields` as an ordered array of `{name, value}` pairs.
2. **No delivery zones endpoint.** `delivery_zone_id` is required for delivery, but nothing lists zones. The UI offers pickup only. Add `GET /api/v1/delivery-zones`.
3. **Product `category` filter is ignored.** `ListQ.category` is parsed but never used. The `sort` parameter is also ignored.
4. **Product responses omit `description` and `image_url`.** The columns exist in `002_catalogue.sql`. Add them to the list and detail responses. The UI already renders them when present.
5. **Order detail has no line items.** `GET /orders/:id` returns totals and status only. Add `items`.
6. **Guests cannot see their own order.** `GET /orders/:id` and `/payment-status` require auth, so the success page cannot show status for guests. Consider a signed order-status token or returning `reference` plus an email check.
7. **Inconsistent envelope.** Every handler does `Json(inner.data)`, so the `ApiResponse` wrapper is never emitted. Pick one convention (bare objects everywhere, or `{data, meta}` everywhere) and update the contract.
8. **Contract is thin.** `contracts/openapi.yaml` lacks response schemas, cart, admin and catering-admin routes. The UI was built from the handlers, not the spec.

## Security notes

- The refresh token lives in `localStorage` because the API returns it in the JSON body. This is XSS-sensitive. The long-term fix is an httpOnly cookie issued by the API (or a Next.js route handler acting as a backend-for-frontend). `src/lib/tokens.ts` is the only file to change.
- The UI never renders tokens, never logs them, and reads `?next=` through `safeNext()` to prevent open redirects.
- Admin screens are hidden from non-admins for UX only. The API enforces the role on every call.

## Deploying

- Set `NEXT_PUBLIC_API_URL` to the public HTTPS API, and add the storefront's origin to the API's `CORS_ALLOWED_ORIGINS`.
- Set the API's `PUBLIC_WEB_URL` to the storefront origin. Verification, reset and PayFast return links are built from it.
- `npm run build && npm start`, or deploy to any Node host or Vercel.
