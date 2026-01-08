import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const uploadSessionToS3 = async (sessionId: string, data: any) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `chat-logs/${sessionId}.json`, // 📂 Creates a folder 'chat-logs' in S3
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