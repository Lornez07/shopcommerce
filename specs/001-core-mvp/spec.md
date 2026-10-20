# Spec: Core E-Commerce MVP

## Problem Statement
Small business owners selling physical goods currently rely on Shopify, WooCommerce, or Instagram DMs — all of which are either too expensive, too complex, or lack brand ownership. They need a simple, ownable storefront that feels playful and approachable.

## Target User
Small business owners (1-10 person teams) selling physical products who want a branded storefront without platform fees or technical overhead.

## Core User Journey
A shopper browses categories, views product details, adds to cart, checks out with Stripe, and receives an order confirmation — while the merchant manages orders in an admin dashboard.

## Success Metrics
- End-to-end checkout completes in < 3 minutes
- Orders appear in admin dashboard within 5 seconds of payment
- 3 screens render correctly at 375px and 1440px with real content
- Adding a product in Supabase reflects on site immediately

## Features: Must-Have (v1)
- [ ] **Category Grid** — Given a visitor on the home page, when they see category cards, then each card shows category name, product count, and navigates to filtered product list
- [ ] **Product Detail** — Given a visitor on a product page, when they view it, then they see product name, price, description, images, variant selector (size/color), and an "Add to Cart" button
- [ ] **Cart + Checkout** — Given a visitor with items in cart, when they proceed to checkout, then they enter email/shipping, pay via Stripe, and see order confirmation with order number
- [ ] **User Accounts** — Given a visitor, when they sign up via magic link, then they can view past orders and save addresses
- [ ] **Admin Dashboard** — Given an authenticated admin, when they visit /admin, then they see a list of orders with status, customer info, and can update order status
- [ ] **Product Management (DB-driven)** — Given a product in the database, when the site loads, then it appears in the correct category with correct price/images/variants

## Features: Out of Scope (NOT v1)
- Inventory management / stock tracking
- Discount codes / promotions
- Email notifications (order confirmation, shipping)
- Multi-currency / internationalization
- Product reviews / ratings
- Wishlist / save for later
- Guest checkout (accounts required in v1)
- Analytics / reporting dashboard
- Subscription / recurring orders
- Digital product delivery

## Edge Cases & Error States
- **Invalid variant selection**: Show inline error, disable "Add to Cart" until valid
- **Payment failure**: Show Stripe error message, preserve cart, allow retry
- **Empty category**: Show "No products yet" with link to admin (if admin) or contact
- **Out of stock**: Disable "Add to Cart", show "Out of stock" badge
- **First visit (empty cart)**: Cart page shows "Your cart is empty" with "Continue shopping" link
- **Network failure during checkout**: Show retry button, preserve form data
- **Unauthorized admin access**: Redirect to login with return-to-admin parameter