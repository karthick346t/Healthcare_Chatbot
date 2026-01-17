import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { analyzeDocumentTextWithNvidia, analyzeImagesWithNvidia } from '../services/aiAnalysis';
import { uploadFileToS3 } from '../services/awsService';
import ChatSession from '../models/ChatSession';

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

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const file = req.file;
  
  try {
    const { locale = 'en', sessionId, conversationHistory } = req.body;
    let history = [];
    if (conversationHistory) {
      history = typeof conversationHistory === 'string' 
        ? JSON.parse(conversationHistory) 
        : conversationHistory;
    }

    console.log(`Processing: ${file.originalname} (${file.size} bytes)`);

    // --- 1. AI ANALYSIS ---
    let responseMessage = '';
    let isHealthRelated = false;
    
    const isPDF = file.mimetype === 'application/pdf';
    const isImage = file.mimetype.startsWith('image/');
    const isDocx = file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isDoc = file.mimetype === 'application/msword';
    const isText = file.mimetype === 'text/plain';

    if (isPDF) {
      const pdfText = await extractPdfText(file.path);
      
      if (pdfText.startsWith("Error: Could not extract")) {
        responseMessage = `I encountered a technical error reading your PDF. Please ensure it is a valid text PDF.`;
      } else if (!pdfText.trim()) {
        responseMessage = `I could not read any text from PDF "${file.originalname}". It might be a scanned image without OCR.`;
      } else {
        const result = await analyzeDocumentTextWithNvidia(pdfText, file.originalname, locale, history);
        responseMessage = result.analysis;
        isHealthRelated = result.isHealthRelated;
      }

    } else if (isDocx || isDoc) {
      const docText = await extractDocxText(file.path);
      if (!docText.trim()) {
        responseMessage = `Document "${file.originalname}" appears empty.`;
      } else {
        const result = await analyzeDocumentTextWithNvidia(docText, file.originalname, locale, history);
        responseMessage = result.analysis;
        isHealthRelated = result.isHealthRelated;
      }
    } else if (isText) {
      const textContent = await fsPromises.readFile(file.path, 'utf-8');
      if (!textContent.trim()) {
        responseMessage = `Text file "${file.originalname}" appears empty.`;
      } else {
        const result = await analyzeDocumentTextWithNvidia(textContent, file.originalname, locale, history);
        responseMessage = result.analysis;
        isHealthRelated = result.isHealthRelated;
      }
    } else if (isImage) {
      const base64Image = await imageToBase64Async(file.path);
      const result = await analyzeImagesWithNvidia([base64Image], file.originalname, locale, history, false);
      responseMessage = result.analysis;
      isHealthRelated = result.isHealthRelated;
    } else {
      responseMessage = `File type ${file.mimetype} is not supported.`;
    }

    // --- 2. UPLOAD TO S3 ---
    let s3Url: string | null = null;
    try {
      console.log("Uploading original file to S3...");
      s3Url = await uploadFileToS3(file.path, file.originalname, file.mimetype);
    } catch (uploadErr) {
      console.error("Failed to backup file to S3, but continuing...", uploadErr);
    }

    // --- 3. SAVE TO DB (Chat History) ---
    if (sessionId) {
      await ChatSession.findOneAndUpdate(
        { sessionId },
        {
          $setOnInsert: { locale: locale },
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
            ]
          },
          $set: { lastUpdated: new Date() }
        },
        { new: true, upsert: true }
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
      message: 'Sorry, I encountered an error processing your file.',
      isHealthRelated: false
    });

  } finally {
    // --- 5. CLEANUP ---
    if (file && file.path) {
      fsPromises.unlink(file.path)
        .then(() => console.log(`🗑️ Cleaned up temp file: ${file.filename}`))
        .catch(err => console.error(`⚠️ Failed to delete temp file ${file.filename}:`, err));
    }
  }
});

export default router;