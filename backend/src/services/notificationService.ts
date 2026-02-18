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
    }
};
