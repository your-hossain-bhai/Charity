import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import connectDB from '@/lib/mongodb';
import Bid from '@/models/Bid';

// Stripe needs the *raw* body to verify the signature, so disable Next's
// automatic JSON parsing on this route.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe webhook] STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 },
    );
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 },
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid signature';
    console.error('[stripe webhook] signature verification failed', msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    await connectDB();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const bidId =
          session.client_reference_id ||
          (session.metadata?.bidId as string | undefined);

        if (!bidId) {
          console.warn(
            '[stripe webhook] checkout.session.completed without client_reference_id',
            session.id,
          );
          break;
        }

        const update = await Bid.findByIdAndUpdate(
          bidId,
          {
            paymentStatus: 'completed',
            $set: { stripeSessionId: session.id },
          },
          { new: true },
        ).exec();

        if (!update) {
          console.warn(
            '[stripe webhook] no Bid found for id',
            bidId,
            '(session',
            session.id,
            ')',
          );
        }
        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const bidId =
          session.client_reference_id ||
          (session.metadata?.bidId as string | undefined);

        if (bidId) {
          // We don't have a 'failed' status in the enum; leave the Bid as
          // 'pending' so a future retry / manual admin flip can promote it.
          // The Bid simply won't show on the leaderboard.
          // `$set` + `$unset` can't be mixed with raw field writes in Mongoose
          // (throws MixedUpdateError), so all field changes must be operator-
          // wrapped inside a single update document.
          await Bid.findByIdAndUpdate(bidId, {
            $set: { paymentStatus: 'pending' },
            $unset: { stripeSessionId: '' },
          }).exec();
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          (typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id) || undefined;

        // Refunds should pull the bid off the leaderboard. We stored
        // stripeSessionId (Checkout Session id) at completion time, so we
        // look the session up by payment_intent and match on that.
        if (paymentIntentId) {
          const sessions = await stripe.checkout.sessions.list({
            payment_intent: paymentIntentId,
            limit: 1,
          });
          const session = sessions.data[0];
          if (session?.id) {
            await Bid.findOneAndUpdate(
              { stripeSessionId: session.id },
              {
                $set: { paymentStatus: 'pending' },
                $unset: { stripeSessionId: '' },
              },
            ).exec();
          }
        }
        break;
      }

      default:
        // Acknowledge unhandled event types so Stripe doesn't retry forever.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[stripe webhook] handler error', err);
    // Return 500 so Stripe retries — better than silently dropping events.
    return NextResponse.json(
      { error: 'Handler error' },
      { status: 500 },
    );
  }
}