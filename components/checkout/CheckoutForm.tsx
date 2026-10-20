'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import {
  loadStripe,
  type Stripe,
  type StripeElements,
  type StripeElementsOptions
} from '@stripe/stripe-js';
import { Button, Input } from '@/components/ui';
import { prepareCheckout, startCheckout, type ShippingAddress } from '@/lib/actions/checkout';
import { US_POSTCODE_PATTERN } from '@/lib/shipping';
import { formatPrice } from '@/lib/utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

const appearance: StripeElementsOptions['appearance'] = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#E85D2F',
    colorBackground: '#FFFFFF',
    colorText: '#1A1A2E',
    colorTextSecondary: '#6B6B7A',
    colorDanger: '#C0392B',
    fontFamily: 'DM Sans, system-ui, sans-serif',
    borderRadius: '6px'
  }
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATE_PATTERN = /^[A-Za-z]{2}$/;

type Values = {
  email: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
};

type Props = {
  initialEmail: string;
  initialAddress: ShippingAddress;
  totalCents: number;
};

/**
 * Lives inside <Elements>; its only job is handing the Stripe and Elements
 * instances up to the form, which owns the submit button.
 */
function ElementsBridge({
  onReady
}: {
  onReady: (stripe: Stripe, elements: StripeElements) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (stripe && elements) onReady(stripe, elements);
  }, [stripe, elements, onReady]);

  return null;
}

