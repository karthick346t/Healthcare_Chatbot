import nodemailer from 'nodemailer';

// Configure the transporter
// User needs to add these to .env:
// EMAIL_USER=your-email@gmail.com
// EMAIL_PASS=your-app-password
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your preferred service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const notificationService = {
    sendAppointmentConfirmation: async (email: string, appointmentDetails: any) => {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("Email credentials missing in .env. Skipping email notification.");
            return;
        }

        const mailOptions = {
            from: `"NEXA Healthcare" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Appointment Confirmation - NEXA Healthcare',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee;">
                        <h1 style="color: #06b6d4; margin: 0;">NEXA Healthcare</h1>
                        <p style="color: #666;">Premium Care, Anytime, Anywhere</p>
                    </div>
                    
                    <div style="padding: 20px 0;">
                        <h2 style="color: #333;">Appointment Confirmed!</h2>
                        <p>Dear <strong>${appointmentDetails.patientName}</strong>,</p>
                        <p>Your appointment has been successfully booked. Here are the details:</p>
                        
                        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <p style="margin: 5px 0;"><strong>Doctor:</strong> ${appointmentDetails.doctorName || 'Assigned Doctor'}</p>
                            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(appointmentDetails.appointmentDate).toLocaleDateString()}</p>
                            <p style="margin: 5px 0;"><strong>Time:</strong> ${appointmentDetails.timeSlot || '10:00 AM'}</p>
                            <p style="margin: 5px 0;"><strong>Location:</strong> ${appointmentDetails.hospitalName || 'Main Clinic'}</p>
                        </div>

                        <p>Please arrive 15 minutes before your scheduled time.</p>
                    </div>

                    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px;">
                        <p>&copy; ${new Date().getFullYear()} NEXA Healthcare. All rights reserved.</p>
                    </div>
                </div>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Confirmation email sent to ${email}`);
        } catch (error) {
            console.error("Error sending email:", error);
        }
    },
    sendAppointmentCancellation: async (email: string, appointmentDetails: any) => {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("Email credentials missing in .env. Skipping email notification.");
            return;
        }

        const mailOptions = {
            from: `"NEXA Healthcare" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Appointment Cancellation - NEXA Healthcare',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee;">
                        <h1 style="color: #ef4444; margin: 0;">NEXA Healthcare</h1>
                        <p style="color: #666;">Appointment Cancelled</p>
                    </div>
                    
                    <div style="padding: 20px 0;">
                        <h2 style="color: #333;">Appointment Cancellation Confirmed</h2>
                        <p>Dear <strong>${appointmentDetails.patientName}</strong>,</p>
                        <p>Your appointment has been successfully cancelled as requested.</p>
                        
                        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #fee2e2;">
                            <p style="margin: 5px 0;"><strong>Doctor:</strong> ${appointmentDetails.doctorName || 'Assigned Doctor'}</p>
                            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(appointmentDetails.appointmentDate).toLocaleDateString()}</p>
                            <p style="margin: 5px 0;"><strong>Hospital:</strong> ${appointmentDetails.hospitalName || 'Main Clinic'}</p>
                        </div>

                        <p>If this was a mistake, please book a new appointment or contact support.</p>
                    </div>

                    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px;">
                        <p>&copy; ${new Date().getFullYear()} NEXA Healthcare. All rights reserved.</p>
                    </div>
                </div>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Cancellation email sent to ${email}`);
        } catch (error) {
            console.error("Error sending cancellation email:", error);
        }
    },
    sendAppointmentReminder: async (email: string, appointmentDetails: any) => {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("Email credentials missing in .env. Skipping reminder email.");
            return;
        }

        const mailOptions = {
            from: `"NEXA Healthcare" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reminder: Your Appointment at NEXA Healthcare Tomorrow',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <div style="text-align: center; padding-bottom: 25px; border-bottom: 2px solid #f8fafc;">
                        <h1 style="color: #0891b2; margin: 0; font-size: 28px; letter-spacing: -0.5px;">NEXA <span style="font-weight: 300; color: #64748b;">HEALTHCARE</span></h1>
                        <p style="color: #64748b; margin: 5px 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Appointment Reminder</p>
                    </div>
                    
                    <div style="padding: 30px 0;">
                        <h2 style="color: #1e293b; margin: 0 0 15px; font-size: 22px;">Hello ${appointmentDetails.patientName},</h2>
                        <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">This is a friendly reminder that you have an appointment scheduled for <strong>tomorrow</strong>. We look forward to seeing you!</p>
                        
                        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #bae6fd;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #7dd3fc; font-weight: bold; width: 100px; vertical-align: top;">DOCTOR</td>
                                    <td style="padding: 8px 0; color: #0c4a6e; font-weight: bold; font-size: 16px;">${appointmentDetails.doctorName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #7dd3fc; font-weight: bold; width: 100px; vertical-align: top;">DATE</td>
                                    <td style="padding: 8px 0; color: #0c4a6e; font-weight: bold;">Tomorrow, ${new Date(appointmentDetails.appointmentDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #7dd3fc; font-weight: bold; width: 100px; vertical-align: top;">TOKEN</td>
                                    <td style="padding: 8px 0; color: #0c4a6e; font-weight: bold;">#${appointmentDetails.tokenNumber}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #7dd3fc; font-weight: bold; width: 100px; vertical-align: top;">FACILITY</td>
                                    <td style="padding: 8px 0; color: #0c4a6e; font-weight: bold;">${appointmentDetails.hospitalName}</td>
                                </tr>
                            </table>
                        </div>

                        <div style="background-color: #fff7ed; padding: 15px; border-radius: 8px; border-left: 4px solid #f97316; margin-bottom: 25px;">
                            <p style="color: #9a3412; margin: 0; font-size: 14px;"><strong>Note:</strong> Please arrive at least 15 minutes before your scheduled time for seamless check-in.</p>
                        </div>
                        
                        <p style="color: #64748b; font-size: 14px; margin: 0;">If you need to reschedule or cancel, please visit your dashboard or contact us immediately.</p>
                    </div>

                    <div style="text-align: center; padding-top: 25px; border-top: 2px solid #f8fafc; color: #94a3b8; font-size: 12px;">
                        <p style="margin: 0 0 5px;">&copy; ${new Date().getFullYear()} NEXA Healthcare Systems. All rights reserved.</p>
                        <p style="margin: 0;">Providing world-class healthcare through technology.</p>
                    </div>
                </div>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Reminder email sent to ${email}`);
        } catch (error) {
            console.error("Error sending reminder email:", error);
        }
    }
};
