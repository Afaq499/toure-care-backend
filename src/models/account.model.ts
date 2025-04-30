import mongoose, { Document, Schema } from 'mongoose';

export interface IAccount extends Document {
  userId: string;
  fullName: string;
  cryptoAddress: string;
  network: 'TRC20' | 'ERC20' | 'BTC';
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const accountSchema = new Schema<IAccount>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User'
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    cryptoAddress: {
      type: String,
      required: true,
      trim: true
    },
    network: {
      type: String,
      enum: ['TRC20', 'ERC20', 'BTC'],
      required: true
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Create a compound index to ensure one account per user
accountSchema.index({ userId: 1 }, { unique: true });

export default mongoose.model<IAccount>('Account', accountSchema); 