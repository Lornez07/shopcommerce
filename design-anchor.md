# Design Anchor: Core E-Commerce MVP

## Brand Personality
**Bold, Playful, Approachable** — Like Notion's rounded warmth meets Figma's saturated confidence. Friendly but not childish; energetic but not chaotic.

## Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| **Background** | `#FAFAF8` | Page background, card surfaces — warm off-white, not clinical |
| **Surface** | `#FFFFFF` | Cards, modals, inputs — pure white for contrast |
| **Primary / Accent** | `#E85D2F` | Buttons, links, active states, cart badge — saturated coral-orange, energetic |
| **Primary Hover** | `#D04A1F` | Button hover, pressed states |
| **Secondary** | `#6B5BFF` | Secondary actions, info badges, variant pills — electric violet |
| **Text Primary** | `#1A1A2E` | Headlines, body copy — near-black with blue undertone |
| **Text Muted** | `#6B6B7A` | Placeholders, helper text, meta info |
| **Border** | `#E5E3DF` | Input borders, card dividers, subtle separators |
| **Success** | `#1E8A49` | Order confirmed, stock available, success toasts |
| **Error** | `#C0392B` | Payment errors, validation, out of stock |
| **Warning** | `#F39C12` | Low stock, pending states |

> **Usage rule**: Primary accent (`#E85D2F`) appears on **one** dominant action per screen. Never two primary buttons visible at once.

## Typography

**Display**: `Syne` (Google Fonts) — bold, geometric, slightly wide. Used for: page titles, category names, price display, order numbers.
- Fallback: `system-ui, sans-serif`

**Body**: `DM Sans` (Google Fonts) — friendly, readable, humanist. Used for: all body copy, UI labels, descriptions, form inputs.
- Fallback: `system-ui, sans-serif`

**Mono**: `JetBrains Mono` — for order numbers, SKUs, code-like data only.

### Scale
| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Display XL (page title) | 48px / 3rem | 700 | 1.1 |
| Display LG (section) | 32px / 2rem | 700 | 1.2 |
| Display MD (card title) | 24px / 1.5rem | 600 | 1.3 |
| Body LG (lead) | 18px / 1.125rem | 400 | 1.6 |
| Body (default) | 16px / 1rem | 400 | 1.6 |
| Body SM (meta) | 14px / 0.875rem | 400 | 1.5 |
| Caption | 12px / 0.75rem | 500 | 1.4 |

## Spacing Scale
Base unit: **4px** (0.25rem)

| Token | Value | Use |
|-------|-------|-----|
| `space-1` | 4px | Icon gaps, inline gaps |
| `space-2` | 8px | Button padding X, form field gaps |
| `space-3` | 12px | Card padding (mobile), list item gaps |
| `space-4` | 16px | Card padding (desktop), section gaps |
| `space-5` | 20px | Modal padding, large gaps |
| `space-6` | 24px | Section padding (mobile), component gaps |
| `space-8` | 32px | Section padding (desktop), page margins |
| `space-10` | 40px | Hero vertical rhythm |
| `space-12` | 48px | Major section breaks |

## Corner Radius
| Token | Value | Use |
|-------|-------|-----|
| `radius-sm` | 6px | Inputs, badges, pills, icon buttons |
| `radius-md` | 12px | Cards, buttons, modals, dropdowns |
| `radius-lg` | 20px | Hero images, featured product cards |
| `radius-full` | 9999px | Avatar, cart badge, pill tags |

## Shadow System
| Token | Value | Use |
|-------|-------|-----|
| `shadow-sm` | `0 1px 2px rgba(26,26,46,0.06)` | Cards at rest, inputs |
| `shadow-md` | `0 4px 12px rgba(26,26,46,0.08)` | Hovered cards, dropdowns |
| `shadow-lg` | `0 12px 28px rgba(26,26,46,0.12)` | Modals, cart drawer, toasts |

## Signature Element
**The "Pulse" Cart Badge** — A rounded pill (`radius-full`) in Primary (`#E85D2F`) with white text, positioned top-right of the cart icon. On item add, it **scales 1.3x → 1x** with a 150ms spring animation. The badge itself is the brand's heartbeat — visible on every screen, animated but never distracting.

