import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
    name: string;
    specialty: string;
    hospitalId: mongoose.Types.ObjectId;
    bio: string;
    image?: string;
    availability: string[]; // e.g. ["Mon", "Tue", "Wed"]
    blockedSlots?: { date: Date, startTime: string, endTime: string, reason: string }[];
}

const DoctorSchema: Schema = new Schema({
    name: { type: String, required: true },
    specialty: { type: String, required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    bio: { type: String, required: true },
    image: { type: String },
    availability: { type: [String], default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    blockedSlots: [{
        date: { type: Date, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        reason: { type: String, required: true }
    }]
}, { timestamps: true });

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);
