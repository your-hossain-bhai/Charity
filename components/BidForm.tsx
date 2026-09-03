'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Heart } from 'lucide-react';
import { submitBid } from '@/app/actions/submitBid';

interface BidFormProps {
  onSubmitted?: () => void;
}

export default function BidForm({ onSubmitted }: BidFormProps) {
  const [sponsorName, setSponsorName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [message, setMessage] = useState('');
  const [bidAmount, setBidAmount] = useState<number>(10);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const charityAmount = (bidAmount * 0.9).toFixed(2);
  const feeAmount = (bidAmount * 0.1).toFixed(2);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (bidAmount <= 0) {
      setError('Bid amount must be greater than 0');
      return;
    }

    startTransition(async () => {
      const result = await submitBid({
        sponsorName,
        websiteUrl,
        message,
        bidAmount,
      });

      if (!result.success) {
        setError(result.error ?? 'Could not submit your bid');
        return;
      }

      setSuccessMsg('Redirecting to secure checkout…');
      if (result.checkoutUrl) {
        // Hand off to Stripe Checkout. The webhook at /api/webhooks/stripe
        // will flip the Bid to 'completed' when payment succeeds.
        window.location.href = result.checkoutUrl;
        return;
      }

      // No URL means the server action succeeded but Stripe didn't return one
      // — refresh the message and reset the form anyway.
      setSuccessMsg('Bid recorded. Check your email to complete checkout.');
      setMessage('');
      onSubmitted?.();
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative rounded-2xl border border-border bg-surface/70 p-6 backdrop-blur-sm shadow-2xl"
    >
      <div className="mb-5 flex items-center gap-2">
        <div className="rounded-full bg-amber-400/10 p-2 text-amber-400">
          <Heart className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">
          Claim your rank
        </h2>
      </div>

      <p className="mb-5 text-sm text-muted">
        90% of your bid goes directly to charity. 10% keeps the lights on.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
            Sponsor / Brand name
          </label>
          <input
            type="text"
            required
            maxLength={60}
            value={sponsorName}
            onChange={(e) => setSponsorName(e.target.value)}
            placeholder="Acme Co."
            className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
            Website URL
          </label>
          <input
            type="url"
            required
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
            Message <span className="text-muted/60">(optional, max 60 chars)</span>
          </label>
          <input
            type="text"
            maxLength={60}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Fueled by kindness"
            className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30"
          />
          <div className="mt-1 text-right text-[10px] text-muted">
            {message.length}/60
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
            Bid amount (USD)
          </label>
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-amber-400">$</span>
            <input
              type="number"
              required
              min={5}
              step={1}
              value={bidAmount}
              onChange={(e) => setBidAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30"
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted">
            <span>
              To charity: <span className="text-emerald-400">${charityAmount}</span>
            </span>
            <span>
              Platform fee: <span className="text-muted">${feeAmount}</span>
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            {successMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="group relative flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            <>Submit bid & checkout</>
          )}
        </button>
      </form>
    </motion.div>
  );
}
