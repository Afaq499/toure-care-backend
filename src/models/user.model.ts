import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user' | 'agent';
  parentId: string;
  mobileNumber: string;
  balance: number;
  dailyAvailableOrders: number;
  todaysOrders: number;
  todaysCommission: number;
  reputation: number;
  parentUser: string;
  invitationCode: string;
  status: boolean;
  frozenAmount: number;
  allowWithdrawal: 'allowed' | 'not_allowed';
  withdrawalMinAmount: number;
  withdrawalMaxAmount: number;
  totalEarnings: number;
  todaysEarnings: number;
  lastEarningDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      unique: false
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'agent'],
      default: 'user',
    },
    parentId: {
      type: String,
      default: '0'
    },
    mobileNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    balance: {
      type: Number,
      default: 0
    },
    dailyAvailableOrders: {
      type: Number,
      default: 40
    },
    todaysOrders: {
      type: Number,
      default: 0
    },
    todaysCommission: {
      type: Number,
      default: 0
    },
    reputation: {
      type: Number,
      default: 100
    },
    parentUser: {
      type: String,
      default: 'system'
    },
    invitationCode: {
      type: String,
      unique: true,
      sparse: true
    },
    status: {
      type: Boolean,
      default: true
    },
    frozenAmount: {
      type: Number,
      default: 0
    },
    allowWithdrawal: {
      type: String,
      enum: ['allowed', 'blocked'],
      default: 'allowed'
    },
    withdrawalMinAmount: {
      type: Number,
      default: 0
    },
    withdrawalMaxAmount: {
      type: Number,
      default: 1000000
    },
    totalEarnings: { type: Number, default: 0 },
    todaysEarnings: { type: Number, default: 0 },
    lastEarningDate: { type: Date }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', userSchema); 