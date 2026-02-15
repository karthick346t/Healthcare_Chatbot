import mongoose, { Schema, Document } from 'mongoose';

export interface IHospital extends Document {
    name: string;
    location: string;
    district: string;
    image: string;
    description: string;
    specialties: string[];
}

const HospitalSchema: Schema = new Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    district: { type: String, required: true },
    image: { type: String },
    description: { type: String, required: true },
    specialties: { type: [String], default: [] }
}, { timestamps: true });

export default mongoose.model<IHospital>('Hospital', HospitalSchema);
