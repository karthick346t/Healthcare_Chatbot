import { Router, Request, Response } from 'express';
import Report from '../models/Report';
import mongoose from 'mongoose';
import authMiddleware from '../middleware/auth';
import { analyzeDocumentTextWithNvidia, analyzeImagesWithNvidia } from '../services/aiAnalysis';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

// Helper for scanned PDF fallback
async function extractPdfAsImage(pdfPath: string): Promise<string | null> {
    try {
        const scriptPath = path.join(__dirname, '../scripts/pdf_to_base64.py');
        
        // Use venv python if available, fallback to system python
        const venvPath = path.join(__dirname, '../../venv/Scripts/python.exe');
        const pythonCmd = fs.existsSync(venvPath) ? `"${venvPath}"` : 'python';
        
        console.log(`🖼️ Converting PDF to Image using: ${pythonCmd}`);
        const { stdout, stderr } = await execPromise(`${pythonCmd} "${scriptPath}" "${pdfPath}"`, { maxBuffer: 50 * 1024 * 1024 });
        
        if (stderr && !stdout) {
            console.error('❌ Python stderr:', stderr);
            return null;
        }
        
        const result = stdout.trim();
        return result.startsWith('Error') ? null : result;
    } catch (error) {
        console.error('❌ PDF Vision conversion failed:', error);
        return null;
    }
}

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

        // --- BACKGROUND AI TRIGGER ---
        if (insight && insight.toLowerCase().includes('analyzing')) {
            setImmediate(async () => {
                try {
                    console.log(`🤖 [Background AI] Starting analysis for Report: ${savedReport._id}`);
                    
                    // 1. Download file content from S3
                    if (!fileUrl || !fileUrl.startsWith('http')) {
                        console.error('❌ [Background AI] Invalid fileUrl:', fileUrl);
                        throw new Error('Invalid or missing file URL for background processing');
                    }

                    console.log(`📡 [Background AI] Downloading: ${fileUrl.substring(0, 50)}...`);
                    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
                    const buffer = Buffer.from(response.data);
                    
                    // Temp save for processing if needed (pdf-parse needs it sometimes or for mammoth)
                    const tempPath = path.join(__dirname, `../../uploads/bg_${savedReport._id}_${Date.now()}`);
                    await fsPromises.writeFile(tempPath, buffer);

                    let aiInsight = '';
                    let isHealth = true;
                    let detectedType = savedReport.type;
                    let detectedCategory = savedReport.category;

                    const mimetype = response.headers['content-type'];
                    const isPDF = mimetype === 'application/pdf';
                    const isImage = mimetype.startsWith('image/');
                    const isDocx = mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

                    try {
                        if (isPDF) {
                            // Use a timeout for pdfParse to avoid hanging on complex scanned docs
                            const pdfData = await Promise.race([
                                pdfParse(buffer),
                                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
                            ]).catch(() => ({ text: '' }));

                            const text = (pdfData as any).text;
                            if (text && text.trim().length > 10) {
                                const result = await analyzeDocumentTextWithNvidia(text, title);
                                aiInsight = result.analysis;
                            } else {
                                // Scanned fallback - text extraction failed or was too short
                                const base64Image = await extractPdfAsImage(tempPath);
                                if (base64Image) {
                                    const result = await analyzeImagesWithNvidia([base64Image], title, 'en', [], true, 'vault');
                                    aiInsight = result.analysis;
                                } else {
                                    aiInsight = "Document appears to be scanned or contains non-extractable text.";
                                }
                            }
                        } else if (isDocx) {
                            const result = await mammoth.extractRawText({ path: tempPath });
                            const text = result.value || '';
                            if (text.trim()) {
                                const aiResult = await analyzeDocumentTextWithNvidia(text, title);
                                aiInsight = aiResult.analysis;
                            } else {
                                aiInsight = "Document appears to be empty or contains non-extractable text.";
                            }
                        } else if (isImage) {
                            const base64 = buffer.toString('base64');
                            const result = await analyzeImagesWithNvidia([base64], title, 'en', [], false, 'vault');
                            aiInsight = result.analysis;
                        }

                        // Parse Type/Category from AI
                        if (aiInsight.toLowerCase().includes('prescription')) {
                            detectedType = 'Prescription';
                            detectedCategory = 'Medication';
                        } else if (aiInsight.toLowerCase().includes('radiology') || aiInsight.toLowerCase().includes('imaging')) {
                            detectedType = 'Radiology';
                            detectedCategory = 'Imaging';
                        } else if (aiInsight.toLowerCase().includes('lab report') || aiInsight.toLowerCase().includes('blood work')) {
                            detectedType = 'Lab Report';
                            detectedCategory = 'Blood Work';
                        } else if (aiInsight.toLowerCase().includes('vaccination')) {
                            detectedType = 'Vaccination';
                            detectedCategory = 'Vaccination';
                        }

                        // Update Report in DB
                        await Report.findByIdAndUpdate(savedReport._id, {
                            insight: aiInsight,
                            type: detectedType,
                            category: detectedCategory
                        });
                        console.log(`✅ [Background AI] Completed for Report: ${savedReport._id}`);
                    } finally {
                        if (fs.existsSync(tempPath)) await fsPromises.unlink(tempPath);
                    }
                } catch (bgErr) {
                    console.error("❌ [Background AI] Failed:", bgErr);
                    await Report.findByIdAndUpdate(savedReport._id, {
                        insight: "AI Analysis was unable to process this file automatically."
                    });
                }
            });
        }

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
