import cron from 'node-cron';
import Appointment from '../models/Appointment';
import User from '../models/User';
import { notificationService } from './notificationService';

/**
 * Initializes the background task for sending appointment reminders.
 * Task runs daily at 9:00 AM.
 */
export const initReminderCron = () => {
    // Cron expression: 0 0 9 * * * (At 09:00 AM every day)
    cron.schedule('0 0 9 * * *', async () => {
        console.log('⏰ Running daily appointment reminder task...');
        
        try {
            // 1. Calculate the 'tomorrow' date range
            const tomorrowStart = new Date();
            tomorrowStart.setDate(tomorrowStart.getDate() + 1);
            tomorrowStart.setHours(0, 0, 0, 0);

            const tomorrowEnd = new Date(tomorrowStart);
            tomorrowEnd.setHours(23, 59, 59, 999);

            // 2. Find scheduled appointments for tomorrow that haven't received a reminder yet
            const upcomingAppointments = await Appointment.find({
                appointmentDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
                status: 'scheduled',
                reminderSent: false
            })
            .populate('hospitalId', 'name')
            .populate('doctorId', 'name');

            if (upcomingAppointments.length === 0) {
                console.log('ℹ️ No appointments found requiring reminders for tomorrow.');
                return;
            }

            console.log(`🔍 Found ${upcomingAppointments.length} appointments requiring reminders.`);

            for (const appt of upcomingAppointments) {
                try {
                    // Resolve patient email (from User model)
                    let email = "";
                    if (appt.userId) {
                        const user = await User.findById(appt.userId);
                        if (user && user.email) email = user.email;
                    }

                    if (email) {
                        const hospital = appt.hospitalId as any;
                        const doctor = appt.doctorId as any;

                        // Send the reminder email using the notification service
                        await notificationService.sendAppointmentReminder(email, {
                            patientName: appt.patientName,
                            doctorName: doctor?.name || 'Your Doctor',
                            appointmentDate: appt.appointmentDate,
                            hospitalName: hospital?.name || 'NEXA Clinic',
                            tokenNumber: appt.tokenNumber
                        });

                        // 3. Update the database to reflect that the reminder was successfully sent
                        appt.reminderSent = true;
                        await appt.save();
                        console.log(`✅ Reminder successfully sent to ${email} for appointment ${appt._id}`);
                    } else {
                        console.warn(`⚠️ Skipping reminder for appointment ${appt._id}: No email address found for the user.`);
                    }
                } catch (err) {
                    console.error(`❌ Failed to send reminder for appointment ${appt._id}:`, err);
                }
            }
            
            console.log('✅ Daily reminder task completed.');
        } catch (error) {
            console.error('❌ Critical error in reminder cron task:', error);
        }
    });

    console.log('🚀 Appointment reminder cron job scheduled (Daily at 9:00 AM).');
};
