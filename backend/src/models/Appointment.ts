import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
    patientName: string;
    patientAge: number;
    patientGender: string;
    patientAddress: string;
    problem: string;
    hospitalId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    appointmentDate: Date;
    tokenNumber: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    userId?: mongoose.Types.ObjectId; // Link to User model
}

const AppointmentSchema: Schema = new Schema({
    patientName: { type: String, required: true },
    patientAge: { type: Number, required: true },
    patientGender: { type: String, required: true },
    patientAddress: { type: String, required: true },
    problem: { type: String, required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointmentDate: { type: Date, required: true },
    tokenNumber: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'confirmed' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' } // Optional for guest bookings, but we'll use it for logged-in users
}, { timestamps: true });

// Ensure a patient can't take multiple tokens for same doctor on same day (optional, but good for demo)
// AppointmentSchema.index({ patientName: 1, doctorId: 1, appointmentDate: 1 }, { unique: true });

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);
