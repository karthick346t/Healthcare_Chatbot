import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Uploads a JSON chat session log to S3
 * Organized by user: chat-logs/<userId>/<sessionId>.json
 */
export const uploadSessionToS3 = async (sessionId: string, data: any, userId?: string) => {
  try {
    const folder = userId ? `chat-logs/${userId}` : 'chat-logs/anonymous';
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${folder}/${sessionId}.json`,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    console.log(`✅ [AWS] Session ${sessionId} backed up to S3 (${folder}).`);
    return true;
  } catch (error) {
    console.error(`❌ [AWS] Upload failed for session ${sessionId}:`, error);
    return false;
  }
};

/**
 * Uploads a user profile backup to S3
 * Key: users/<userId>.json
 */
export const uploadUserBackup = async (user: any) => {
  try {
    // Sanitize: Remove password/salt if present
    const userObj = JSON.parse(JSON.stringify(user));
    delete userObj.password;
    delete userObj.__v;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `users/${userObj._id}.json`,
      Body: JSON.stringify(userObj, null, 2),
      ContentType: 'application/json',
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    console.log(`✅ [AWS] User backup uploaded for ${userObj._id}`);
    return true;
  } catch (error) {
    console.error(`❌ [AWS] User backup failed:`, error);
    return false;
  }
};

/**
 * Uploads a raw file (PDF, Image) to S3 and returns the URL
 */
export const uploadFileToS3 = async (
  filePath: string,
  fileName: string,
  mimeType: string,
  userId?: string // ✅ New optional User ID
): Promise<string | null> => {
  try {
    const fileStream = fs.createReadStream(filePath);

    // Create a unique key: uploads/<userId?>/timestamp-filename
    const folder = userId ? `uploads/${userId}` : 'uploads/anonymous';
    const key = `${folder}/${Date.now()}-${fileName}`;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileStream,
      ContentType: mimeType,
      // Note: By default, objects are private. You may need to configure 
      // CloudFront or a Presigned URL generator if you want frontend access.
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    // Construct standard S3 URL (adjust if using a custom domain/CDN)
    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    console.log(`✅ [AWS] File uploaded: ${url}`);
    return url;

  } catch (error) {
    console.error(`❌ [AWS] File upload failed:`, error);
    return null;
  }
};

/**
 * Uploads a single appointment backup to S3.
 * Key: appointments/<userId>/<appointmentId>.json
 * Called after every book / cancel action.
 */
export const uploadAppointmentBackup = async (appointment: any, userId: string): Promise<boolean> => {
  try {
    const appointmentId = appointment._id?.toString() || Date.now().toString();

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `appointments/${userId}/${appointmentId}.json`,
      Body: JSON.stringify(appointment, null, 2),
      ContentType: 'application/json',
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    console.log(`✅ [AWS] Appointment ${appointmentId} backed up to S3 (appointments/${userId}/).`);
    return true;
  } catch (error) {
    console.error(`❌ [AWS] Appointment backup failed:`, error);
    return false;
  }
};

/**
 * Fetches all appointments for a user directly from S3.
 * Key prefix: appointments/<userId>/
 */
export const fetchAppointmentsFromS3 = async (userId: string): Promise<any[]> => {
  try {
    const prefix = `appointments/${userId}/`;
    const listParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: prefix,
    };

    const listCommand = new ListObjectsV2Command(listParams);
    const listedObjects = await s3Client.send(listCommand);

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      return []; // No backups found
    }

    const appointments: any[] = [];

    // Fetch and parse every JSON file
    for (const item of listedObjects.Contents) {
      if (item.Key?.endsWith('.json')) {
        try {
          const getCommand = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: item.Key,
          });
          const { Body } = await s3Client.send(getCommand);
          if (Body) {
            const strData = await Body.transformToString();
            appointments.push(JSON.parse(strData));
          }
        } catch (err) {
          console.error(`⚠️ Failed to parse appointment backup ${item.Key}:`, err);
        }
      }
    }

    // Sort newest first
    appointments.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());

    console.log(`✅ [AWS] Fetched ${appointments.length} appointments from S3 for ${userId}`);
    return appointments;
  } catch (error) {
    console.error(`❌ [AWS] Fetching appointments failed:`, error);
    return [];
  }
};

