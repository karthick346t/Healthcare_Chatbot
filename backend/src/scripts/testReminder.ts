import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Appointment from '../models/Appointment';
import Hospital from '../models/Hospital';
import Doctor from '../models/Doctor';
import User from '../models/User';
import { notificationService } from '../services/notificationService';

dotenv.config();

async function testReminder() {
    console.log("🧪 Starting Reminder Verification Script...");
    
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/healthbot");
        console.log("✅ Connected to MongoDB");

        // 1. Resolve a test user with an actual email address
        // We look for any user that has an email field populated.
        let user = await User.findOne({ email: { $exists: true, $ne: "" } });
        if (!user) {
            console.error("❌ No user with email found to test. Skipping automated verification.");
            return;
        }
        console.log(`👤 Found test target user: ${user.name} (${user.email})`);

        // 2. Fetch dependencies
        let hospital = await Hospital.findOne();
        let doctor = await Doctor.findOne();

        // 3. Create a dummy appointment for 'tomorrow' to test the logic
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);

        const testAppt = new Appointment({
            patientName: user.name,
            patientAge: 25,
            patientGender: "Test",
            patientAddress: "Verification Suite",
            problem: "Automated Reminder Test",
            hospitalId: hospital?._id || new mongoose.Types.ObjectId(),
            doctorId: doctor?._id || new mongoose.Types.ObjectId(),
            appointmentDate: tomorrow,
            tokenNumber: 777,
            status: 'scheduled',
            paymentStatus: 'paid',
            userId: user._id,
            reminderSent: false
        });

        await testAppt.save();
        console.log(`📅 Created temporary test appointment for tomorrow: ${testAppt._id}`);

        // 4. Manually trigger the notification service (simulating the cron job)
        console.log("📨 Sending professional reminder email...");
        
        await notificationService.sendAppointmentReminder(user.email, {
            patientName: testAppt.patientName,
            doctorName: doctor?.name || 'NEXA Specialist',
            appointmentDate: testAppt.appointmentDate,
            hospitalName: hospital?.name || 'NEXA Healthcare Center',
            tokenNumber: testAppt.tokenNumber
        });

        // 5. Update the reminderSent flag just like the real job would
        testAppt.reminderSent = true;
        await testAppt.save();
        console.log("✅ DB Updated: reminderSent set to true.");

        console.log("\n✨ Reminder system verification successful.");
        console.log("📧 Check the recipient inbox for the NEXA Appointment Reminder.");
        
    } catch (error) {
        console.error("❌ Verification failed:", error);
    } finally {
        await mongoose.disconnect();
    }
}

testReminder();
