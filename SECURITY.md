# Security Policy

## Reporting a vulnerability

If you find a security issue in ImpactRank, please email the maintainer
directly instead of opening a public GitHub issue. Include steps to reproduce.

## Secrets handling

This project uses the following secrets:

| Variable | Where to set | Where NOT to set |
|---|---|---|
| `STRIPE_SECRET_KEY` | `.env.local` (dev), Vercel env vars (prod) | Anywhere it can be logged or shared |
| `STRIPE_WEBHOOK_SECRET` | `.env.local`, Vercel env vars | Same as above |
| `MONGODB_URI` | `.env.local`, Vercel env vars | Same as above |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Same as above | This one is safe in client code, but the others are not |

### Rules of thumb

1. **Never paste a `sk_…` key, `whsec_…` secret, or connection string into a chat, GitHub issue, screenshot, or AI assistant.** Treat the pasted value as compromised and roll it immediately.
2. **Never commit `.env.local`** — it is gitignored for a reason.
3. **Rotate on personnel changes.** When someone with access leaves the team, rotate every secret they touched.
4. **Use Stripe Restricted Keys** for production deployments — limit each key to the specific resources it needs (e.g. `checkout.sessions:write` only).

### Rolling a Stripe key

1. Stripe Dashboard → Developers → API keys.
2. Click the **⋯** menu next to the leaked key → **Roll** (or **Delete** + create a new one).
3. Update `.env.local` and your Vercel project's environment variables.
4. Trigger a redeploy so the new key is loaded by serverless functions.

### Rolling a webhook signing secret

1. Stripe Dashboard → Developers → Webhooks → click your endpoint → **Roll secret**.
2. Update `STRIPE_WEBHOOK_SECRET` in `.env.local` and Vercel.
3. Redeploy.