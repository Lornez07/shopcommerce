# Tasks: Core E-Commerce MVP

Tasks are ordered by dependency. Implement one at a time and verify before moving on.

## Task 1: Project Setup & Configuration
- **Inputs:** None (new project)
- **Outputs:**
  - `ecommerce/` initialized with Next.js 14, TypeScript, Tailwind
  - `package.json` with all dependencies
  - `tsconfig.json`, `tailwind.config.ts`, `next.config.js`
  - `.env.local` template with Supabase + Stripe keys
  - `design-anchor.md` tokens mapped to Tailwind config
- **Verification:**
  - `npm run dev` starts on localhost:3000
  - `npm run lint` passes
  - `npm run build` succeeds
  - Tailwind colors/fonts/radii from design-anchor work in a test component

## Task 2: Supabase Schema & Client Setup
- **Inputs:** `plan.md` (Data Model section)
- **Outputs:**
  - `supabase/migrations/001_initial_schema.sql` with all tables, RLS, indexes
  - `lib/supabase/server.ts` — `createServerClient()` with cookies
  - `lib/supabase/client.ts` — browser client for Client Components
  - `lib/supabase/middleware.ts` — auth session refresh
  - `middleware.ts` — protects `/admin/*`, `/account/*`, `/cart/*`, `/checkout/*`
- **Verification:**
  - `npx supabase db push` applies migration to the linked remote project ✅
  - Anon can read products/categories, cannot read profiles ✅
  - Authenticated cannot update `profiles.is_admin` (column grant, not RLS) ✅
  - Own-vs-other order isolation re-verified in Task 12 once real users exist
  - Server client fetches categories in a Server Component (proven in Task 6)

## Task 3: Stripe Configuration & Webhook Handler
- **Inputs:** Stripe account (test mode)
- **Outputs:**
  - `lib/stripe.ts` — configured Stripe instance
  - `app/api/webhook/stripe/route.ts` — handles `checkout.session.completed`
  - Webhook secret in `.env.local`
  - Idempotency handling (store `stripe_session_id` on orders)
- **Verification:**
  - `stripe listen --forward-to localhost:3000/api/webhook/stripe` receives test event
  - Webhook creates order, clears cart, sets status `paid`
  - Duplicate webhook delivery is idempotent

## Task 4: Design System Primitives
- **Inputs:** `design-anchor.md` (Typography, Color, Spacing, Radius, Shadows, Motion)
- **Outputs:**
  - `components/ui/Button.tsx` — Primary, Secondary, Ghost, Destructive; all states
  - `components/ui/Input.tsx` — Label, error, disabled, loading states
  - `components/ui/Card.tsx` — Default, hover lift, loading skeleton
  - `components/ui/Badge.tsx` — Variant pills, cart badge (with pulse animation)
  - `components/ui/Select.tsx` — For variant groups (size/color swatches)
  - `components/ui/Spinner.tsx` — Loading states
  - `components/ui/Toast.tsx` — Sonner wrapper with design-anchor styling
  - `components/ui/Container.tsx` — Max-width 1200px, responsive padding
- **Verification:**
  - Storybook or `/design-tokens` page shows all components in all states
  - Responsive at 375px and 1440px
  - Focus rings visible, reduced-motion respected

## Task 5: Layout & Navigation
- **Inputs:** `design-anchor.md` (Header, Footer, Cart Badge)
- **Outputs:**
  - `components/layout/Header.tsx` — Logo, category nav, cart icon with Pulse badge, auth links
  - `components/layout/Footer.tsx` — Minimal links
  - `components/layout/Providers.tsx` — Supabase, Stripe, React Query providers
  - `app/layout.tsx` — Fonts (Syne, DM Sans, JetBrains Mono), global styles
  - `app/(public)/layout.tsx` — Public layout with Header/Footer
- **Verification:**
  - Header renders on all public pages
  - Cart badge shows count, pulses on add (tested in Task 8)
  - Magic link sign-in/out works
  - Mobile: hamburger menu (future), cart drawer trigger

## Task 6: Category Grid (Home Page)
- **Inputs:** `spec.md` (Category Grid feature), `design-anchor.md` (Screen 1)
- **Outputs:**
  - `app/(public)/page.tsx` — Server Component, fetches categories + product counts
  - `components/product/CategoryCard.tsx` — Image, name, count, hover lift
  - `lib/actions/categories.ts` — `getCategoriesWithCounts()`
