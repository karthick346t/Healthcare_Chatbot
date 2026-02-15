import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
    name: string;
    specialty: string;
    hospitalId: mongoose.Types.ObjectId;
    bio: string;
    image?: string;
    availability: string[]; // e.g. ["Mon", "Tue", "Wed"]
}

const DoctorSchema: Schema = new Schema({
    name: { type: String, required: true },
    specialty: { type: String, required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    bio: { type: String, required: true },
    image: { type: String },
    availability: { type: [String], default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }
}, { timestamps: true });

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);
