import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'pending' | 'completed';
  productPrice: number;
  result?: any;
  createdAt: Date;
  updatedAt: Date;
  rating?: number;
  review?: string;
  completedAt?: Date;
  isEdited: boolean;
}

const taskSchema = new Schema<ITask>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  productPrice: {
    type: Number,
    required: true
  },
  result: {
    type: Schema.Types.Mixed
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String
  },
  completedAt: {
    type: Date
  },
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model<ITask>('Task', taskSchema); 