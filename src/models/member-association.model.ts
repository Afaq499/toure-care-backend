import mongoose, { Document, Schema } from 'mongoose';

export interface IMemberAssociation extends Document {
  memberId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  status: 'active' | 'inactive';
  joinedAt: Date;
  lastActiveAt: Date;
  commissionRate: number;
  totalCommissionEarned: number;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

const memberAssociationSchema = new Schema<IMemberAssociation>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    commissionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalCommissionEarned: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for memberId and agentId
memberAssociationSchema.index({ memberId: 1, agentId: 1 }, { unique: true });

// Create index for agentId to optimize queries
memberAssociationSchema.index({ agentId: 1 });

export default mongoose.model<IMemberAssociation>('MemberAssociation', memberAssociationSchema); 