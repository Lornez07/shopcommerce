# Plan: Core E-Commerce MVP

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 14 (App Router)                  │
├─────────────────────────────────────────────────────────────────┤
│  /app                                                           │
│  ├── (public)/                                                  │
│  │   ├── page.tsx                 # Category Grid (Home)       │
│  │   ├── category/[slug]/page.tsx  # Product List (filtered)    │
│  │   ├── product/[id]/page.tsx     # Product Detail            │
│  │   ├── cart/page.tsx             # Cart + Checkout (Steps)   │
│  │   └── checkout/success/page.tsx # Order Confirmation         │
│  ├── (auth)/                                                    │
│  │   ├── login/page.tsx            # Magic link request        │
│  │   ├── callback/page.tsx         # Auth callback             │
│  │   └── account/page.tsx          # Order history, addresses  │
│  ├── (admin)/                                                   │
│  │   ├── layout.tsx                # Admin guard + sidebar     │
│  │   └── page.tsx                  # Order list + status update│
│  └── api/                                                        │
│      ├── webhook/stripe/route.ts   # Stripe webhook handler     │
│      ├── cart/route.ts             # Server cart actions        │
│      └── checkout/route.ts         # Create Stripe session      │
├── components/                                                    │
│   ├── ui/                          # Primitive components       │
│   ├── product/                     # Product-specific           │
│   ├── cart/                        # Cart/checkout components   │
│   ├── admin/                       # Admin components           │
│   └── layout/                      # Header, Footer, Providers  │
├── lib/                                                           │
│   ├── supabase/                    # Server & browser clients   │
│   ├── stripe/                      # Stripe server client       │
│   ├── utils.ts                     # Helpers (formatters, etc)  │
│   └── validations.ts               # Zod schemas                │
└── hooks/                                                         │
    ├── useCart.ts                   # Cart state + actions       │
    └── useAuth.ts                   # Auth state + actions        │
```

**Data Flow**:
- **Server Components** (default): Fetch products, categories, orders directly from Supabase
- **Client Components**: Cart, checkout form, variant selectors, auth interactions
- **Server Actions**: Add to cart, update qty, create checkout session
- **Webhooks**: Stripe → update order status, clear cart

## Data Model

### Supabase Tables (Postgres)

```sql
-- Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Products
create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  name text not null,
  slug text unique not null,
  description text,
  base_price_cents int not null,
  images text[] default '{}',
  variants jsonb not null default '{}', -- { sizes: [], colors: [{name, hex}] }
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Users (Supabase Auth handles auth, this is profile)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  default_shipping jsonb,
  is_admin boolean not null default false,
  created_at timestamptz default now()
);

-- Addresses
create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'US',
  is_default boolean default false,
  created_at timestamptz default now()
);

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  email text not null,
  status text not null default 'pending', -- pending, paid, shipped, cancelled, refunded
  subtotal_cents int not null,
  shipping_cents int not null default 0,
  tax_cents int not null default 0,
  total_cents int not null,
  shipping_address jsonb not null,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order Items
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  product_name text not null,
  product_slug text not null,
  variant jsonb not null, -- { size: "M", color: "Red" }
  unit_price_cents int not null,
  quantity int not null default 1,
  total_cents int not null
);

-- Cart (server-side; accounts required in v1, so user_id is NOT NULL + unique)
create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references carts(id) on delete cascade,
  product_id uuid references products(id),
  variant jsonb not null,
  quantity int not null default 1,
  created_at timestamptz default now(),
  unique (cart_id, product_id, variant) -- add-to-cart is an upsert
);

