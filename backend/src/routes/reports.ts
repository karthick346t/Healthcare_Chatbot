import { Router, Request, Response } from 'express';
import Report from '../models/Report';
import mongoose from 'mongoose';

const router = Router();

// GET /api/reports/patient/:patientId
// Get all reports for a specific patient
// In a real app, you'd use req.user.id from middleware
router.get('/patient/:patientId', async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        const reports = await Report.find({ patientId }).sort({ date: -1 });
        res.json(reports);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/reports/my-reports
// For demo, if we don't have auth middleware fully blocking, we might use query param or assume logged in user
// We'll try to find by query param 'patientName' for the demo if Auth ID isn't available easily
router.get('/my-reports', async (req: Request, res: Response) => {
    try {
        const { patientName } = req.query;
        if (!patientName) {
            return res.status(400).json({ message: "Patient name required for unauthenticated demo fetch" });
        }
        // Case-insensitive regex search for demo
        const reports = await Report.find({
            patientName: { $regex: new RegExp(patientName as string, 'i') }
        }).sort({ date: -1 });

        res.json(reports);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/reports
// Upload a new report metadata (File uploaded via /api/upload first)
router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            patientId,
            patientName,
            doctorId,
            type,
            title,
            description,
            fileUrl,
            date
        } = req.body;

        const newReport = new Report({
            patientId: patientId ? new mongoose.Types.ObjectId(patientId) : undefined,
            patientName,
            doctorId: new mongoose.Types.ObjectId(doctorId),
            type,
            title,
            description,
            fileUrl,
            date: date || new Date()
        });

        const savedReport = await newReport.save();
        res.status(201).json(savedReport);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
