import Stripe from 'stripe';

// stripe@14 pins LatestApiVersion to '2023-10-16'.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true
});