-- RLS Policies
-- profiles: users can read/update own
-- addresses: users can CRUD own
-- orders: users can read own, admins can read all
-- order_items: via orders
-- carts/cart_items: users can CRUD own
-- products/categories: public read, admin write
```

### Admin Role
- `is_admin` boolean on `profiles` table (set manually in DB for v1)
- Middleware checks `profile.is_admin` for `/admin/*` routes

## API / Interface Design

### Server Actions (`lib/actions/`)

```typescript
// cart.ts
addToCart(productId: string, variant: Variant, quantity: number): Promise<{ success: boolean; cartId: string }>
updateCartItem(cartItemId: string, quantity: number): Promise<void>
removeFromCart(cartItemId: string): Promise<void>
getCart(cartId: string): Promise<CartWithItems>

// checkout.ts
createCheckoutSession(cartId: string, email: string, shippingAddress: Address): Promise<{ sessionId: string; url: string }>

// orders.ts
updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> // admin only
```

### Stripe Integration

- **Products**: Created in Stripe Dashboard manually (v1), synced via `stripe_product_id` on products table (future)
- **Checkout Session**: Mode `payment`, line items from cart, success/cancel URLs
- **Webhook**: `checkout.session.completed` → create order, clear cart, update status to `paid`

### Key Function Signatures

```typescript
// lib/supabase/server.ts
export async function createServerClient(): Promise<SupabaseClient>

// lib/stripe.ts
export const stripe: Stripe // configured with secret key

// components/product/VariantSelector.tsx
interface VariantSelectorProps {
  variants: ProductVariants; // { sizes: string[], colors: {name: string, hex: string}[] }
  selected: SelectedVariant;
  onChange: (key: 'size' | 'color', value: string) => void;
  disabled?: boolean;
}

// hooks/useCart.ts
interface CartState {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  isLoading: boolean;
}
```

## Dependencies

| Package | Purpose | Version Strategy |
|---------|---------|------------------|
| `next` | Framework (App Router, Server Actions) | `14.x` |
| `react`, `react-dom` | UI | `18.x` |
| `@supabase/supabase-js` | Database, Auth, Realtime | `2.x` |
| `@supabase/ssr` | Auth cookies for Server Components | `0.x` |
| `stripe` | Server-side Stripe | `14.x` |
| `@stripe/stripe-js` | Client-side Stripe Elements | `2.x` |
| `@stripe/react-stripe-js` | React Stripe Elements wrapper | `2.x` |
| `zod` | Validation schemas | `3.x` |
| `sonner` | Toasts (error/success) | `1.x` |
| `lucide-react` | Icons | `0.x` |
| `clsx`, `tailwind-merge` | Class utilities | latest |
| `date-fns` | Date formatting | `3.x` |

**Dev Dependencies**:
- `typescript`, `@types/*`
- `tailwindcss`, `postcss`, `autoprefixer`
- `eslint`, `prettier`, `eslint-config-next`
- `@playwright/test` (E2E)
- `vitest` (unit)

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Stripe webhook fails silently | Medium | High (orders lost) | Idempotency keys, retry logic, logging, manual reconciliation script |
| Cart race conditions (concurrent tabs) | Medium | Medium | Optimistic UI + server validation, `onConflict` upsert |
| Supabase RLS misconfiguration | Medium | High (data leak) | Test policies with `supabase db test`, separate admin/client clients |
| Image optimization / storage | Low | Medium | Use Supabase Storage + `next/image` with remote patterns |
| Magic link delivery delays | Low | Medium | Fallback: show "Check spam" message, resend button |
| Mobile cart drawer UX | Medium | Medium | Test on real devices, 48px targets, prevent body scroll |
| Variant pricing complexity | Low | Medium | v1: single base price, variants don't affect price (future: price overrides) |

## Stack Justification

| Choice | Why |
|--------|-----|
| **Next.js 14 App Router** | Server Components = fast initial loads, SEO for product pages, Server Actions = less API boilerplate |
| **Supabase (Postgres + Auth)** | Single platform for DB, Auth (magic links), Realtime (future), Storage (images), Row Level Security |
| **Stripe Checkout** | Hosted payment page = PCI SAQ A, handles 3DS, wallets, international cards, no sensitive data touches our server |
| **Tailwind CSS** | Design system tokens map 1:1 to config, rapid iteration, no CSS-in-JS runtime |
| **TypeScript + Zod** | End-to-end type safety: DB → API → UI, runtime validation at boundaries |
| **Vercel** | Native Next.js support, edge functions for webhooks, preview deployments, free tier sufficient for MVP |

## Future Extensibility (Not v1)

- **Inventory**: Add `stock` column to products, decrement on `paid` webhook
- **Promotions**: `discount_codes` table, apply in checkout session creation
- **Email**: Resend/SendGrid via Supabase Edge Function on order events
- **Admin CMS**: Full product/category CRUD in `/admin` (currently DB-only)
- **Analytics**: PostHog or Plausible via `next/script`