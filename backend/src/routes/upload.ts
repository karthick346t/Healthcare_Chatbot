import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { uploadFileToS3 } from '../services/awsService';
import ChatSession from '../models/ChatSession';
import authMiddleware from '../middleware/auth'; // ✅ Corrected import
import { analyzeDocumentTextWithNvidia, analyzeImagesWithNvidia } from '../services/aiAnalysis';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

// ✅ Standard import for version 1.1.1
const pdfParse = require('pdf-parse');

const router = Router();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/pdf';

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and Word documents allowed.'));
    }
  }
});

// Helper: Async Image to Base64
async function imageToBase64Async(filePath: string): Promise<string> {
  const buffer = await fsPromises.readFile(filePath);
  return buffer.toString('base64');
}

// ✅ CLEAN & SIMPLE PDF Extraction
async function extractPdfText(pdfPath: string): Promise<string> {
  try {
    console.log('📄 Extracting text from PDF...');

    // 1. Read file buffer
    const dataBuffer = await fsPromises.readFile(pdfPath);

    // 2. Parse (Version 1.1.1 is always a function)
    const data = await pdfParse(dataBuffer);

    console.log(`✅ Extracted ${data.text.length} characters from PDF.`);
    return data.text;

  } catch (error) {
    console.error('❌ PDF extraction failed:', error);
    return "Error: Could not extract text from this PDF file.";
  }
}

