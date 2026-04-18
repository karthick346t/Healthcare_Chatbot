import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  messageId?: string; // Optional if we don't have explicit message IDs yet
  sessionId: string;
  userId?: string;
  rating: number; // 1 for thumbs up, -1 for thumbs down
  timestamp: Date;
}

const FeedbackSchema: Schema = new Schema({
  messageId: { type: String },
  sessionId: { type: String, required: true },
  userId: { type: String, index: true },
  rating: { type: Number, required: true, enum: [1, -1] },
  timestamp: { type: Date, default: Date.now }
});

FeedbackSchema.index({ sessionId: 1, userId: 1 });

export default mongoose.model<IFeedback>('Feedback', FeedbackSchema);
