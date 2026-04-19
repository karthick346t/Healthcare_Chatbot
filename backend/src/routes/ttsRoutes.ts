import { Router, Request, Response } from 'express';
import { googleTtsService } from '../services/googleTtsService';
import { body, validationResult } from 'express-validator';

const router = Router();

/**
 * POST /api/chat/tts
 * Synthesize text to speech using Google Cloud TTS.
 * Returns base64 audio data.
 */
router.post(
  '/tts',
  [
    body('text').notEmpty().withMessage('Text is required for TTS'),
    body('languageCode').optional().isString()
  ],
  async (req: Request, res: Response) => {
    // 1. Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text, languageCode } = req.body;

    try {
      // 2. check if service is enabled
      if (!googleTtsService.getReadyStatus()) {
        return res.status(503).json({ 
          error: 'Google TTS is not configured on this server.',
          fallback: true
        });
      }

      // 3. Synthesize
      const base64Audio = await googleTtsService.synthesize(text, languageCode || 'en-US');

      if (!base64Audio) {
        return res.status(500).json({ 
          error: 'Failed to synthesize speech',
          fallback: true
        });
      }

      // 4. Return audio
      res.json({
        success: true,
        audioContent: base64Audio,
        format: 'mp3'
      });
    } catch (error: any) {
      console.error('[TTS Route] Error:', error);
      res.status(500).json({ 
        error: 'Internal server error during TTS synthesis',
        fallback: true
      });
    }
  }
);

export default router;