- **Verification:**
  - Page loads categories from DB at 375px (1 col), 768px (2 col), 1440px (4 col)
  - Empty state: "No categories yet" + admin link (when logged in as admin)
  - Clicking category navigates to `/category/[slug]`

## Task 7: Product List (Category Page)
- **Inputs:** `spec.md` (Category Grid → filtered list), `design-anchor.md`
- **Outputs:**
  - `app/(public)/category/[slug]/page.tsx` — Server Component, fetches products by category
  - `components/product/ProductCard.tsx` — Thumb, name, price (Syne Display MD), "View"
  - `lib/actions/products.ts` — `getProductsByCategory(slug)`, `getProductById(id)`
- **Verification:**
  - Grid: 1 col (375px), 2 col (768px), 3 col (1024px), 4 col (1440px)
  - Empty category shows "No products yet"
  - Product cards link to `/product/[id]`

## Task 8: Product Detail Page
- **Inputs:** `spec.md` (Product Detail feature), `design-anchor.md` (Screen 2)
- **Outputs:**
  - `app/(public)/product/[id]/page.tsx` — Server Component, fetches product + variants
  - `components/product/ProductGallery.tsx` — Main image (4:5) + thumbnails (swipe mobile)
  - `components/product/VariantSelector.tsx` — Pill groups for size/color, required selection
  - `components/product/AddToCartForm.tsx` — Client Component, uses `useCart` hook
  - `hooks/useCart.ts` — Cart state, `addToCart` server action integration
  - `lib/actions/cart.ts` — `addToCart`, `getOrCreateCart`
- **Resequenced:** minimal auth (login page, magic-link action, `/callback` route)
  was pulled forward from Task 12 — the cart is account-scoped in v1, so add-to-cart
  cannot be verified without a session.
- **Verification:**
  - Variant selection required before "Add to Cart" enables (button disabled + hint,
    per the anchor, rather than a click-then-error flow)
  - Color shows swatch (hex), Size shows text pills
  - Adding item: cart badge pulses, toast "Added to cart"
  - Invalid variant: inline error, button stays disabled
  - Out of stock (future): badge shows, button disabled
  - Responsive: gallery stacks mobile, side-by-side desktop

## Task 9: Cart Page (Step 1 of Checkout)
- **Inputs:** `spec.md` (Cart + Checkout), `design-anchor.md` (Screen 3, Step 1)
- **Outputs:**
  - `app/(public)/cart/page.tsx` — Client Component (needs interactivity)
  - `components/cart/CartDrawer.tsx` — Mobile: bottom sheet, Desktop: sidebar (or full page)
  - `components/cart/CartItem.tsx` — Thumb, name, variant, qty stepper, line price, remove
  - `components/cart/CartSummary.tsx` — Subtotal, shipping estimator (postcode), "Proceed to Checkout"
  - `lib/actions/cart.ts` — `updateCartItem`, `removeFromCart`, `getCart`
  - `hooks/useCart.ts` — Extended with `updateQuantity`, `removeItem`, `shippingEstimate`
- **Deviation:** `CartTotals.tsx` rather than `CartSummary.tsx` — the latter would
  shadow the `CartSummary` data type used across the cart actions.
- **Deviation:** the page is a Server Component shell around a client `CartView`,
  instead of a client page. A client-only page renders the empty state on first
  paint before the provider hydrates.
- **Verification:**
  - Empty cart: "Your cart is lonely. Fix that." + "Browse Categories" link
  - Qty stepper updates server, UI optimistic then confirmed
  - Remove item updates subtotal
  - Shipping estimator: postcode input → shows calculated shipping (flat rate $5 for v1)
  - "Proceed to Checkout" navigates to `/checkout`

## Task 10: Checkout Page (Step 2) & Stripe Integration
- **Inputs:** `spec.md` (Cart + Checkout), `design-anchor.md` (Screen 3, Step 2)
- **Outputs:**
  - `app/(public)/checkout/page.tsx` — Client Component
  - `components/checkout/CheckoutForm.tsx` — Email (prefilled), Shipping Address, Stripe CardElement
  - `components/checkout/OrderSummary.tsx` — Sticky sidebar (desktop) or collapsible (mobile)
  - `lib/actions/checkout.ts` — `createCheckoutSession(cartId, email, address)`
  - `app/api/checkout/route.ts` — Server Action endpoint for Stripe session creation
  - Stripe Elements integration with design-anchor styling
