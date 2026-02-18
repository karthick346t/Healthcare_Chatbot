import { Router, Request, Response } from 'express';
import Hospital from '../models/Hospital';
import Doctor from '../models/Doctor';
import Appointment from '../models/Appointment';
import { notificationService } from '../services/notificationService';
import mongoose from 'mongoose';

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

        const appointments = await Appointment.find({ userId })
            .populate('hospitalId', 'name location')
            .populate('doctorId', 'name specialty')
            .sort({ appointmentDate: -1 }); // Newest first

        res.json(appointments);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/appointments/:id/cancel
router.put('/:id/cancel', async (req: Request, res: Response) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Optional: Check if the user requesting cancellation owns this appointment
        // For now, we assume the frontend sends the correct request or we trust the authenticated user (if we had middleware here)

        appointment.status = 'cancelled';
        await appointment.save();

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
        userId // Extract userId
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
            status: 'confirmed',
            userId: userId ? new mongoose.Types.ObjectId(userId) : undefined
        });

        const savedAppointment = await newAppointment.save();

        // Send Confirmation Email
        // We assume the user might have an email in their profile, or we use a fallback/test email if not provided in booking data
        // For now, let's try to find the user to get their email, or perform a lookup if 'userId' was passed 

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

        res.status(201).json(savedAppointment);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
