import mongoose, { Schema, Document, CallbackWithoutResultAndOptionalError } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    googleId?: string;
    avatar?: string;
    role: 'patient' | 'admin';
    phone?: string;
    gender?: 'Male' | 'Female' | 'Other';
    dateOfBirth?: Date;
    bloodGroup?: string;
    address?: string;
    allergies?: string[];
    chronicConditions?: string[];
    emergencyContact?: {
        name: string;
        phone: string;
        relation: string;
    };
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            minlength: 6,
            select: false, // Don't include password in queries by default
        },
        googleId: {
            type: String,
            sparse: true,
        },
        avatar: {
            type: String,
        },
        role: {
            type: String,
            enum: ['patient', 'admin', 'staff'],
            default: 'patient',
        },
        phone: { type: String, trim: true },
        gender: { type: String, enum: ['Male', 'Female', 'Other'] },
        dateOfBirth: { type: Date },
        bloodGroup: { type: String },
        address: { type: String },
        allergies: { type: [String], default: [] },
        chronicConditions: { type: [String], default: [] },
        emergencyContact: {
            name: String,
            phone: String,
            relation: String
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