- **Deviation:** built on PaymentIntents + Payment Element rather than a Checkout
  Session, so the shopper's address can live in our own form. The webhook event
  is therefore `payment_intent.succeeded`, and the success URL carries
  `payment_intent=` instead of `session_id=`. The CLI forwarder must use
  `--events payment_intent.succeeded`.
- **Deviation:** no `app/api/checkout/route.ts`. PaymentIntent creation is a
  Server Action (`startCheckout`) like the rest of the project.
- **Added:** `supabase/migrations/002_order_payment_intent_unique.sql` — a unique
  index so webhook retries cannot create duplicate orders.
- **Status:** written, not yet built or exercised against a real test payment.
- **Verification:**
  - Form validates: email required, address required, card valid
  - "Pay $XX.XX" button shows exact total, disabled while loading
  - Stripe test card `4242 4242 4242 4242` completes payment
  - Success → redirects to `/checkout/success?session_id=...`
  - Failure: inline Stripe error, form preserved, retry enabled
  - Back to Cart link works

## Task 11: Order Confirmation Page
- **Inputs:** `spec.md` (Order confirmation), `design-anchor.md`
- **Outputs:**
  - `app/(public)/checkout/success/page.tsx` — Server Component, fetches order by session_id
  - `components/checkout/OrderConfirmation.tsx` — Order number (Syne Display XL), details, "Continue Shopping"
  - `lib/actions/orders.ts` — `getOrderBySessionId(sessionId)`
- **Verification:**
  - Order number displays in Syne Display XL, Primary color
  - Shows: items, subtotal, shipping, total, shipping address
  - "Continue Shopping" links to home
  - Refreshing page doesn't create duplicate order

## Task 12: User Authentication (Magic Link)
- **Already landed in Task 8:** `/login`, `/callback`, `signInWithMagicLink`,
  header session awareness. Remaining here: account page, order history, addresses.
- **Inputs:** `spec.md` (User Accounts), `plan.md` (Auth)
- **Outputs:**
  - `app/(auth)/login/page.tsx` — Email input, "Send Magic Link"
  - `app/(auth)/callback/page.tsx` — Handles auth code exchange, redirects to intended page
  - `app/(auth)/account/page.tsx` — Order history, saved addresses
  - `components/auth/MagicLinkForm.tsx` — Email input + submit
  - `lib/actions/auth.ts` — `signInWithMagicLink(email, redirectTo)`
  - `hooks/useAuth.ts` — User session, profile, addresses
- **Deviation:** no `hooks/useAuth.ts`. The account page is a Server Component that
  reads the session once; a client hook would have duplicated it. Header keeps its
  own small `onAuthStateChange` subscription.
- **Deviation:** page lives at `app/(public)/account` so it inherits the site header
  and footer. `(auth)` has no layout of its own.
- **Schema note:** `orders` has no `order_number`. The list shows `#` + the first 8
  characters of the UUID until Task 10 adds a real sequence.
- **Known gap:** deleting the default address leaves no default. Task 10 should
  promote the oldest remaining or fall back to the first address.
- **Visual pass (1440 + 375):** default chip moved from Success to neutral so green
  keeps meaning "confirmed"; Add/Save buttons at 48px; email wraps.
- **Status:** verified 1440 + 375. Build gate pending at time of writing.
- **Verification:**
  - Magic link sent to email (test with Supabase local dev)
  - Clicking link logs in, redirects to previous page (cart/checkout/account)
  - Account page shows past orders with status badges
  - Addresses: add/edit/delete, mark default
  - Sign out works

## Task 13: Admin Dashboard
- **Inputs:** `spec.md` (Admin Dashboard), `plan.md` (Admin Role)
- **Outputs:**
  - `app/(admin)/layout.tsx` — Sidebar nav, admin guard (checks `profile.is_admin`)
  - `app/(admin)/page.tsx` — Order list table: Order #, Customer, Date, Total, Status, Actions
  - `components/admin/OrderTable.tsx` — Sortable, paginated, status badge
  - `components/admin/StatusSelect.tsx` — Dropdown to update status
