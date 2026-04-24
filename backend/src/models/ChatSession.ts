import mongoose, { Schema, Document } from 'mongoose';
import { fieldEncryption } from 'mongoose-field-encryption';
import config from '../config';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachmentUrl?: string; // ✅ Added to store S3 URL
}

export interface IDocumentEntry {
  fileId: string;
  originalName: string;
  fileType?: string;
  summary: string;
  extractedText?: string;
  attachmentUrl?: string;
  createdAt: Date;
}

export interface IChatSession extends Document {
  sessionId: string;
  userId?: string;
  messages: IMessage[];
  documents?: IDocumentEntry[];
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
  documents: [
    {
      fileId: { type: String, required: true },
      originalName: { type: String, required: true },
      fileType: { type: String },
      summary: { type: String, required: true },
      extractedText: { type: String },
      attachmentUrl: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  lastUpdated: { type: Date, default: Date.now },
  locale: { type: String, default: 'en' }
});

ChatSessionSchema.index({ sessionId: 1, userId: 1 });

if (process.env.ENCRYPTION_KEY) {
  ChatSessionSchema.plugin(fieldEncryption, {
    fields: ['messages'],
    secret: process.env.ENCRYPTION_KEY,
  });
}

export default mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);