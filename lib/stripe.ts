import Stripe from 'stripe';

/**
 * Singleton Stripe client.
 *
 * Reusing one instance across serverless invocations avoids the small but real
 * cost of re-reading the secret + re-initializing the HTTP agent on every
 * cold start. The global cache also survives Next.js hot reloads in dev.
 */
declare global {
  // eslint-disable-next-line no-var
  var stripeClient: Stripe | undefined;
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  throw new Error(
    'Please define STRIPE_SECRET_KEY in your .env.local (sk_test_... or sk_live_...)',
  );
}

export const stripe: Stripe =
  global.stripeClient ??
  (global.stripeClient = new Stripe(STRIPE_SECRET_KEY, {
    // Pin the API version so a future SDK upgrade doesn't silently change
    // request/response shapes on a deployed Vercel build.
    // (Omitted intentionally — the SDK ships with 2026-08-26.dahlia; pinning
    //  an older version forces a downgrade that isn't installed.)
    typescript: true,
    appInfo: {
      name: 'ImpactRank',
      version: '0.1.0',
    },
  }));

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';