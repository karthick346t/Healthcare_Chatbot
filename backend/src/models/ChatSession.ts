import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachmentUrl?: string; // ✅ Added to store S3 URL
}

export interface IChatSession extends Document {
  sessionId: string;
  userId?: string;
  messages: IMessage[];
  lastUpdated: Date;
  locale?: string; // Added based on earlier context
}

const ChatSessionSchema: Schema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true }, // ✅ Required & Indexed
  messages: [
    {
      role: { type: String, enum: ['user', 'assistant'], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      attachmentUrl: { type: String }
    },
  ],
  lastUpdated: { type: Date, default: Date.now },
  locale: { type: String, default: 'en' }
});

export default mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);