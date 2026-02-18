import { Router, Request, Response } from 'express';
import User from '../models/User';
import Appointment from '../models/Appointment';
import Doctor from '../models/Doctor';
import Hospital from '../models/Hospital';
import authMiddleware, { adminMiddleware } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();

// Protect all admin routes
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/stats
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'patient' });
        const totalAppointments = await Appointment.countDocuments();
        const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
        const confirmedAppointments = await Appointment.countDocuments({ status: 'confirmed' });
        const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });
        const totalDoctors = await Doctor.countDocuments();
        const totalHospitals = await Hospital.countDocuments();

        res.json({
            users: totalUsers,
            appointments: {
                total: totalAppointments,
                pending: pendingAppointments,
                confirmed: confirmedAppointments,
                cancelled: cancelledAppointments
            },
            doctors: totalDoctors,
            hospitals: totalHospitals
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/admin/appointments
// Supports pagination and status filter
router.get('/appointments', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const status = req.query.status as string;

        const filter: any = {};
        if (status && status !== 'all') {
            filter.status = status;
        }

        const appointments = await Appointment.find(filter)
            .populate('hospitalId', 'name') // Populate hospital details
            .populate('doctorId', 'name specialty') // Populate doctor details
            .sort({ createdAt: -1 }) // Newest first
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Appointment.countDocuments(filter);

        res.json({
            appointments,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalAppointments: total
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/admin/appointments/:id/status
router.put('/appointments/:id/status', async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        res.json(appointment);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/admin/doctors (Simplified for now)
router.post('/doctors', async (req: Request, res: Response) => {
    try {
        const newDoctor = new Doctor(req.body);
        await newDoctor.save();
        res.status(201).json(newDoctor);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/admin/hospitals (Simplified for now)
router.post('/hospitals', async (req: Request, res: Response) => {
    try {
        const newHospital = new Hospital(req.body);
        await newHospital.save();
        res.status(201).json(newHospital);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/admin/users
router.get('/users', async (req: Request, res: Response) => {
    try {
        const users = await User.find({ role: 'patient' }).select('-password');
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req: Request, res: Response) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/admin/doctors
router.get('/doctors', async (req: Request, res: Response) => {
    try {
        const doctors = await Doctor.find().populate('hospitalId', 'name');
        res.json(doctors);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/admin/doctors/:id
router.delete('/doctors/:id', async (req: Request, res: Response) => {
    try {
        await Doctor.findByIdAndDelete(req.params.id);
        res.json({ message: 'Doctor deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