- **Deviation:** files live in `app/admin/`, not `app/(admin)/`. A route group adds no
  path segment, so `app/(admin)/page.tsx` resolves to `/` and collides with
  `app/(public)/page.tsx`. Next refuses to build two pages on one path.
- **Deviation:** column sorting and pagination deferred to Task 14. Against zero
  rows they would be untested code; the query sorts newest-first and caps at 100.
- **Status:** built, guard + empty state pending verification. (pending/paid/shipped/cancelled/refunded)
  - `lib/actions/admin.ts` — `getAllOrders()`, `updateOrderStatus(orderId, status)`
  - Middleware: redirects non-admins from `/admin/*`
- **Verification:**
  - Admin sees all orders, non-admin gets 403/redirect
  - Status update: optimistic UI, server action, toast on success/error
  - Order links to detail view (future) or shows modal with items
  - Pagination works (20 per page)

## Task 14: E2E Testing & Polish
- **Inputs:** All previous tasks, `spec.md` (Acceptance Criteria)
- **Outputs:**
  - `tests/e2e/shopping.spec.ts` — Full flow: browse → product → cart → checkout → success
  - `tests/e2e/admin.spec.ts` — Admin login, status update
  - `tests/e2e/auth.spec.ts` — Magic link flow
  - Visual regression screenshots at 375px and 1440px for 3 core screens
  - Real content seeded in Supabase (5 categories, 12 products, variants)
- **Verification:**
  - `npm run test:e2e` passes all scenarios
  - Screenshots match design-anchor (review manually)
  - Lighthouse: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90
  - No console errors in production build
  - All acceptance criteria from `spec.md` verified manually


### Task 14 status

**Done**
- `playwright.config.ts` — two projects (`desktop-1440` at 1440x900, `mobile-375` at 375x812), `webServer` reuses a running dev server, traces on first retry.
- `tests/e2e/shopping.spec.ts` — home renders its heading and category links; category → product navigation lands on a product URL; an unknown category returns a real 404; `/cart` and `/checkout` redirect anonymous visitors to sign-in.
- `tests/e2e/auth.spec.ts` — login page exposes the email field and submit button; `a@b` passes native `type="email"` validation but is rejected by `signInWithMagicLink`, so the server-side guard is actually exercised.
- `tests/e2e/admin.spec.ts` — `/admin` redirects anonymous visitors to `/login?redirect=`; `GET /api/webhook/stripe` returns 405 rather than leaking the handler.
- Imagery — all 17 `picsum.photos` URLs replaced with Unsplash CDN photos chosen per product (see `supabase/seed.sql`). Every URL was fetched and returned 200 at the exact crop the UI uses (1200x1500 products / 4:5, 1200x750 categories / 16:10). Rows were patched in Supabase and read back: 12/12 products, 5/5 categories, 0 remaining picsum references.
- `next.config.js` — removed the `picsum.photos` remote pattern now that nothing references it.
- `app/icon.svg` — the only console error in the build was a 404 for `favicon.ico`; the icon is the mug mark in ink/coral from the design anchor. Console is now clean.
- Visual check at 1440 and 375 of home, category and product. Crops hold up: the apron, napkins and preserve shots were re-picked after the first pass, because Unsplash's centre crop at 4:5 cut the subject out of the frame.

**Deviations**
- The authenticated purchase flow is **not** in the suite. Automating it needs a real session, and magic links arrive by email, so it requires minting a session through Supabase's admin API — a separate piece of work with its own failure modes. That path was verified manually in Task 10/11 with a real order (`#82E09136`) in the database, and the specs above cover the unauthenticated guards around it.
- Admin login and status update are likewise manual, for the same session reason. Covered by the anonymous gate test plus the manual pass in Task 13.
- "Visual regression screenshots" are captured and reviewed, but not diffed automatically — there is no checked-in baseline, so they act as evidence rather than a regression gate.


**Post-run fixes (first `test:e2e` run: 12 passed, 4 failed)**

