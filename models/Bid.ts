import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaymentStatus = 'pending' | 'completed';

export interface IBid extends Document {
  sponsorName: string;
  websiteUrl: string;
  message?: string;
  bidAmount: number;
  paymentStatus: PaymentStatus;
  stripeSessionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const BidSchema: Schema<IBid> = new Schema<IBid>(
  {
    sponsorName: {
      type: String,
      required: [true, 'Sponsor name is required'],
      trim: true,
      maxlength: 60,
    },
    websiteUrl: {
      type: String,
      required: [true, 'Website URL is required'],
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return false;
          // Accept with or without protocol; require a dot in the host.
          const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[^\s]*)?$/i;
          return urlPattern.test(v);
        },
        message: 'Please provide a valid website URL',
      },
    },
    message: {
      type: String,
      trim: true,
      maxlength: [60, 'Message cannot exceed 60 characters'],
      default: '',
    },
    bidAmount: {
      type: Number,
      required: [true, 'Bid amount is required'],
      min: [5, 'Minimum bid is $5'],
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: {
        values: ['pending', 'completed'] as PaymentStatus[],
        message: '{VALUE} is not a supported payment status',
      },
      default: 'pending',
      index: true,
    },
    stripeSessionId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Guard against model overwrite on hot reload (Next dev) and on serverless
 * re-instantiation. Mongoose throws a `OverwriteModelError` otherwise.
 */
const Bid: Model<IBid> =
  (mongoose.models.Bid as Model<IBid>) ||
  mongoose.model<IBid>('Bid', BidSchema);

export default Bid;