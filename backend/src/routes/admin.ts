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
        const scheduledAppointments = await Appointment.countDocuments({ status: { $in: ['scheduled', 'confirmed'] } });
        const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });
        const totalDoctors = await Doctor.countDocuments();
        const totalHospitals = await Hospital.countDocuments();

        res.json({
            users: totalUsers,
            appointments: {
                total: totalAppointments,
                pending: pendingAppointments,
                scheduled: scheduledAppointments,
                // Backward-compatible key for existing admin UI consumers
                confirmed: scheduledAppointments,
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
        const normalizedStatus = status === 'confirmed' ? 'scheduled' : status;
        if (!['pending', 'scheduled', 'cancelled'].includes(normalizedStatus)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status: normalizedStatus },
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

// POST /api/admin/doctors
const ALLOWED_DOCTOR_FIELDS = ['name', 'specialty', 'hospitalId', 'bio', 'image', 'availability'] as const;
router.post('/doctors', async (req: Request, res: Response) => {
    try {
        const doctorData: Record<string, any> = {};
        for (const key of ALLOWED_DOCTOR_FIELDS) {
            if (key in req.body) doctorData[key] = req.body[key];
        }
        // Validate hospitalId is a valid ObjectId if provided
        if (doctorData.hospitalId && !mongoose.Types.ObjectId.isValid(doctorData.hospitalId)) {
            return res.status(400).json({ message: 'Invalid hospitalId' });
        }
        const newDoctor = new Doctor(doctorData);
        await newDoctor.save();
        res.status(201).json(newDoctor);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/admin/hospitals
const ALLOWED_HOSPITAL_FIELDS = ['name', 'location', 'district', 'image', 'description', 'specialties'] as const;
router.post('/hospitals', async (req: Request, res: Response) => {
    try {
        const hospitalData: Record<string, any> = {};
        for (const key of ALLOWED_HOSPITAL_FIELDS) {
            if (key in req.body) hospitalData[key] = req.body[key];
        }
        const newHospital = new Hospital(hospitalData);
        await newHospital.save();
        res.status(201).json(newHospital);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/admin/staff/:id/assign
// Assign a staff user to a specific hospital
router.post('/staff/:id/assign', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        // Extract staffId from request params; it may be a string or an array of strings
        const rawStaffId: unknown = req.params.id;
        const staffId: string = Array.isArray(rawStaffId) ? rawStaffId[0] : String(rawStaffId);
        // Extract hospitalId from request body; it may be a string or an array of strings
        const rawHospitalId: unknown = req.body.hospitalId;
        const hospitalId: string = Array.isArray(rawHospitalId) ? rawHospitalId[0] : String(rawHospitalId);

        if (!mongoose.Types.ObjectId.isValid(staffId)) {
            return res.status(400).json({ message: 'Invalid staff user ID' });
        }
        if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
            return res.status(400).json({ message: 'Invalid hospital ID' });
        }

        const staffUser = await User.findById(staffId);
        if (!staffUser) {
            return res.status(404).json({ message: 'Staff user not found' });
        }
        if (staffUser.role !== 'staff') {
            return res.status(400).json({ message: 'User is not a staff member' });
        }

        // Convert hospitalId to ObjectId, casting to string to satisfy TypeScript
        staffUser.hospitalId = new mongoose.Types.ObjectId(hospitalId as string);
        await staffUser.save();
        res.json({ message: 'Staff assigned to hospital successfully', staff: staffUser });
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
