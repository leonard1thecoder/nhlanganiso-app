# Storefront redesign: notes and handoff

Applies the guidance in `.github/skills/product-design-intelligence/SKILL.md` to the
customer storefront. Admin, account, login and register pages are not restyled
beyond shared changes (see "Shared changes" below).

## 1. Audit (before)

Findings from the PR branch, ordered by severity.

| Severity | Area | Finding | Resolution |
| --- | --- | --- | --- |
| Critical | Bag / checkout | The bag showed a promo discount and a lower "Estimated Total", computed in the browser. `POST /cart/quote` returns only `subtotal_cents`, and `POST /orders` has no coupon field, so the customer was charged the undiscounted amount. | Browser-side discount removed. Coupon form removed from the bag. Totals come only from the server quote. |
| High | Checkout | Before the quote returned, the pay button and total fell back to a browser-computed sum. | Button shows "Confirming your total…" and is disabled until the server quote arrives. Failed quotes show a retry. |
| High | Checkout | Phone field hint said "Required", but the field is optional. | Hint corrected. |
| High | Trust copy | Unverifiable claims: "256-bit encrypted banking server", "100% Encrypted & Secure Payment", "Inclusive of VAT", "Baked fresh to order", "sourdough", "made fresh daily", "subscriber-only discount coupons", "scheduled collection time". | Removed. Replaced with statements the app supports (pickup only, PayFast, server-confirmed totals). |
| High | Footer | "Track My Order" links guests to `/orders`, which requires sign-in. | Renamed "My orders". |
| High | Brand | Pink navbar and buttons. The logo (`public/brand/logo.jpg`) has no pink. | Palette sampled from the logo: cream, chocolate, terracotta, caramel. **Owner to confirm** (see section 4). |
| High | Product cards | Every card showed a letter tile (the API does not return `image_url`), a "Fresh" badge with no meaning, an "Artisanal Bake" tag, and a redundant "ZAR" tag beside "R". "View Details" appeared only on hover. | Badges and tags removed. Visible name link. Price shown once as "R 285.00". |
| Medium | Navbar | Icon-only actions. "Notifications" bell actually opened orders. Sign-out was a power icon. "Shop all" was missing from the menu. | Text labels. Orders badge moved to the "My orders" link. "Shop all" added. |
| Medium | Home | Decorative monogram tiles as category art. Floating "Made for sharing" card. "Browse the bakery" presented as a trust point. Best sellers list of eight repeated products that appear again in the cakes section. "Pastry platters" link pointed to the general shop. | Removed or replaced. Category links, best sellers cut to four, honest catering panel. Products can still repeat across home sections (see planned). |
| Medium | Catalog | 🥖 and 🧺 emoji in empty states. Filter pills had no pressed state. | Emoji removed. `aria-pressed` added. |
| Medium | Product detail | Invented default description ("premium quality ingredients"). "Bakery Special" badge. | Description shown only when the API provides one. |
| Medium | Layout | Pages using `container section` lost their side gutter on phones (`.section` zeroes horizontal padding). | Restored in `storefront.css`. This also affects admin pages that use the same classes. |
| Low | Footer | Empty "Get in touch" column when no contact details are configured. | Column hidden unless real contact details exist. |

## 2. Direction

- **Users:** customers buying cakes, bakes and desserts for collection, with some catering enquiries. Most are on phones.
- **Primary action per screen:** add to bag (product, shop), review the total (bag), pay (checkout), send enquiry (catering).
- **Brand:** warm, editorial, bakery. Cream ground, chocolate headings and primary actions, terracotta accent, caramel rules. Serif headings, system sans body.
- **Principle:** product photography leads. Until photography exists, the placeholders say so ("Photo coming soon") instead of implying artwork.

## 3. Status