1. *Strict-mode violation on `getByRole('alert')`.* Next mounts its own
   `role="alert"` route announcer (`#__next-route-announcer__`) on every page, so the
   auth spec matched two elements. Scoped to `.filter({ hasText: /valid email/i })`.
2. *Unknown category returned 200.* Not a bad assertion — a real defect.
   `app/(public)/loading.tsx` wrapped every public route in a Suspense boundary, so
   the shell flushed with 200 before `notFound()` could set the status. Validation
   moved into `generateMetadata` (which runs before the body is written) and the
   global boundary was removed. `getProductsForCategory` / `getProductById` are now
   wrapped in React `cache()` so metadata and page share one query.
3. The same bug existed on `/product/[id]`; fixed the same way and a test added
   (`an unknown product id returns 404`).
4. The skeleton did not disappear with the boundary: it became
   `components/ui/PageSkeleton.tsx`, opted into by `cart`, `account`, `checkout`,
   `checkout/success`, and by `(public)/(home)/loading.tsx`. The home page moved to
   `app/(public)/(home)/page.tsx` — a route group adds no path segment, so it still
   serves `/` while scoping its skeleton away from the routes that must 404.
5. Page titles were double-suffixed (`... | ShopCommerce | ShopCommerce`) because the
   root layout already applies `%s | ShopCommerce`; both `generateMetadata` functions
   now return the bare name.

Verified directly against the dev server: `/category/does-not-exist` and
`/product/00000000-...` return 404, `/category/ceramics`, `/product/<id>` and `/`
return 200, titles are singular-suffixed, console has zero errors.

**Task 14: complete.**

**Re-run green.** `npm run test:e2e` → **18 passed (11.0s)**, zero failures, both
viewports. The suite covers the public storefront, the auth guard path, and the
admin gate; the authenticated purchase flow remains a manual check (see
Deviations).

**Not yet verified**
- Lighthouse (production build via `npm start`, desktop preset, cold image cache):
  **Performance 94 · Accessibility 100 · Best Practices 100 · SEO 100** — all four
  targets met. FCP 1.4 s, LCP 3.1 s, TBT 10 ms, CLS 0.
  - LCP 3.1 s is the weakest metric and is partly cold-cache: Next's image optimiser
    fetches and re-encodes five remote Unsplash photos on the first request. A warm
    run is faster. If it stays above 2.5 s in production, add `priority` to the first
    CategoryCard image.
  - bfcache is blocked by `Cache-Control: no-store`, which `force-dynamic` sets on
    every page. Making pages cacheable is a data-freshness decision, not a bug.
  - Fixed a WCAG 2.5.3 failure Lighthouse reports at zero weight: the logo link carried
    `aria-label="Home"` while showing "Shop Commerce", so voice-control users could not
    activate it by its visible name. Now `aria-label="Shop Commerce — home"`.

## Task 15: Deployment & Environment Setup
- **Inputs:** Working local build
- **Outputs:**
  - Vercel project connected to GitHub
  - Environment variables configured (Supabase, Stripe, webhook secret)
  - Supabase production project linked
  - Stripe webhook endpoint registered for production URL
  - Custom domain (if applicable)
