import { Router, Request, Response } from 'express';
import Report from '../models/Report';
import mongoose from 'mongoose';
import authMiddleware from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/reports/patient/:patientId
// Get all reports for a specific patient
// In a real app, you'd use req.user.id from middleware
router.get('/patient/:patientId', async (req: any, res: Response) => {
    try {
        const { patientId } = req.params;
        const reports = await Report.find({ patientId }).sort({ date: -1 });
        res.json(reports);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/reports/my-reports
// Securely fetch reports for the logged-in user
router.get('/my-reports', async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId;
        
        const reports = await Report.find({
            patientId: userId
        })
        .populate('doctorId', 'name specialty')
        .sort({ date: -1 });

        res.json(reports);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/reports/stats
// Get counts per category for folder view for the logged-in user
router.get('/stats', async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId;
        const stats = await Report.aggregate([
            { $match: { patientId: new mongoose.Types.ObjectId(userId) } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/reports
// Upload a new report metadata (File uploaded via /api/upload first)
router.post('/', async (req: any, res: Response) => {
    try {
        const {
            patientId,
            patientName,
            doctorId,
            type,
            category,
            title,
            description,
            insight,
            tags,
            status,
            fileUrl,
            date
        } = req.body;

        const userId = req.user?.userId;
        
        // In a real app, fetch patientName from User record
        // For now, we'll use the provided name or default
        const reportDate = date || new Date();

        const newReport = new Report({
            patientId: new mongoose.Types.ObjectId(userId),
            patientName: patientName || "Authenticated User",
            doctorId: doctorId ? new mongoose.Types.ObjectId(doctorId) : undefined,
            type,
            category: category || 'General',
            title,
            description,
            insight,
            tags: tags || [],
            status: status || 'Normal',
            fileUrl,
            date: reportDate
        });

        const savedReport = await newReport.save();

        res.status(201).json(savedReport);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/reports/:id
// Delete a specific report
router.delete('/:id', async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        const report = await Report.findOneAndDelete({
            _id: id,
            patientId: userId
        });

        if (!report) {
            return res.status(404).json({ message: 'Report not found or unauthorized' });
        }

        res.json({ message: 'Report deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