## Motion
- **Duration**: 150ms default, 200ms for modals/drawers, 300ms for page transitions
- **Easing**: `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring-like, playful)
- **Reduced motion**: All animations disable via `prefers-reduced-motion`

## Grid & Layout
- **Max content width**: 1200px (desktop), full-width (mobile)
- **Category Grid**: 1 col (≤480px), 2 col (481–768px), 3 col (≥769px).
  Amended during Task 6: 4 columns only once the catalogue has 8+ categories — at 5
  categories a 4-column grid leaves a single orphan card on row two.
- **Product Grid**: 1 col (≤480px), 2 col (481–768px), 3 col (769–1024px), 4 col (≥1025px)
- **Gutter**: `space-4` (16px) mobile, `space-6` (24px) desktop

## Required States (Every Interactive Component)
| Component | Default | Hover | Focus | Active | Disabled | Loading | Error |
|-----------|---------|-------|-------|--------|----------|---------|-------|
| Primary Button | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (spinner) | — |
| Secondary Button | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Input | ✓ | ✓ | ✓ | — | ✓ | — | ✓ |
| Variant Pill | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| Cart Badge | ✓ | — | — | ✓ (pulse) | — | — | — |
| Card | ✓ | ✓ (lift) | — | — | — | ✓ (skeleton) | — |

## Screen Requirements

### 1. Category Grid (Home)
- **Hero strip**: Category name in Syne Display MD, product count in DM Sans Body SM muted
- **Cards**: Image (16:10), category name, count, subtle border, `shadow-sm` → `shadow-md` on hover
- **Empty state**: Illustration + "No categories yet" + "Add your first category in Admin" (admin only)

### 2. Product Detail
- **Gallery**: Main image (4:5) + thumbnail strip (mobile: swipe, desktop: thumbnails)
- **Info stack**: Name (Syne Display MD), Price (Syne Display LG, Primary), Description (DM Sans Body)
- **Variant selector**: Pill group (Size: S/M/L/XL, Color: swatch pills), single select per group, required
- **Add to Cart**: Full-width primary button, disabled until all variants selected
- **Empty/error**: "Product not found" with link back to category

### 3. Cart + Checkout (Single Page, Two Steps)
**Step 1 — Cart Drawer/Page**:
- Line items: thumb, name, variant, qty stepper, line price, remove
- Subtotal, shipping calc (postcode input), "Proceed to Checkout" (Primary)
- Empty: "Your cart is empty" + "Browse Categories" link

**Step 2 — Checkout Form**:
- Email (prefilled if logged in), Shipping address, Card element (Stripe Elements)
- "Pay $XX.XX" (Primary, shows amount), "Back to Cart" (Secondary)
- Loading: button spinner, form locked
- Success: Order confirmation with order number (Syne Display XL), "Continue Shopping"
- Error: Inline Stripe error, preserve form, retry enabled

## Banned List (This Project)
- ❌ Purple/blue gradients (Stripe/Linear defaults)
- ❌ Unconsidered Inter/Roboto as body font
- ❌ Centered hero with two buttons
- ❌ Three identical feature cards
- ❌ Emoji icons in production UI
- ❌ Lorem ipsum or placeholder copy
- ❌ Hype words: "elevate", "unlock", "seamless", "revolutionize", "transform"
- ❌ Sharp corners (everything ≥ `radius-sm` = 6px)
- ❌ Pure black `#000000` or pure white `#FFFFFF` for text
- ❌ More than one Primary button per viewport
- ❌ Skeleton loaders without real layout structure
- ❌ Toast notifications for non-critical info (use inline states)

## Copy Guidelines
- **Tone**: Direct, helpful, slightly witty — "Your cart's lonely. Fix that." not "Add items to your shopping cart to begin the checkout process."
- **Buttons**: Verb-first — "Add to Cart", "Pay $42.00", "Continue Shopping"
- **Errors**: "Card declined. Try another?" not "Payment processing error occurred."
- **Empty states**: Action-oriented — "No products yet. Add one in Admin."

## Responsive Checkpoints
- **375px (mobile)**: Single-column stacks, bottom cart drawer, thumb-friendly targets (48px min)
- **768px (tablet)**: Two-column grids, side-by-side checkout form
- **1440px (desktop)**: Four-column grids, centered 1200px container, persistent cart summary sidebar

## Accessibility
- WCAG AA contrast on all text (Primary on White = 4.8:1 ✓, Primary on Background = 3.2:1 ✗ — never put Primary text on Background)
- Focus rings: `2px solid #6B5BFF` offset 2px
- ARIA labels on icon buttons, variant pills, cart badge
- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`