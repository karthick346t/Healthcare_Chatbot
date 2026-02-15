import axios from 'axios';
import { cleanModelText } from '../utils/cleanText';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// ✅ SEPARATE MODELS
const VISION_MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';
const TEXT_MODEL = 'google/gemma-3-27b-it:free';

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
If the image is NOT health-related, clearly state: "⚠️ This image does not appear to be health-related."
If it IS health-related, provide a clear, empathetic analysis of findings.`
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
    const messages: any[] = [
      {
        role: 'system',
        content: `You are a helpful Medical Assistant AI.
Your goal is to provide a **brief, high-level overview** of uploaded medical documents.

**Instructions:**
1. **Determine Relevance:** If the text is NOT health-related, say: "⚠️ This document does not appear to be health-related."
2. **Be Concise:** Do NOT generate long tables or full reports unless explicitly asked.
3. **Structure:**
   * **Document Type:** (e.g., Lab Report, Prescription)
   * **Summary:** (1-2 sentences on the main diagnosis or reason for visit)
   * **Key Alerts:** (Only mention Critical/High/Low values that need immediate attention. If none, skip this.)
   * **Closing:** Ask the user if they want to see the full lab results, treatment plan, or specific details.

**Tone:** Professional, calm, and concise.`
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

    const wordCount = documentText.split(/\s+/).length;
    const truncatedText = documentText.slice(0, 15000);

    messages.push({
      role: 'user',
      content: `I've uploaded a document called "${fileName}" (${wordCount} words).
Please give me a short summary.

"""
${truncatedText}
"""`
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