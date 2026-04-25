import mongoose, { Document, Schema } from 'mongoose';

export interface IChatLog extends Document {
  sessionId: string;
  userId: string;
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
  userId: { type: String, required: true },
  request: { type: String, required: true },
  response: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  ragStats: {
    retrievedChunks: Number,
    confidence: String,
    latencyMs: Number,
  },
});

export default mongoose.model<IChatLog>('ChatLog', ChatLogSchema);