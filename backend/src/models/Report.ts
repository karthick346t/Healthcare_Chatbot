import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
    patientId: mongoose.Types.ObjectId;
    patientName: string;
    doctorId: mongoose.Types.ObjectId;
    type: 'Lab Report' | 'Prescription' | 'Radiology' | 'Vaccination' | 'Clinical Note' | 'Other';
    category: 'General' | 'Blood Work' | 'Imaging' | 'Medication' | 'Emergency' | 'Routine' | 'Vaccination';
    title: string;
    description?: string;
    insight?: string; // Short AI-generated or manually added insight (e.g. "Vitamin D low")
    tags: string[];
    status: 'Normal' | 'Abnormal' | 'Critical' | 'Pending Review';
    fileUrl: string;
    date: Date;
}

const ReportSchema: Schema = new Schema({
    patientId: { type: Schema.Types.ObjectId, ref: 'User' },
    patientName: { type: String, required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor' },
    type: { 
        type: String, 
        enum: ['Lab Report', 'Prescription', 'Radiology', 'Vaccination', 'Clinical Note', 'Other'], 
        required: true 
    },
    category: {
        type: String,
        enum: ['General', 'Blood Work', 'Imaging', 'Medication', 'Emergency', 'Routine', 'Vaccination'],
        default: 'General'
    },
    title: { type: String, required: true },
    description: { type: String },
    insight: { type: String },
    tags: { type: [String], default: [] },
    status: {
        type: String,
        enum: ['Normal', 'Abnormal', 'Critical', 'Pending Review'],
        default: 'Normal'
    },
    fileUrl: { type: String, required: true },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IReport>('Report', ReportSchema);
