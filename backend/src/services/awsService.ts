import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
 */
export const uploadSessionToS3 = async (sessionId: string, data: any) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `chat-logs/${sessionId}.json`, 
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    
    console.log(`✅ [AWS] Session ${sessionId} backed up to S3.`);
    return true;
  } catch (error) {
    console.error(`❌ [AWS] Upload failed for session ${sessionId}:`, error);
    return false;
  }
};

/**
 * Uploads a raw file (PDF, Image) to S3 and returns the URL
 */
export const uploadFileToS3 = async (
  filePath: string, 
  fileName: string, 
  mimeType: string
): Promise<string | null> => {
  try {
    const fileStream = fs.createReadStream(filePath);
    // Create a unique key: uploads/timestamp-filename
    const key = `uploads/${Date.now()}-${fileName}`;

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