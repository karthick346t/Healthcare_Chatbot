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
      apiKey && apiKey !== 'YOUR_GOOGLE_API_KEY' ? { apiKey, fallback: 'rest' } : { fallback: 'rest' }
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

      // 2. Chunk text to respect Google's 5000 byte limit
      // Using 1500 chars to be safe with multibyte characters (e.g. Indic languages)
      const MAX_LENGTH = 1500;
      const textChunks: string[] = [];
      let currentText = text;
      
      while (currentText.length > 0) {
        if (currentText.length <= MAX_LENGTH) {
          textChunks.push(currentText);
          break;
        }
        
        let splitIndex = currentText.lastIndexOf(' ', MAX_LENGTH);
        // Look for natural sentence boundaries to prefer over just spaces
        const punctuationIndex = Math.max(
          currentText.lastIndexOf('. ', MAX_LENGTH),
          currentText.lastIndexOf(', ', MAX_LENGTH),
          currentText.lastIndexOf('\n', MAX_LENGTH)
        );
        
        if (punctuationIndex > MAX_LENGTH / 2) {
           splitIndex = punctuationIndex + 1; // Include punctuation
        } else if (splitIndex === -1) {
           splitIndex = MAX_LENGTH; // Word is longer than MAX_LENGTH, hard split
        }
        
        textChunks.push(currentText.substring(0, splitIndex));
        currentText = currentText.substring(splitIndex).trim();
      }

      const audioBuffers: Buffer[] = [];

      // 3. Perform text-to-speech requests for each chunk
      for (const [index, chunk] of textChunks.entries()) {
        const request = {
          input: { text: chunk },
          voice: { 
            languageCode, 
            name: voice
          },
          audioConfig: { audioEncoding: 'MP3' as const },
        };

        console.log(`[TTS] Synthesizing chunk ${index + 1}/${textChunks.length} (${chunk.length} chars) for ${languageCode}...`);
        
        try {
          const [response] = await this.client.synthesizeSpeech(request);
          if (!response.audioContent) {
            throw new Error('No audio content received from Google TTS chunk');
          }
          audioBuffers.push(response.audioContent as Buffer);
        } catch (innerError: any) {
          console.warn(`[TTS] Voice ${voice} failed on chunk ${index + 1}, trying standard fallback...`, innerError.message);
          
          const fallbackRequest = {
            ...request,
            voice: { languageCode }
          };
          
          const [fallbackResponse] = await this.client.synthesizeSpeech(fallbackRequest);
          if (fallbackResponse.audioContent) {
            audioBuffers.push(fallbackResponse.audioContent as Buffer);
          } else {
            throw innerError;
          }
        }
      }

      // 4. Return as concatenated base64 (MP3 buffers can simply be concatenated)
      return Buffer.concat(audioBuffers).toString('base64');
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
