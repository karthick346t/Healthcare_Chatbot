import mongoose, { Document, Schema } from 'mongoose';

export interface IChatLog extends Document {
  sessionId: string;
  userId?: mongoose.Types.ObjectId;
  request: string;
  response: string;
  timestamp: Date;
  ragStats?: {
    retrievedChunks: number;
    confidence: string;
    latencyMs: number;
  };
}

const ChatLogSchema = new Schema<IChatLog>({
  sessionId: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  request: { type: String, required: true },
  response: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  ragStats: {
    retrievedChunks: Number,
    confidence: String,
    latencyMs: Number,
  },
});

ChatLogSchema.index({ sessionId: 1, userId: 1, timestamp: -1 });
ChatLogSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model<IChatLog>('ChatLog', ChatLogSchema);