- **Verification:**
  - Preview deployment works on PR
  - Production deployment loads, checkout works with Stripe test mode
  - Webhook receives events in production
  - Admin dashboard accessible
  - Delete the temporary diagnostic endpoint `app/api/whoami/route.ts`
    (added while debugging the admin guard; it reports the caller's own profile)

---


### Task 15 status

**Repo-side work — done**
- `app/api/whoami/route.ts` removed (parked in `.trash/`; there is no delete tool in this
  session). Nothing imported it — only `tasks.md` mentioned it.
- `.gitignore` extended with `/.trash` and `*.report.html` (the Lighthouse report would
  otherwise be committed). `.env*.local` already excluded `.env.local`, which holds the
  live test keys and the service-role key.
- Secret scan across every committable `ts/tsx/js/json/md/sql/example` file: no
  `sk_test_`, `whsec_`, service-role JWT or Supabase key in any of them.
  `.env.local.example` holds placeholders only.
- `README.md` rewritten. It still claimed "13 products" and "dev-only imagery" and its
  status section stopped at Task 6 — stale enough to mislead anyone opening the repo.
- `specs/001-core-mvp/deploy.md` written: pre-flight, git, Vercel env table, Supabase
  redirect config, Stripe endpoint, a production verification list, and the failure modes
  (400 = signature, 500 = handler) worth knowing before debugging blind.

**Blocked on the account holder** (cannot be done from this session)
- `git init` / commit / push — there is no repository yet.
- Vercel project import and environment variables.
- Supabase Auth URL configuration for the production domain.
- Stripe dashboard webhook endpoint and its signing secret.
- Production smoke test with card `4242 4242 4242 4242`.

Task 15 is **not** complete until the production checkout produces an order row that shows
up in `/account` and `/admin`, with a 200 in the Stripe delivery log.


**Production smoke test — verified from the data, not from the screen**

| Check | Evidence |
| --- | --- |
| Payment captured | `pi_3UShpHDt5fMTYGJd2H4Rkh6X`, `succeeded`, 1900¢, 18:31:55Z |
| Order recorded | `ad5be91b-7139-474f-ba05-a5d8e75c4c26`, status `paid`, 18:32:20Z — 25 s after capture |
| Totals | 1400 subtotal + 500 shipping = 1900, matching the PaymentIntent to the cent |
| Line item | Smoked Chili Salt, 250 g variant, qty 1, 1400¢, correct `product_id` |
| Shipping address | Captured from PaymentIntent metadata (name, line1/2, city, CA, 94110, US) |
| Idempotency | exactly **1** order for that PaymentIntent |
| Cart cleanup | 0 cart items remaining for the user |

**A webhook endpoint already existed pointing at the site root** (`https://shopcommerce-nine.vercel.app/`).
Deliveries to `/` return 200 from the homepage, so Stripe would have logged success on every
order while `orders` stayed empty. Corrected to `/api/webhook/stripe` via the Stripe API before
the first payment; no payment had been taken in that window, so nothing was lost.

**Deviations**
- Preview-deployment check not performed: work went straight to `main`, so no PR existed.
- `.trash/` still holds the parked files locally (git-ignored). Delete when convenient.
- Test-mode only, as specified.

**Task 15: complete.**

## Post-completion polish

**Imagery — third-party branding removed.** Two Unsplash photos carried readable brand
labels, which is a credibility problem on a portfolio storefront. Replaced in the database
and in `seed.sql` (so a reseed matches):

| Product | Was | Now |
| --- | --- | --- |
| Single-Origin Filter Coffee | `photo-1512372388054-a322888e67a6` (branded "Little Nap" bag) | `photo-1695245503558-5cdb37f49092` (plain kraft bag) |
| Smoked Chili Salt | `photo-1765984551507-0e28868a404f` (branded jar) | `photo-1594813592990-2449cd47da8b` (unmarked glass jar) |

Both new URLs verified at 1200×1500 (HTTP 200) and rendered on the production product pages.
All 17 catalogue images are now unbranded; `README.md` updated accordingly.

**LCP — investigated and deliberately left alone.** Lighthouse reported LCP 3.1 s on the
production build. Measured the actual LCP element in a browser on the live site: it is the
home `<h1>` ("Kitchen things worth keeping."), not an image. The earlier plan to add
`priority` to the first `CategoryCard` image would have changed nothing. Fonts already set
`display: 'swap'`; the remaining delay is the display font arriving after the render-blocking
stylesheet. The available fixes (`display: 'optional'`, or deferring the stylesheet) trade
first-visit typography — the brand's entire identity — for a metric already passing at 94.
Documented rather than "fixed".


---

## Dependency Graph

```
Task 1 (Setup)
  → Task 2 (Supabase Schema)
  → Task 3 (Stripe/Webhook)
  → Task 4 (Design Primitives)
  → Task 5 (Layout/Nav)
  → Task 6 (Category Grid)
  → Task 7 (Product List)
  → Task 8 (Product Detail + Cart Hook)
  → Task 9 (Cart Page)
  → Task 10 (Checkout + Stripe)
  → Task 11 (Order Confirmation)
  → Task 12 (Auth/Account)
  → Task 13 (Admin)
  → Task 14 (E2E Tests + Polish)
  → Task 15 (Deploy)
```

Tasks 12 (Auth) and 13 (Admin) can run in parallel after Task 5.
Task 3 (Stripe) can run in parallel after Task 1.