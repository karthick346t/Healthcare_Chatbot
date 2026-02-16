import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer'; // Import Multer for file handling
import ChatSession from '../models/ChatSession';
import { handleMessage, handleTriage } from '../services/chatbotService';
import { translateViaM2M100 } from '../services/translationService';
import { uploadSessionToS3 } from '../services/awsService';

const router = Router();

// --- CONFIG: Multer (Memory Storage for quick processing) ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // Limit to 5MB
});

// ==========================================
// 1. GET ALL SESSIONS (For Sidebar List)
// ==========================================
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const sessions = await ChatSession.find()
      .sort({ lastUpdated: -1 })
      .select('sessionId messages lastUpdated')
      .limit(20);

    const formattedSessions = sessions.map(session => {
      const firstUserMsg = session.messages.find((m: any) => m.role === 'user');
      const titleText = firstUserMsg ? firstUserMsg.content : 'New Chat';

      return {
        sessionId: session.sessionId,
        title: titleText.length > 30 ? titleText.substring(0, 30) + '...' : titleText,
        date: session.lastUpdated
      };
    });

    res.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ==========================================
// 2. GET SINGLE SESSION (For Switching Chats)
// ==========================================
router.get('/session/:sessionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const session = await ChatSession.findOne({ sessionId });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json(session.messages);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// ==========================================
// 3. POST CHAT (Send Text Message)
// ==========================================
router.post(
  '/',
  [
    body("message").isString().trim().notEmpty().isLength({ max: 1024 }),
    body("conversationHistory").optional().isArray(),
    body("locale").optional().isString(),
    body("sessionId").exists().isString().isLength({ min: 8 }),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ error: "Invalid input", details: errors.array() });
      return;
    }

    let { message, conversationHistory = [], locale = 'en', sessionId } = req.body;
    console.log(`📩 Chat request | Session: ${sessionId} | Msg: "${message.substring(0, 20)}..."`);

    try {
      // --- A. TRANSLATION (Input) ---
      let translatedInput = message;
      if (locale !== 'en') {
        translatedInput = await translateViaM2M100(message, locale, 'en');
      }

      // --- B. AI PROCESSING ---
      let response = null;
      if (/triage/i.test(translatedInput)) {
        response = await handleTriage(translatedInput, sessionId, conversationHistory, 'en');
      } else {
        response = await handleMessage(translatedInput, sessionId, conversationHistory, 'en');
      }

      // --- C. TRANSLATION (Output) ---
      let output = response;
      if (locale !== 'en') {
        output = await translateViaM2M100(response, 'en', locale);
      }

      // --- D. SAVE TO MONGODB ---
      const updatedSession = await ChatSession.findOneAndUpdate(
        { sessionId },
        {
          $setOnInsert: { locale: locale },
          $push: {
            messages: [
              { role: 'user', content: message, timestamp: new Date() },
              { role: 'assistant', content: output, timestamp: new Date() }
            ]
          },
          $set: { lastUpdated: new Date() }
        },
        { returnDocument: 'after', upsert: true }
      );

      // --- E. S3 BACKUP ---
      if (updatedSession) {
        // Try to get userId from header for organized backup
        let userId: string | undefined;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
            // Lazy import to avoid circular dependency issues if any
            const { verifyToken } = require('../services/authService');
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            userId = decoded.userId;
          } catch (e) {
            console.warn('Invalid token in chat request, saving as anonymous');
          }
        }

        uploadSessionToS3(sessionId, updatedSession, userId)
          .catch(err => console.error(`⚠️ S3 Background Upload Failed:`, err.message));
      }

      res.json({ message: output });

    } catch (error: any) {
      console.error('❌ Chat route error:', error);
      res.status(500).json({
        error: 'Failed to generate response',
        message: 'Sorry, I encountered an error. Please try again.'
      });
    }
  }
);

// ==========================================
// 4. POST UPLOAD (Handle File + AI Analysis)
// ==========================================
router.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const { sessionId, locale = 'en' } = req.body;

      // FormData sends arrays/objects as JSON strings, so we parse them
      const conversationHistory = req.body.conversationHistory ? JSON.parse(req.body.conversationHistory) : [];

      console.log(`📂 File Upload | Session: ${sessionId} | File: ${req.file.originalname}`);

      // --- 1. CONSTRUCT PROMPT FOR AI ---
      // In a real app, you might send the image buffer to GPT-4 Vision or extract text via OCR.
      // Here, we simulate the context by telling the AI a file was uploaded.
      const filePrompt = `[System: The user has uploaded a file named "${req.file.originalname}". Analyze this action as a request for help regarding this document.]`;

      // --- 2. AI PROCESSING ---
      // We reuse handleMessage to get a context-aware response about the file
      const aiResponse = await handleMessage(filePrompt, sessionId, conversationHistory, 'en');

      // --- 3. TRANSLATION (Output) ---
      let output = aiResponse;
      if (locale !== 'en') {
        output = await translateViaM2M100(aiResponse, 'en', locale);
      }

      // --- 4. SAVE TO MONGODB ---
      // We save the file upload as a user message, marking it with an icon or prefix
      const userMsgContent = `📄 Uploaded: ${req.file.originalname}`;

      const updatedSession = await ChatSession.findOneAndUpdate(
        { sessionId },
        {
          $setOnInsert: { locale: locale },
          $push: {
            messages: [
              { role: 'user', content: userMsgContent, timestamp: new Date() },
              { role: 'assistant', content: output, timestamp: new Date() }
            ]
          },
          $set: { lastUpdated: new Date() }
        },
        { returnDocument: 'after', upsert: true }
      );

      // --- 5. S3 BACKUP ---
      if (updatedSession) {
        uploadSessionToS3(sessionId, updatedSession)
          .catch(err => console.error(`⚠️ S3 Background Upload Failed:`, err.message));
      }

      // Return consistent format
      res.json({
        message: output,
        isHealthRelated: true
      });

    } catch (error) {
      console.error('❌ Upload route error:', error);
      res.status(500).json({ error: "File upload processing failed" });
    }
  }
);

export default router;