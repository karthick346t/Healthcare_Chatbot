import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
    patientId: mongoose.Types.ObjectId; // Optional: link to User if registered
    patientName: string; // If guest or just for display
    doctorId: mongoose.Types.ObjectId;
    type: 'Lab Report' | 'Prescription';
    title: string;
    description?: string;
    fileUrl: string; // URL to the file (could be AWS S3 or local static)
    date: Date;
}

const ReportSchema: Schema = new Schema({
    patientId: { type: Schema.Types.ObjectId, ref: 'User' },
    patientName: { type: String, required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    type: { type: String, enum: ['Lab Report', 'Prescription'], required: true },
    title: { type: String, required: true },
    description: { type: String },
    fileUrl: { type: String, required: true },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IReport>('Report', ReportSchema);
