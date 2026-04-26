import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  method: string;
  path: string;
  status?: number;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  method: { type: String, required: true },
  path: { type: String, required: true },
  status: { type: Number },
  ip: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
});

AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ method: 1, timestamp: -1 });

export default mongoose.models['AuditLog'] || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

