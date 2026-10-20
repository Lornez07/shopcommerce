# Project Constitution

## Stack
- Language: TypeScript
- Framework: Next.js 14 (App Router)
- Database: Supabase Postgres
- Auth: Supabase email magic link
- Payments: Stripe Checkout + Webhooks
- Hosting/Deployment: Vercel
- AI Tools: opencode (model routing per workspace AGENTS.md)

## Conventions
- Naming: PascalCase components, camelCase functions/variables, kebab-case route files, snake_case DB columns
- File structure: `app/` for routes, `components/` for UI, `lib/` for clients/actions/utils, `hooks/` for client state
- Testing framework & requirements: Playwright E2E for core flows, Vitest for pure logic. No feature is done without its acceptance criteria tested.
- Error handling pattern: Server Actions return `{ success, data?, error? }`; UI renders inline errors + toast for transient failures. Never swallow errors.
- State management approach: Server Components + Server Actions for canonical data. Minimal client state via hooks (`useCart`, `useAuth`). No global store.

## Rules (AI must obey)
- Do not add new dependencies without asking
- Do not rewrite existing working code without justification
- Do not generate placeholder/fake data in production paths
- All generated code must include error handling
- Follow `design-anchor.md` exactly — no invented colors, fonts, spacing, or radii
- Every screen must include loading, empty, error, and success states
- Verify layout at 375px and 1440px

## Out of Scope (for this project)
- Inventory/stock tracking
- Discount codes and promotions
- Transactional email (order confirmation, shipping)
- Multi-currency / i18n
- Reviews and ratings
- Wishlist / save for later
- Guest checkout
- Analytics dashboards
- Subscriptions / recurring billing
- Digital product delivery

## Process
This project follows the Spec -> Plan -> Tasks -> Implement loop defined in the workspace AGENTS.md.
