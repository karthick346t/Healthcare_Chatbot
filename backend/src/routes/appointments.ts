import { Router, Request, Response } from 'express';
import Hospital from '../models/Hospital';
import Doctor from '../models/Doctor';
import Appointment from '../models/Appointment';
import { notificationService } from '../services/notificationService';
import { uploadAppointmentBackup, fetchAppointmentsFromS3 } from '../services/awsService';
import mongoose from 'mongoose';
import User from '../models/User';

const router = Router();

// GET /api/appointments/hospitals
router.get('/hospitals', async (req: Request, res: Response) => {
    try {
        const { district } = req.query;
        const filter = district ? { district: district as string } : {};
        const hospitals = await Hospital.find(filter);
        res.json(hospitals);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/appointments/hospitals/:id/doctors
router.get('/hospitals/:id/doctors', async (req: Request, res: Response) => {
    try {
        const doctors = await Doctor.find({ hospitalId: req.params.id });
        res.json(doctors);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/appointments/check-availability
router.get('/check-availability', async (req: Request, res: Response) => {
    try {
        const { doctorId, appointmentDate } = req.query;

        if (!doctorId || !appointmentDate) {
            return res.status(400).json({ message: 'doctorId and appointmentDate are required' });
        }

        // Normalize date to beginning of day
        const date = new Date(appointmentDate as string);
        date.setHours(0, 0, 0, 0);

        // Count existing appointments for this doctor on this day
        const count = await Appointment.countDocuments({
            doctorId: new mongoose.Types.ObjectId(doctorId as string),
            appointmentDate: date,
            status: 'confirmed'
        });

        const maxSlots = 5;
        const availableSlots = maxSlots - count;

        res.json({
            totalSlots: maxSlots,
            bookedSlots: count,
            availableSlots: availableSlots,
            isFull: count >= maxSlots
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/appointments/my-appointments
router.get('/my-appointments', async (req: Request, res: Response) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        // Fetch from S3 directly to ensure cross-device consistency
        const appointments = await fetchAppointmentsFromS3(userId as string);

        res.json(appointments);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/appointments/:id/cancel
router.put('/:id/cancel', async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Check ownership if appointment is linked to a user
        if (appointment.userId && userId) {
            if (appointment.userId.toString() !== userId) {
                return res.status(403).json({ message: "Unauthorized to cancel this appointment" });
            }
        }

        // If appointment has a user but no userId provided in request, we might want to block it
        // strictly speaking, but for now we'll allow if logic permits or if we assume guest handling elsewhere.
        // However, to be safe:
        if (appointment.userId && !userId) {
            return res.status(401).json({ message: "Authentication required to cancel this appointment" });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        // Backup cancelled appointment to S3 with FULL details
        if (appointment.userId) {
            const populated = await Appointment.findById(appointment._id)
                .populate('hospitalId', 'name location')
                .populate('doctorId', 'name specialty')
                .lean(); // Lean gets a raw JS object perfect for JSON backup

            if (populated) {
                // Ensure legacy frontends that expect doctorName/hospitalName flat handle it
                (populated as any).doctorName = (populated.doctorId as any)?.name || 'Doctor';
                (populated as any).hospitalName = (populated.hospitalId as any)?.name || 'Hospital';

                uploadAppointmentBackup(populated, appointment.userId.toString())
                    .catch(err => console.error('⚠️ S3 appointment backup failed on cancel:', err));
            }
        }

        // Send Cancellation Email
        let email = "";

        // Try to find email from User model if userId is present
        if (appointment.userId) {
            const user = await User.findById(appointment.userId);
            if (user && user.email) {
                email = user.email;
            }
        } else if (req.body.email) {
            // Fallback if email is passed in body for guest users (if supported)
            email = req.body.email;
        }

        if (email) {
            const doctor = await Doctor.findById(appointment.doctorId);
            const hospital = await Hospital.findById(appointment.hospitalId);

            await notificationService.sendAppointmentCancellation(email, {
                patientName: appointment.patientName,
                doctorName: doctor ? doctor.name : "Unknown Doctor",
                appointmentDate: appointment.appointmentDate,
                hospitalName: hospital ? hospital.name : "Unknown Hospital"
            });
        }

        res.json({ message: "Appointment cancelled successfully", appointment });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});


// POST /api/appointments/book
router.post('/book', async (req: Request, res: Response) => {
    const {
        patientName,
        patientAge,
        patientGender,
        patientAddress,
        problem,
        hospitalId,
        doctorId,
        appointmentDate,
        userId, // Extract userId
        status
    } = req.body;

    try {
        // 1. Normalize date to beginning of day
        const date = new Date(appointmentDate);
        date.setHours(0, 0, 0, 0);

        // 2. Count existing appointments for this doctor on this day
        // Only count CONFIRMED appointments towards the limit. Cancelled ones free up the slot.
        const count = await Appointment.countDocuments({
            doctorId: new mongoose.Types.ObjectId(doctorId),
            appointmentDate: date,
            status: 'confirmed'
        });

        if (count >= 5) {
            return res.status(400).json({ message: 'Token limit reached for this doctor on selected date (max 5).' });
        }

        const appointmentStatus = status || 'confirmed';

        // 3. Create appointment with next token
        const newAppointment = new Appointment({
            patientName,
            patientAge,
            patientGender,
            patientAddress,
            problem,
            hospitalId: new mongoose.Types.ObjectId(hospitalId),
            doctorId: new mongoose.Types.ObjectId(doctorId),
            appointmentDate: date,
            tokenNumber: count + 1,
            status: appointmentStatus,
            userId: userId ? new mongoose.Types.ObjectId(userId) : undefined
        });

        const savedAppointment = await newAppointment.save();

        if (appointmentStatus === 'confirmed') {
            // Backup new appointment to S3 with FULL details
            if (userId) {
                const populated = await Appointment.findById(savedAppointment._id)
                    .populate('hospitalId', 'name location')
                    .populate('doctorId', 'name specialty')
                    .lean();

                if (populated) {
                    (populated as any).doctorName = (populated.doctorId as any)?.name || 'Doctor';
                    (populated as any).hospitalName = (populated.hospitalId as any)?.name || 'Hospital';

                    uploadAppointmentBackup(populated, userId)
                        .catch(err => console.error('⚠️ S3 appointment backup failed on book:', err));
                }
            }

            // Send Confirmation Email
            if (req.body.email) {
                // Fetch doctor and hospital details for the email
                const doctor = await Doctor.findById(doctorId);
                const hospital = await Hospital.findById(hospitalId);

                await notificationService.sendAppointmentConfirmation(req.body.email, {
                    patientName: savedAppointment.patientName,
                    doctorName: doctor ? doctor.name : "Unknown Doctor",
                    appointmentDate: savedAppointment.appointmentDate.toDateString(),
                    timeSlot: "N/A",
                    hospitalName: hospital ? hospital.name : "Unknown Hospital"
                });
            }
        }

        res.status(201).json(savedAppointment);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/appointments/:id/status
router.get('/:id/status', async (req: Request, res: Response) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }
        res.json({ status: appointment.status });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/appointments/webhook/upi-mock
router.post('/webhook/upi-mock', async (req: Request, res: Response) => {
    try {
        const { appointmentId } = req.body;

        if (!appointmentId) {
            return res.status(400).json({ message: "appointmentId is required" });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.status === 'confirmed') {
            return res.json({ message: "Already confirmed" });
        }

        appointment.status = 'confirmed';
        await appointment.save();

        // Perform deferred actions (S3 backup and Email)
        if (appointment.userId) {
            const populated = await Appointment.findById(appointment._id)
                .populate('hospitalId', 'name location')
                .populate('doctorId', 'name specialty')
                .lean();

            if (populated) {
                (populated as any).doctorName = (populated.doctorId as any)?.name || 'Doctor';
                (populated as any).hospitalName = (populated.hospitalId as any)?.name || 'Hospital';

                uploadAppointmentBackup(populated, appointment.userId.toString())
                    .catch(err => console.error('⚠️ S3 appointment backup failed on upi mock:', err));
            }
        }

        // Send Email (We will try to fetch user's email if possible)
        let email = "";
        if (appointment.userId) {
            const user = await User.findById(appointment.userId);
            if (user && user.email) {
                email = user.email;
            }
        }

        if (email) {
            const doctor = await Doctor.findById(appointment.doctorId);
            const hospital = await Hospital.findById(appointment.hospitalId);

            await notificationService.sendAppointmentConfirmation(email, {
                patientName: appointment.patientName,
                doctorName: doctor ? doctor.name : "Unknown Doctor",
                appointmentDate: appointment.appointmentDate.toDateString(),
                timeSlot: "N/A",
                hospitalName: hospital ? hospital.name : "Unknown Hospital"
            });
        }

        res.json({ message: "Payment successful, appointment confirmed.", success: true });
    } catch (error: any) {
        console.error("UPI Mock Webhook Error:", error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
