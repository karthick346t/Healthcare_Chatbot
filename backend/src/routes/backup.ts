import { Router, Request, Response } from 'express';
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import User from '../models/User';
import Appointment from '../models/Appointment';
import ChatSession from '../models/ChatSession';
import authMiddleware from '../middleware/auth';
import mongoose from 'mongoose';


const router = Router();

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
});

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // 1. Fetch User Data
        const user = await User.findById(userId).select('-password');

        // 2. Fetch Appointments
        const appointments = await Appointment.find({ userId: userObjectId });

        // 3. Fetch Chat Sessions
        const chatSessions = await ChatSession.find({ userId: userObjectId });

        // 4. Assemble Backup Payload
        const backupData = {
            exportDate: new Date().toISOString(),
            user,
            appointments,
            chatSessions
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        const fileName = `backups/${userId}_${Date.now()}.json`;

        // 5. Upload to S3
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName,
            Body: jsonString,
            ContentType: "application/json"
        });

        await s3Client.send(command);

        // 6. Generate Signed URL (valid for 15 minutes)
        const getCommand = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName,
        });

        const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 900 });

        res.status(200).json({ status: "success", url: signedUrl });

    } catch (error) {
        console.error("Backup generation failed", error);
        res.status(500).json({ error: 'Failed to generate backup' });
    }
});

export default router;
