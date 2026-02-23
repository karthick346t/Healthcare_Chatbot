import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare';

const run = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const existingStaff = await User.findOne({ email: 'staff@example.com' });
        if (existingStaff) {
            console.log('Staff user already exists!');
            process.exit(0);
        }

        const staffUser = new User({
            name: 'Reception Desk',
            email: 'staff@example.com',
            password: 'password123',
            role: 'staff',
            phone: '1234567890'
        });

        await staffUser.save();
        console.log('Successfully created test staff user: staff@example.com / password123');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
