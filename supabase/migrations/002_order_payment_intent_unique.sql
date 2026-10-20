-- One order per PaymentIntent.
--
-- Stripe retries webhooks (and can deliver the same event twice). Without this
-- the handler would create duplicate orders for a single payment. The webhook
-- treats error 23505 as "already recorded" and stops.

create unique index if not exists orders_stripe_payment_intent_id_key
  on public.orders (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
