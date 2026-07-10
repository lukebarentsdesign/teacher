import Stripe from "stripe";

let cachedClient: Stripe | null = null;

/**
 * Lazily constructed so an empty/missing STRIPE_SECRET_KEY doesn't crash the build — the
 * Stripe SDK throws immediately in its constructor if the key is falsy, and Next.js needs to
 * import this module (via the webhook route) during `next build`'s page-data collection even
 * before real keys are configured.
 */
export function getStripeClient(): Stripe {
  if (!cachedClient) {
    cachedClient = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
      apiVersion: "2026-06-24.dahlia",
    });
  }
  return cachedClient;
}

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripeClient()[prop as keyof Stripe];
  },
});

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