### Implemented
- Palette tokens in `src/app/globals.css` (`:root`). Legacy `--pink-*` names now alias the terracotta accent.
- Primary actions are chocolate, with contrast checked (white on chocolate 11.8:1; body text on cream 14:1; terracotta-deep on terracotta-soft 5.9:1; all pairs at or above WCAG AA 4.5:1).
- Navbar (`Navbar.tsx`), mobile bottom nav (`MobileFooterNav.tsx`), footer (`Footer.tsx`).
- Home (`src/app/page.tsx`): hero, categories, best sellers, cakes, desserts, how it works, catering panel, newsletter.
- Catalog (`ProductCatalog.tsx`): copy, `aria-pressed` filter pills, empty states. Collection grouping and pagination logic unchanged.
- Product tile (`ProductCard.tsx`): class family renamed to `tile__*` so old card styles cannot leak in.
- Product detail (`products/[slug]/page.tsx`): layout, honest notes, stock state. Quantity, stock and add-to-bag logic unchanged.
- Bag (`cart/page.tsx`): server-only totals, retry on quote failure, labelled remove and quantity controls.
- Checkout (`checkout/page.tsx`): quote-gated submit, corrected hints, PayFast explanation. Order creation and PayFast post unchanged.
- `src/app/storefront.css` is imported last in `layout.tsx`. It holds the storefront styles.
- Superseded storefront-only rules pruned from `globals.css` (176 rules, selected by checking that no non-storefront file uses the class).

### Partial
- `globals.css` still contains older rules that are no longer used by storefront components but still apply to admin, account, login, register, FAQ, about and catering pages. These need a separate pass with those pages in view.
- Admin, account, login, register, FAQ, about and catering pages were not restyled or screenshot-checked. Shared changes (palette, `.section` gutter fix, `.eyebrow`, `.btn-primary` now chocolate) reach them.

### Planned (needs owner decision or backend work)
1. **Product photography.** The API does not return `image_url` or `description` (README gap 4). Until it does, every product shows a placeholder, which is the largest single gap between this design and the skill's product-led direction.
2. **Coupons.** Coupon validation exists, but the order API has no coupon field. Restore the coupon form once orders accept a coupon code and return the discounted total.
3. **Collection time and address.** Checkout captures neither. The footer and summary avoid claiming an address or time.
4. **Delivery.** Not offered (README gap 2).
5. **Guest order status** (README gap 6).
6. **De-duplicate products across home sections.** Best sellers, cakes and desserts can show the same product.

### Unverified
- Visual QA was run with the API mocked in the browser and with Chrome at 1366 and 390 px wide. Mock data was used for product names, prices and categories. Nothing was checked against live data.
- Keyboard and screen-reader behaviour was reviewed by reading the markup, not with assistive technology.
- No automated accessibility scan (for example axe) was run.
- Reduced-motion behaviour was checked only for the rules in `storefront.css`.

## 4. Decisions for the owner

1. **Palette.** Pink was applied in a later pass and does not appear in the logo. This change replaces it with the logo's colours. To revert, restore the previous `--pink-*` values in `:root`.
2. **Coupons removed from the bag.** The alternative is to keep the form and label the discount as not yet applied. Removing it avoids showing a discount that is not charged.
3. **Unverified copy removed.** If any of the removed claims is true (for example, VAT-inclusive pricing or fresh-daily baking), confirm and it can be restored with evidence.
4. **Logo mark.** `public/brand/mark.png` is 512×512 and its artwork runs to the bottom edge, so it looks cropped in the navbar and footer. A corrected export from the designer would fix it. This PR does not change brand assets.

## 5. Shared changes outside the storefront

- `.container.section` now keeps its side gutter, which also affects admin and other pages that use both classes.
- `.btn-primary` is chocolate instead of pink.
- `.eyebrow` is terracotta, and the decorative `.rule` span is hidden.

## 6. Notes for future work

- `src/components/ProductCardWithFavorite.tsx` is not imported anywhere. It can be deleted, or reused, in a follow-up.
- Storefront tests should use mocked API responses so product data does not depend on the backend.
- Verify each claim in the footer and home copy before adding new ones. The skill's review checklist applies.
