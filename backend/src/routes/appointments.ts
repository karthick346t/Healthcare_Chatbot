import { Router, Request, Response } from 'express';
import Hospital from '../models/Hospital';
import Doctor from '../models/Doctor';
import Appointment from '../models/Appointment';
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
        appointmentDate
    } = req.body;

    try {
        // 1. Normalize date to beginning of day
        const date = new Date(appointmentDate);
        date.setHours(0, 0, 0, 0);

        // 2. Count existing appointments for this doctor on this day
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
            status: 'pending'
        });

        await newAppointment.save();
        res.status(201).json(newAppointment);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
