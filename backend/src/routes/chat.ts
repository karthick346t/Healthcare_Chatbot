import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Request, Response } from 'express';

// Existing Services
import { handleMessage, handleTriage } from '../services/chatbotService';
import { translateViaM2M100 } from '../services/translationService';

// --- NEW IMPORTS FOR DB & AWS ---
import ChatSession from '../models/ChatSession';
import { uploadSessionToS3 } from '../services/awsService';

const router = Router();

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
    console.log(`Chat request from session ${sessionId}: "${message}"`);

    let translatedInput = message;
    let response = null;

    try {
      // Step 1: Translate incoming message to English if needed
      if (locale !== 'en') {
        translatedInput = await translateViaM2M100(message, locale, 'en');
      }

      // Step 2: Handle triage or normal message (in English)
      if (/triage/i.test(translatedInput)) {
        response = await handleTriage(translatedInput, sessionId, conversationHistory, 'en');
      } else {
        response = await handleMessage(translatedInput, sessionId, conversationHistory, 'en');
      }

      // Step 3: Translate response back to user's language, if needed
      let output = response;
      if (locale !== 'en') {
        output = await translateViaM2M100(response, 'en', locale);
      }

      // --- STEP 4: STORE IN MONGODB ---
      // We store the original 'message' (what user typed) and final 'output' (what user sees)
      const updatedSession = await ChatSession.findOneAndUpdate(
        { sessionId },
        {
          $setOnInsert: { locale: locale }, // Only set locale if creating new session
          $push: {
            messages: [
              { role: 'user', content: message, timestamp: new Date() },
              { role: 'assistant', content: output, timestamp: new Date() }
            ]
          },
          $set: { lastUpdated: new Date() }
        },
        { new: true, upsert: true } // Create if doesn't exist, return updated doc
      );

      // --- STEP 5: BACKUP TO AWS S3 ---
      // We do not await this, so we don't delay the user's response
      if (updatedSession) {
        uploadSessionToS3(sessionId, updatedSession)
          .catch(err => console.error(`Background S3 upload failed for ${sessionId}:`, err));
      }

      // Step 6: Send Response
      res.json({ message: output });

    } catch (error: any) {
      console.error('Chat route error:', error);
      res.status(500).json({
        error: 'Failed to generate response',
        message: 'Sorry, I encountered an error. Please try again.'
      });
    }
  }
);

export default router;