
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/healthbot";

async function makeAdmin(email: string) {
    if (!email) {
        console.error("Please provide an email address.");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        const user = await User.findOne({ email });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();

        console.log(`✅ Successfully promoted ${user.name} (${user.email}) to Admin.`);
    } catch (error) {
        console.error("Error updating user:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

const email = process.argv[2];
makeAdmin(email);