async function extractDocxText(docxPath: string): Promise<string> {
  const mammoth = require('mammoth');
  try {
    console.log('Extracting text from DOCX...');
    const result = await mammoth.extractRawText({ path: docxPath });
    return result.value || '';
  } catch (error) {
    console.error('DOCX text extraction error:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

// ✅ SECURE: Sanitize upload path to prevent shell injection / path traversal
async function extractPdfAsImage(pdfPath: string): Promise<string | null> {
  try {
    console.log('🖼️ Running advanced Vision fallback (PDF to Image)...');

    // Use the absolute path to the script
    const scriptPath = path.join(__dirname, '../scripts/pdf_to_base64.py');

    // Sanitize: reconstruct path from dir + basename to prevent path traversal
    const safeDir = path.dirname(pdfPath);
    const safeFile = path.basename(pdfPath).replace(/[^a-zA-Z0-9._-]/g, '_');
    const safePath = path.join(safeDir, safeFile);

    // Validate the path stays within the uploads directory
    const uploadsDir = path.resolve(path.join(__dirname, '../../uploads'));
    const resolvedPath = path.resolve(safePath);
    if (!resolvedPath.startsWith(uploadsDir)) {
      console.error('❌ Path traversal attempt blocked:', pdfPath);
      return null;
    }

    // Use venv python if available, fallback to system python
    const venvPath = path.join(__dirname, '../../venv/Scripts/python.exe');
    const pythonCmd = fs.existsSync(venvPath) ? `"${venvPath}"` : 'python';

    // Run the Python script with sanitized paths (quoted for safety)
    const { stdout, stderr } = await execPromise(
      `${pythonCmd} "${scriptPath.replace(/"/g, '')}" "${resolvedPath.replace(/"/g, '')}"`,
      { maxBuffer: 50 * 1024 * 1024 }
    );

    if (stderr && !stdout) {
      console.error('❌ Python Script stderr:', stderr);
      return null;
    }

    const result = stdout.trim();
    if (result.startsWith('Error')) {
      console.error('❌ PDF to Image conversion failed:', result);
      return null;
    }

    return result; // This is the base64 string
  } catch (error) {
    console.error('❌ PDF to Image fallback failed:', error);
    return null;
  }
}


router.post('/', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const file = req.file;
  const shouldSkipAI = req.body.skipAI === 'true' || req.body.skipAI === true;

  try {
    const { locale = 'en', sessionId, conversationHistory } = req.body;
    const userId = req.user!.userId; // ✅ Authenticated User

    let history = [];
    if (conversationHistory) {
      history = typeof conversationHistory === 'string'
        ? JSON.parse(conversationHistory)
        : conversationHistory;
    }

    console.log(`Processing: ${file.originalname} (${file.size} bytes) for User: ${userId}`);

    // --- 1. AI ANALYSIS ---
    let responseMessage = '';
    let isHealthRelated = false;
    let localFilePath: string | null = file.path;
    let extractedText: string = '';
    let fileType: string = '';

    if (!shouldSkipAI) {
      const isPDF = file.mimetype === 'application/pdf';
      const isImage = file.mimetype.startsWith('image/');
      const isDocx = file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const isDoc = file.mimetype === 'application/msword';
      const isText = file.mimetype === 'text/plain';

      if (isPDF) {
        const pdfText = await extractPdfText(file.path);
        extractedText = pdfText.trim().slice(0, 15000);
        fileType = 'pdf';

        if (pdfText.startsWith("Error: Could not extract")) {
          responseMessage = `I encountered a technical error reading your PDF. Please ensure it is a valid text PDF.`;
        } else if (!pdfText.trim()) {
          // --- ADVANCED FALLBACK: PDF has no text (likely scanned) ---
          const base64Image = await extractPdfAsImage(file.path);
          
          if (base64Image) {
            console.log('🚀 Sending scanned PDF image to Vision AI...');
            const result = await analyzeImagesWithNvidia([base64Image], file.originalname, locale, history, true, 'chat');
            responseMessage = result.analysis;
            isHealthRelated = result.isHealthRelated;
          } else {
            responseMessage = `I could not read any text from PDF "${file.originalname}". It might be a scanned image without OCR.`;
          }
        } else {
          const result = await analyzeDocumentTextWithNvidia(pdfText, file.originalname, locale, history);
          responseMessage = result.analysis;
          isHealthRelated = result.isHealthRelated;
        }

      } else if (isDocx || isDoc) {
        const docText = await extractDocxText(file.path);
        extractedText = docText.trim().slice(0, 15000);
        fileType = 'doc';
        if (!docText.trim()) {
          responseMessage = `Document "${file.originalname}" appears empty.`;
        } else {
          const result = await analyzeDocumentTextWithNvidia(docText, file.originalname, locale, history);
          responseMessage = result.analysis;
          isHealthRelated = result.isHealthRelated;
        }
      } else if (isText) {
        const textContent = await fsPromises.readFile(file.path, 'utf-8');
        extractedText = textContent.trim().slice(0, 15000);
        fileType = 'text';
        if (!textContent.trim()) {
          responseMessage = `Text file "${file.originalname}" appears empty.`;
        } else {
          const result = await analyzeDocumentTextWithNvidia(textContent, file.originalname, locale, history);
          responseMessage = result.analysis;
          isHealthRelated = result.isHealthRelated;
        }
      } else if (isImage) {
        const base64Image = await imageToBase64Async(file.path);
        const result = await analyzeImagesWithNvidia([base64Image], file.originalname, locale, history, false, 'chat');
        responseMessage = result.analysis;
        isHealthRelated = result.isHealthRelated;
        fileType = 'image';
      } else {
        responseMessage = `File type ${file.mimetype} is not supported.`;
      }
    }

    // --- 2. UPLOAD TO S3 (Background) ---
    // We don't wait for S3 anymore to speed up the response
    let s3Url: string | null = null;
    if (shouldSkipAI) {
      // Logic for Vault: Securely upload to S3 first, then return URL
      // We wait for S3 now to ensure the follow-up /api/reports has a valid URL
      try {
        console.log("☁️ [Vault] Uploading file to S3...");
        s3Url = await uploadFileToS3(file.path, file.originalname, file.mimetype, userId);
        
        if (!s3Url) {
           throw new Error("S3 Upload returned null URL");
        }
        console.log("✅ [Vault] S3 Upload complete:", s3Url);
      } catch (err) {
        console.error("❌ [Vault] S3 Upload failed:", err);
        // Cleanup local file on failure before returning error
        if (file.path && fs.existsSync(file.path)) {
            await fsPromises.unlink(file.path).catch(() => {});
        }
        return res.status(500).json({ error: "Failed to upload file to cloud storage. Please check your connection." });
      }

      // Cleanup local file immediately after SUCCESSFUL S3 upload
      if (file.path && fs.existsSync(file.path)) {
        fsPromises.unlink(file.path)
          .then(() => console.log(`🗑️ [Vault] Cleaned up temp file: ${file.filename}`))
          .catch(err => console.error(`⚠️ [Vault] Cleanup failed:`, err));
      }

      return res.json({
        message: "File received, processing in background.",
        fileId: file.filename,
        fileUrl: s3Url, 
        fileType: 'document',
        originalName: file.originalname,
        isHealthRelated: true 
      });
    }

    // Original logic for Chat (needs immediate response)
    try {
      console.log("Uploading original file to S3...");
      s3Url = await uploadFileToS3(file.path, file.originalname, file.mimetype, userId);
    } catch (uploadErr) {
      console.error("Failed to backup file to S3, but continuing...", uploadErr);
    }

    const documentEntry = {
      fileId: file.filename,
      originalName: file.originalname,
      fileType: fileType || file.mimetype,
      summary: responseMessage,
      extractedText: extractedText || undefined,
      attachmentUrl: s3Url || undefined,
      createdAt: new Date()
    };

    // --- 3. SAVE TO DB (Chat History) ---
    if (sessionId) {
      await ChatSession.findOneAndUpdate(
        { sessionId },
        {
          $setOnInsert: { locale, userId }, // ✅ Ensure userId is set
          $push: {
            messages: [
              {
                role: 'user',
                content: `Uploaded file: ${file.originalname}`,
                timestamp: new Date(),
                attachmentUrl: s3Url || undefined
              },
              {
                role: 'assistant',
                content: responseMessage,
                timestamp: new Date()
              }
            ],
            documents: documentEntry
          },
          $set: { lastUpdated: new Date() }
        },
        { returnDocument: 'after', upsert: true }
      );
    }

    // --- 4. RESPONSE ---
    res.json({
      message: responseMessage,
      fileId: file.filename,
      fileUrl: s3Url,
      fileType: 'document',
      originalName: file.originalname,
      isHealthRelated: isHealthRelated
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Processing failed',
      message: 'Sorry, I encountered an error. Please try again.',
      isHealthRelated: false
    });

  } finally {
    // --- 5. CLEANUP ---
    // Only cleanup here if it wasn't handled by the background task
    if (!shouldSkipAI && file && file.path) {
        fsPromises.unlink(file.path)
          .then(() => console.log(`🗑️ Cleaned up temp file: ${file.filename}`))
          .catch(err => console.error(`⚠️ Failed to delete temp file ${file.filename}:`, err));
    }
  }
});

export default router;