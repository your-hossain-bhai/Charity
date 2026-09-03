import { Suspense } from 'react';
import Leaderboard from '@/components/Leaderboard';
import BidForm from '@/components/BidForm';
import connectDB from '@/lib/mongodb';
import Bid, { type IBid } from '@/models/Bid';
import { Trophy, Heart } from 'lucide-react';

// Always render dynamically so a freshly-completed bid shows up without a rebuild.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getCompletedBids(): Promise<IBid[]> {
  await connectDB();
  const docs = await Bid.find({ paymentStatus: 'completed' })
    .sort({ bidAmount: -1, createdAt: -1 })
    .limit(100)
    .lean<IBid[]>()
    .exec();
  return docs;
}

export default async function Page() {
  const bids = await getCompletedBids();
  const totalRaised = bids.reduce((sum, b) => sum + (b.bidAmount || 0), 0);
  const toCharity = totalRaised * 0.9;

  return (
    <main className="bg-grid relative isolate min-h-screen overflow-hidden">
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <header className="mb-10 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-400/10 p-2 text-amber-400">
              <Trophy className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              ImpactRank
            </h1>
            <span className="ml-2 rounded-full border border-border bg-surface/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
              Live
            </span>
          </div>
          <p className="max-w-2xl text-sm text-muted">
            Bid to climb the board. The higher you rank, the louder your
            brand. <span className="text-emerald-400">90% of every bid</span>{' '}
            is donated to charity.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Stat label="Total raised" value={`$${totalRaised.toFixed(2)}`} />
            <Stat
              label="To charity"
              value={`$${toCharity.toFixed(2)}`}
              accent="emerald"
              icon={<Heart className="h-3.5 w-3.5" />}
            />
            <Stat label="Sponsors live" value={String(bids.length)} />
          </div>
        </header>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* LEFT: leaderboard */}
          <section className="lg:col-span-2">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-xl font-semibold tracking-tight">
                Leaderboard
              </h2>
              <span className="text-xs text-muted">Sorted by bid amount</span>
            </div>

            <Suspense fallback={<LeaderboardSkeleton />}>
              <Leaderboard bids={bids} />
            </Suspense>
          </section>

          {/* RIGHT: form */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <BidForm />
            <p className="mt-3 px-2 text-[11px] leading-relaxed text-muted">
              Bids enter the board only after payment is confirmed by Stripe.
              The top spot is contested in real time.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent?: 'emerald';
  icon?: React.ReactNode;
}) {
  const tone =
    accent === 'emerald' ? 'text-emerald-400' : 'text-amber-400';
  return (
    <div className="rounded-xl border border-border bg-surface/60 px-4 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
        {icon}
        {label}
      </div>
      <div className={`mt-0.5 text-lg font-semibold ${tone}`}>{value}</div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-xl border border-border bg-surface/40"
        />
      ))}
    </div>
  );
}