import axios from 'axios';
import { cleanModelText } from '../utils/cleanText';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// ✅ SEPARATE MODELS
const VISION_MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';
const TEXT_MODEL = 'openai/gpt-oss-120b:free';

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
  }[];
}


export async function analyzeImagesWithNvidia(
  base64Images: string[],
  fileName: string,
  locale: string = 'en',
  conversationHistory: any[] = [],
  isDocument: boolean = false
): Promise<{ analysis: string; isHealthRelated: boolean }> {
  try {
    const messages: any[] = [
      {
        role: 'system',
        content: `You are a helpful medical assistant with advanced vision capabilities. 

**STRICT RELEVANCE RULE:**
- If the image is NOT health-related, you MUST return ONLY this exact phrase: "⚠️ This image does not appear to be health-related."
- You are STRICTLY FORBIDDEN from providing any descriptions, details, or summaries for non-medical images.
- If it IS health-related, provide a clear, empathetic analysis.`
      }
    ];

    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        if (msg.role !== 'system') {
          messages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          });
        }
      });
    }

    let promptText = isDocument
      ? `Analyze this health document image ("${fileName}"). Extract text and provide a brief summary.`
      : `Analyze this medical image ("${fileName}"). Describe findings.`;

    const content: any[] = [{ type: 'text', text: promptText }];

    base64Images.forEach((base64Image) => {
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${base64Image}`
        }
      });
    });

    messages.push({ role: 'user', content });

    console.log(`[Vision] Sending ${fileName} (${base64Images.length} image(s)) to ${VISION_MODEL}`);

    const response = await axios.post<OpenRouterResponse>(
      `${OPENROUTER_BASE_URL}/chat/completions`,

      {
        model: VISION_MODEL,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.2
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Healthcare Chatbot'
        }
      }
    );

    let text = response.data?.choices?.[0]?.message?.content || '';
    text = cleanModelText(text);

    if (!text) {
      return {
        analysis: `I received your image "${fileName}", but couldn't generate an analysis. Please ensure it is clear.`,
        isHealthRelated: false
      };
    }

    const isHealthRelated = !text.includes('⚠️') && !text.toLowerCase().includes('not appear to be health-related');

    return { analysis: text, isHealthRelated };

  } catch (error: any) {
    console.error('Vision analysis error:', error.message);
    return { analysis: "I encountered an error analyzing this image.", isHealthRelated: false };
  }
}

export async function analyzeDocumentTextWithNvidia(
  documentText: string,
  fileName: string,
  locale: string = 'en',
  conversationHistory: any[] = []
): Promise<{ analysis: string; isHealthRelated: boolean }> {
  try {
    // ✅ NEW "SHORT & SIMPLE" SYSTEM PROMPT
    const systemInstructions = `You are a helpful Medical Assistant AI.
Your goal is to provide high-level medical document analysis.

**STRICT RELEVANCE RULE (CRITICAL):**
1. **Relevance Check:** Determine if the content is CLINICAL or PATIENT-HEALTH related.
2. **Non-Medical Content:** If the text is NOT health-related, or if it is a TECHNICAL/ENGINEERING/PROJECT REPORT (e.g., software architecture, Airflow guides, project management reports about healthcare systems), you MUST return ONLY this exact phrase: "⚠️ This document does not appear to be health-related."
3. **NO DETAILS:** You are STRICTLY FORBIDDEN from providing any summary, analysis, or details for non-medical or technical/engineering documents. Return ONLY the warning.

**IF CLINICAL/PATIENT-HEALTH RELATED, FOLLOW THIS STRUCTURE:**
   * **Document Type:** (e.g., Clinical Assessment, Lab Report)
   * **Summary:** (1-2 sentences on the main purpose or findings)
   * **Key Observations:** (Significant medical findings.)
   * **Closing:** Ask if the user wants more details.

**Tone:** Professional and direct.`;

    const messages: any[] = [];

    // Add conversation history if exists
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        if (msg.role !== 'system') {
          messages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          });
        }
      });
    }

    const wordCount = documentText.split(/\s+/).length;
    const truncatedText = documentText.slice(0, 15000);

    // Merged approach: Prepend instructions to avoid "Developer instruction" errors in some free models
    messages.push({
      role: 'user',
      content: `${systemInstructions}\n\nI've uploaded a document called "${fileName}" (${wordCount} words).\nPlease give me a short summary:\n\n"""\n${truncatedText}\n"""`
    });

    console.log(`[Text] Sending ${wordCount} words to ${TEXT_MODEL}`);

    const response = await axios.post<OpenRouterResponse>(
      `${OPENROUTER_BASE_URL}/chat/completions`,

      {
        model: TEXT_MODEL,
        messages: messages,
        max_tokens: 1000, // Reduced token limit since we want short answers
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Healthcare Chatbot'
        }
      }
    );

    let text = response.data?.choices?.[0]?.message?.content || '';
    text = cleanModelText(text);

    if (!text) {
      return {
        analysis: `I reviewed "${fileName}", but the analysis came back empty.`,
        isHealthRelated: false
      };
    }

    const isHealthRelated = !text.includes('⚠️') && !text.toLowerCase().includes('not appear to be health-related');

    return { analysis: text, isHealthRelated };

  } catch (error: any) {
    console.error('Document text analysis error:', error.response?.data || error.message);

    if (error.response?.status === 429) {
      return {
        analysis: `I'm experiencing high traffic. Please try again in a moment.`,
        isHealthRelated: false
      };
    }

    return {
      analysis: `I'm having trouble analyzing "${fileName}" right now.`,
      isHealthRelated: false
    };
  }
}