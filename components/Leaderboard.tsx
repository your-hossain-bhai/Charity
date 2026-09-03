'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Medal } from 'lucide-react';
import type { IBid } from '@/models/Bid';
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  bids: IBid[];
}

const PODIUM_STYLES: Record<
  number,
  { ring: string; text: string; iconColor: string; size: string }
> = {
  1: {
    ring: 'border-amber-400/60 shadow-[0_0_40px_-10px_rgba(250,204,21,0.45)]',
    text: 'text-amber-300',
    iconColor: 'text-amber-400',
    size: 'text-2xl md:text-3xl',
  },
  2: {
    ring: 'border-slate-300/40',
    text: 'text-slate-200',
    iconColor: 'text-slate-300',
    size: 'text-xl md:text-2xl',
  },
  3: {
    ring: 'border-orange-700/50',
    text: 'text-orange-400',
    iconColor: 'text-orange-500',
    size: 'text-lg md:text-xl',
  },
};

function formatUrl(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export default function Leaderboard({ bids }: LeaderboardProps) {
  if (bids.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/30 p-12 text-center">
        <p className="text-sm text-muted">
          No bids yet. Be the first to claim the #1 spot.
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      <AnimatePresence initial={false}>
        {bids.map((bid, idx) => {
          const rank = idx + 1;
          const podium = PODIUM_STYLES[rank];

          return (
            <motion.li
              key={String(bid._id)}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 28,
                mass: 0.6,
              }}
              className={cn(
                'group relative flex items-center justify-between gap-4 rounded-xl border bg-surface/60 px-4 py-3 backdrop-blur-sm transition',
                podium
                  ? `${podium.ring} bg-gradient-to-r from-surface/80 to-surface/40`
                  : 'border-border hover:border-border/80 hover:bg-surface/80',
              )}
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex w-10 shrink-0 items-center justify-center">
                  {rank === 1 ? (
                    <Crown
                      className={cn('h-6 w-6', podium?.iconColor)}
                      aria-label="First place"
                    />
                  ) : rank === 2 || rank === 3 ? (
                    <Medal
                      className={cn('h-5 w-5', podium?.iconColor)}
                      aria-label={`${rank === 2 ? 'Second' : 'Third'} place`}
                    />
                  ) : (
                    <span className="font-mono text-sm text-muted">
                      #{rank}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        'truncate font-semibold tracking-tight',
                        podium ? podium.size : 'text-base',
                      )}
                    >
                      {bid.sponsorName}
                    </span>
                  </div>
                  <a
                    href={
                      bid.websiteUrl.startsWith('http')
                        ? bid.websiteUrl
                        : `https://${bid.websiteUrl}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block max-w-full truncate text-xs text-muted hover:text-white"
                  >
                    {formatUrl(bid.websiteUrl)}
                  </a>
                  {bid.message && (
                    <p className="mt-1 line-clamp-1 text-xs italic text-muted/80">
                      “{bid.message}”
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div
                  className={cn(
                    'font-mono font-semibold tabular-nums',
                    podium ? `${podium.size} ${podium.text}` : 'text-base text-white',
                  )}
                >
                  ${bid.bidAmount.toLocaleString()}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-400/80">
                  ${(bid.bidAmount * 0.9).toFixed(2)} to charity
                </div>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
}