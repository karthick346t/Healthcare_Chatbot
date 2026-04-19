import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import config from '../config';

/**
 * Service to interact with Google Cloud Text-to-Speech API.
 * Provides high-quality AI voices (Neural/WaveNet).
 */
export class GoogleTtsService {
  private client: TextToSpeechClient;
  private isEnabled: boolean = false;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    // Always assign a value to satisfy TypeScript's non-null check
    this.client = new TextToSpeechClient(
      apiKey && apiKey !== 'YOUR_GOOGLE_API_KEY' ? { apiKey } : {}
    );

    if (apiKey && apiKey !== 'YOUR_GOOGLE_API_KEY') {
      console.log('[TTS] Initializing Google Cloud TTS with API Key...');
      this.isEnabled = true;
    } else {
      console.warn('[TTS] GOOGLE_API_KEY missing in .env. Falling back to browser-native TTS.');
    }
  }

  /**
   * Generates audio from text using Google Cloud TTS.
   * Returns a base64 encoded MP3 string.
   */
  async synthesize(text: string, languageCode: string = 'en-US'): Promise<string | null> {
    if (!this.isEnabled) return null;

    try {
      // 1. Determine the best voice for the language
      const voice = this.getBestVoice(languageCode);

      // 2. Build the request
      const request = {
        input: { text },
        // Select the language and SSML voice gender (optional)
        voice: { 
          languageCode, 
          name: voice,
          ssmlGender: 'NEUTRAL' as const
        },
        // select the type of audio encoding
        audioConfig: { audioEncoding: 'MP3' as const },
      };

      // 3. Perform the text-to-speech request
      console.log(`[TTS] Synthesizing speech (${text.length} chars) for ${languageCode} using voice ${voice}...`);
      
      try {
        const [response] = await this.client.synthesizeSpeech(request);
        
        if (!response.audioContent) {
          throw new Error('No audio content received from Google TTS');
        }

        // 4. Return as base64
        const audioBuffer = response.audioContent as Buffer;
        return audioBuffer.toString('base64');
      } catch (innerError: any) {
        console.warn(`[TTS] Voice ${voice} failed, trying standard fallback...`, innerError.message);
        
        // Fallback to a safe standard voice
        const fallbackRequest = {
          ...request,
          voice: { 
            languageCode, 
            ssmlGender: 'NEUTRAL' as const
          }
        };
        
        const [fallbackResponse] = await this.client.synthesizeSpeech(fallbackRequest);
        if (fallbackResponse.audioContent) {
          const audioBuffer = fallbackResponse.audioContent as Buffer;
          return audioBuffer.toString('base64');
        }
        throw innerError;
      }
    } catch (error) {
      console.error('[TTS] Synthesis failed:', error);
      return null;
    }
  }

  /**
   * Returns the best Neural/WaveNet voice for a given language code.
   */
  private getBestVoice(lang: string): string {
    const voices: Record<string, string> = {
      'en-US': 'en-US-Neural2-F',
      'en-GB': 'en-GB-Neural2-B',
      'hi-IN': 'hi-IN-Neural2-A',
      'ta-IN': 'ta-IN-Wavenet-A',
      'te-IN': 'te-IN-Standard-A', // Telugu doesn't always have Neural2 yet in all regions
      'kn-IN': 'kn-IN-Standard-A',
    };

    return voices[lang] || voices['en-US'];
  }
  
  getReadyStatus(): boolean {
    return this.isEnabled;
  }
}

// Export a singleton instance
export const googleTtsService = new GoogleTtsService();
