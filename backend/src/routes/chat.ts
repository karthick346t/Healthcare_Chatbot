import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import ChatSession from '../models/ChatSession'; // Ensure this path matches your structure
import { handleMessage, handleTriage } from '../services/chatbotService';
import { translateViaM2M100 } from '../services/translationService';
import { uploadSessionToS3 } from '../services/awsService';

const router = Router();

// ==========================================
// 1. GET ALL SESSIONS (For Sidebar List)
// ==========================================
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    // Fetch last 20 sessions, sorted by newest first
    const sessions = await ChatSession.find()
      .sort({ lastUpdated: -1 })
      .select('sessionId messages lastUpdated')
      .limit(20);

    const formattedSessions = sessions.map(session => {
        // Find the first user message to use as the "Title"
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

    // Return just the messages array
    res.json(session.messages);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// ==========================================
// 3. POST CHAT (Send Message)
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

      // --- B. AI PROCESSING (Triage or Normal) ---
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

      // --- D. SAVE TO MONGODB (The "Memory") ---
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
        { new: true, upsert: true }
      );

      // --- E. BACKUP TO AWS S3 (Async) ---
      if (updatedSession) {
        uploadSessionToS3(sessionId, updatedSession)
          .catch(err => console.error(`⚠️ S3 Background Upload Failed:`, err.message));
      }

      // Return the AI response
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

export default router;