'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import Bid from '@/models/Bid';
import { stripe, APP_URL } from '@/lib/stripe';

export interface SubmitBidInput {
  sponsorName: string;
  websiteUrl: string;
  message?: string;
  bidAmount: number;
}

export interface SubmitBidResult {
  success: boolean;
  bidId?: string;
  checkoutUrl?: string;
  error?: string;
}

/**
 * Server Action: persist a pending Bid, then create a real Stripe Checkout
 * Session and return its URL so the client can redirect the user.
 *
 * The Bid document's _id is passed to Stripe via `client_reference_id`,
 * which is then echoed back in the webhook so we can flip paymentStatus
 * to 'completed' when payment succeeds.
 */
export async function submitBid(
  input: SubmitBidInput,
): Promise<SubmitBidResult> {
  try {
    // 1. Defensive validation. Mongoose also validates, but failing fast with
    //    a clean message keeps the UX tight.
    if (!input || typeof input !== 'object') {
      return { success: false, error: 'Invalid payload' };
    }

    const sponsorName = (input.sponsorName ?? '').toString().trim();
    const websiteUrl = (input.websiteUrl ?? '').toString().trim();
    const message = (input.message ?? '').toString().trim();
    const bidAmount = Number(input.bidAmount);

    if (!sponsorName) {
      return { success: false, error: 'Sponsor name is required' };
    }
    if (!websiteUrl) {
      return { success: false, error: 'Website URL is required' };
    }
    if (message.length > 60) {
      return { success: false, error: 'Message cannot exceed 60 characters' };
    }
    if (!Number.isFinite(bidAmount) || bidAmount < 5) {
      return { success: false, error: 'Minimum bid is $5' };
    }

    // 2. Connect (cached) and create the Bid document with pending status.
    await connectDB();

    const created = await Bid.create({
      sponsorName,
      websiteUrl,
      message,
      bidAmount,
      paymentStatus: 'pending',
    });

    const bidIdString = created._id.toString();

    // 3. Create the real Stripe Checkout Session.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `ImpactRank Bid \u2014 ${sponsorName}`,
              description:
                message?.length
                  ? `${message} \u2022 90% goes to charity, 10% platform fee.`
                  : '90% goes to charity, 10% platform fee.',
            },
            // Stripe wants integer cents.
            unit_amount: Math.round(bidAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Echoed back to the webhook so we know which Bid to flip.
      client_reference_id: bidIdString,
      metadata: {
        bidId: bidIdString,
        sponsorName,
      },
      success_url: `${APP_URL}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/?canceled=true`,
    });

    revalidatePath('/');

    return {
      success: true,
      bidId: bidIdString,
      checkoutUrl: session.url as string,
    };
  } catch (err) {
    console.error('[submitBid] failed', err);
    const message =
      err instanceof Error ? err.message : 'Unexpected error submitting bid';
    return { success: false, error: message };
  }
}