export function CheckoutForm({ initialEmail, initialAddress, totalCents }: Props) {
  const router = useRouter();

  const [values, setValues] = useState<Values>({
    email: initialEmail,
    name: initialAddress.name,
    line1: initialAddress.line1,
    line2: initialAddress.line2 ?? '',
    city: initialAddress.city,
    state: initialAddress.state,
    postal_code: initialAddress.postal_code
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [intent, setIntent] = useState<{
    id: string;
    clientSecret: string;
    totalCents: number;
  } | null>(null);

  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const startedRef = useRef(false);

  const handleReady = useCallback((nextStripe: Stripe, nextElements: StripeElements) => {
    stripeRef.current = nextStripe;
    elementsRef.current = nextElements;
  }, []);

  useEffect(() => {
    // StrictMode runs effects twice in development, and refs survive that
    // remount. The guard keeps it to a single PaymentIntent, and nothing below
    // cancels the result — otherwise the only response would be discarded and
    // the card fields would sit on the loading skeleton forever.
    if (startedRef.current) return;
    startedRef.current = true;

    startCheckout()
      .then((result) => {
        if (result.ok) {
          setIntent({
            id: result.paymentIntentId,
            clientSecret: result.clientSecret,
            totalCents: result.totalCents
          });
          return;
        }

        if (result.reason === 'auth') {
          router.replace('/login?redirect=%2Fcheckout');
          return;
        }

        if (result.reason === 'empty') {
          router.replace('/cart');
          return;
        }

        setStartError(result.error);
      })
      .catch(() => {
        setStartError('Could not reach the payment service. Reload the page to try again.');
      });
  }, [router]);

  function update(field: keyof Values, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => {
      if (!(field in previous)) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (!EMAIL_PATTERN.test(values.email.trim())) next.email = 'Enter a valid email address.';
    if (values.name.trim().length === 0) next.name = 'Enter a recipient name.';
    if (values.line1.trim().length === 0) next.line1 = 'Enter a street address.';
    if (values.city.trim().length === 0) next.city = 'Enter a city.';
    if (!STATE_PATTERN.test(values.state.trim())) next.state = 'Use the 2-letter state code.';
    if (!US_POSTCODE_PATTERN.test(values.postal_code.trim())) {
      next.postal_code = 'Enter a 5-digit US postcode.';
    }

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPaying || !intent) return;

    setFormError(null);

    if (!validate()) return;

    const stripe = stripeRef.current;
    const elements = elementsRef.current;

    if (!stripe || !elements) {
      setFormError('The card form is still loading. Give it a second, then try again.');
      return;
    }

    setIsPaying(true);

    try {
      const prepared = await prepareCheckout({
        paymentIntentId: intent.id,
        email: values.email.trim(),
        address: {
          name: values.name.trim(),
          line1: values.line1.trim(),
          line2: values.line2.trim() ? values.line2.trim() : null,
          city: values.city.trim(),
          state: values.state.trim().toUpperCase(),
          postal_code: values.postal_code.trim(),
          country: 'US'
        }
      });

      if (!prepared.ok) {
        setFieldErrors(prepared.fieldErrors ?? {});
        setFormError(prepared.error);
        return;
      }

      const submit = await elements.submit();
      if (submit.error) {
        setFormError(submit.error.message ?? 'Check the card details and try again.');
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/checkout/success',
          // The Payment Element hides the country field (fields...country:
          // 'never'), so Stripe requires the value here. The store ships to the
          // US only, and the shipping address above is US by construction.
          payment_method_data: {
            billing_details: {
              address: { country: 'US' }
            }
          }
        },
        redirect: 'if_required'
      });

      if (error) {
        setFormError(error.message ?? 'Payment failed. Try another card.');
        return;
      }

      if (
        paymentIntent &&
        (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')
      ) {
        router.push('/checkout/success?payment_intent=' + paymentIntent.id);
        return;
      }

      setFormError('The payment did not complete. Try again.');
    } catch (caught) {
      console.error('Checkout failed', caught);
      // Surface what actually failed. A blanket "check your connection" turned a
      // stale server-action bundle into an unsolvable mystery once already.
      const detail = caught instanceof Error && caught.message ? caught.message : null;
      setFormError(
        detail
          ? 'Payment could not be completed: ' + detail
          : 'Could not reach the payment service. Check your connection and try again.'
      );
    } finally {
      setIsPaying(false);
    }
  }

  const payableCents = intent?.totalCents ?? totalCents;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <section className="rounded-md border border-border bg-surface p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-text-primary">Contact</h2>
        <div className="mt-4">
          <Input
            label="Email"
            type="email"
            value={values.email}
            onChange={(event) => update('email', event.target.value)}
            error={fieldErrors.email}
            autoComplete="email"
            required
          />
        </div>
        <p className="mt-2 text-sm text-text-muted">Receipt and order updates go here.</p>
      </section>

      <section className="mt-4 rounded-md border border-border bg-surface p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-text-primary">Shipping address</h2>

        <div className="mt-4 space-y-4">
          <Input
            label="Recipient"
            value={values.name}
            onChange={(event) => update('name', event.target.value)}
            error={fieldErrors.name}
            autoComplete="name"
            required
          />

          <Input
            label="Street address"
            value={values.line1}
            onChange={(event) => update('line1', event.target.value)}
            error={fieldErrors.line1}
            autoComplete="address-line1"
            required
          />

          <Input
            label="Apartment, suite (optional)"
            value={values.line2}
            onChange={(event) => update('line2', event.target.value)}
            error={fieldErrors.line2}
            autoComplete="address-line2"
          />

          <Input
            label="City"
            value={values.city}
            onChange={(event) => update('city', event.target.value)}
            error={fieldErrors.city}
            autoComplete="address-level2"
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="State"
              value={values.state}
              onChange={(event) => update('state', event.target.value.toUpperCase())}
              error={fieldErrors.state}
              autoComplete="address-level1"
              maxLength={2}
              placeholder="CA"
              required
            />
            <Input
              label="Postcode"
              value={values.postal_code}
              onChange={(event) => update('postal_code', event.target.value)}
              error={fieldErrors.postal_code}
              autoComplete="postal-code"
              inputMode="numeric"
              placeholder="94110"
              required
            />
          </div>
        </div>

        <p className="mt-3 text-sm text-text-muted">Shipping within the United States only.</p>
      </section>

      <section className="mt-4 rounded-md border border-border bg-surface p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-text-primary">Payment</h2>

        {startError ? (
          <div className="mt-4 rounded-sm border border-error/40 bg-error/5 p-4">
            <p role="alert" className="text-sm text-error">
              {startError}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 text-sm font-medium text-text-primary underline underline-offset-4"
            >
              Reload the page
            </button>
          </div>
        ) : intent ? (
          <div className="mt-4">
            <Elements
              stripe={stripePromise}
              options={{ clientSecret: intent.clientSecret, appearance }}
            >
              <ElementsBridge onReady={handleReady} />
              <PaymentElement
                options={{
                  // The form above only collects US addresses. Without this,
                  // Stripe fills the country from the browser's locale — it read
                  // "Philippines" on a US account.
                  fields: { billingDetails: { address: { country: 'never' } } }
                }}
              />
            </Elements>
          </div>
        ) : (
          <div className="mt-4">
            <div className="h-11 rounded-sm border border-border bg-background" />
            <div className="mt-3 h-11 rounded-sm border border-border bg-background" />
            <p className="mt-3 text-sm text-text-muted">Loading secure payment fields…</p>
          </div>
        )}

        {formError ? (
          <p role="alert" className="mt-4 text-sm text-error">
            {formError}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="mt-6 w-full"
          isLoading={isPaying}
          disabled={!intent}
        >
          {isPaying ? 'Processing…' : 'Pay ' + formatPrice(payableCents)}
        </Button>

        <p className="mt-3 text-center text-sm text-text-muted">
          Card details are handled by Stripe — they never touch our server.
        </p>
      </section>

      <p className="mt-4 text-center text-sm">
        <Link
          href="/cart"
          className="font-medium text-text-muted underline-offset-4 transition-colors hover:text-text-primary hover:underline"
        >
          Back to cart
        </Link>
      </p>
    </form>
  );
}
