import { Router, Request, Response } from 'express';
import Doctor from '../models/Doctor';
import Appointment from '../models/Appointment';
import User from '../models/User';
import Hospital from '../models/Hospital';
import { notificationService } from '../services/notificationService';

const router = Router();

// POST /api/doctors/:id/block
router.post('/:id/block', async (req: Request, res: Response) => {
    try {
        const doctorId = req.params.id;
        const { date, startTime, endTime, reason } = req.body;

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        const blockDate = new Date(date);
        blockDate.setHours(0, 0, 0, 0);

        // Add block slot to doctor
        doctor.blockedSlots = doctor.blockedSlots || [];
        doctor.blockedSlots.push({
            date: blockDate,
            startTime,
            endTime,
            reason
        });

        await doctor.save();

        // Find affected appointments and cancel them
        // For simplicity, we assume a full day block here since the mock system doesn't have strict hour tracking yet.
        const affectedAppointments = await Appointment.find({
            doctorId,
            appointmentDate: blockDate,
            status: { $in: ['pending', 'scheduled'] }
        });

        // Loop through and notify users
        for (const appointment of affectedAppointments) {
            appointment.status = 'cancelled';
            await appointment.save();

            let email = "";
            if (appointment.userId) {
                const user = await User.findById(appointment.userId);
                if (user && user.email) {
                    email = user.email;
                }
            }

            if (email) {
                const hospital = await Hospital.findById(appointment.hospitalId);
                await notificationService.sendAppointmentCancellation(email, {
                    patientName: appointment.patientName,
                    doctorName: doctor.name,
                    appointmentDate: appointment.appointmentDate,
                    hospitalName: hospital ? hospital.name : "Unknown Hospital"
                });
            }
        }

        res.json({
            message: `Doctor blocked successfully. ${affectedAppointments.length} appointments cancelled.`,
            affectedAppointmentsCount: affectedAppointments.length
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/doctors - to list all doctors (for staff)
router.get('/', async (req: Request, res: Response) => {
    try {
        const doctors = await Doctor.find().populate('hospitalId', 'name');
        res.json(doctors);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
