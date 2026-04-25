/**
 * Query Intelligence Service
 *
 * Replaces primitive keyword matching in ragContextManager.ts
 * and simple anchoring in ragService.ts reformulateQuery().
 *
 * Provides:
 * - Medical entity extraction & synonym expansion
 * - Intent classification (symptom vs treatment vs emergency)
 * - HyDE (Hypothetical Document Embedding) generation
 * - Query variation generation for multi-query retrieval
 */

import axios from "axios";
import config from "../config";

// ─────────────────────────────────────────────
// Medical Synonym Expansion (UMLS-inspired)
// ─────────────────────────────────────────────

const MEDICAL_SYNONYMS: Record<string, string[]> = {
  "heart attack": ["myocardial infarction", "MI", "cardiac infarction", "acute coronary syndrome"],
  stroke: ["cerebrovascular accident", "CVA", "brain attack", "ischemic stroke", "hemorrhagic stroke"],
  "high blood pressure": ["hypertension", "HTN", "elevated BP"],
  "low blood sugar": ["hypoglycemia", "low glucose"],
  "chest pain": ["angina", "thoracic pain", "pectoris"],
  "shortness of breath": ["dyspnea", "SOB", "breathlessness", "air hunger"],
  fever: ["pyrexia", "hyperthermia", "febrile"],
  diabetes: ["diabetes mellitus", "DM", "type 1 diabetes", "type 2 diabetes", "T1DM", "T2DM"],
  cancer: ["malignancy", "neoplasm", "tumor", "carcinoma", "sarcoma"],
  headache: ["cephalgia", "migraine", "tension headache"],
  nausea: ["vomiting", "emesis", "queasiness"],
  fatigue: ["tiredness", "exhaustion", "lethargy", "asthenia"],
  cough: ["tussis", "dry cough", "productive cough"],
  rash: ["dermatitis", "urticaria", "eczema", "skin eruption"],
  "blood test": ["CBC", "complete blood count", "hematology panel"],
  "x-ray": ["radiograph", "radiography", "plain film"],
  MRI: ["magnetic resonance imaging", "MR scan"],
  CT: ["computed tomography", "CAT scan"],
  ECG: ["electrocardiogram", "EKG", "heart tracing"],
};

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface MedicalEntity {
  term: string;
  type: "condition" | "symptom" | "procedure" | "medication" | "anatomy" | "general";
  synonyms: string[];
  matchedText: string;
}

export interface ExpandedQuery {
  original: string;
  expanded: string;
  entities: MedicalEntity[];
  intent: "symptom_check" | "treatment_info" | "general_question" | "emergency" | "document_analysis";
  isEmergency: boolean;
}

// ─────────────────────────────────────────────
// Intent Classification
// ─────────────────────────────────────────────

export function classifyIntent(query: string): ExpandedQuery["intent"] {
  const lower = query.toLowerCase();

  if (/emergency|911|108|urgent|critical|severe|unconscious|not breathing|heart stopped|dying/i.test(lower)) {
    return "emergency";
  }

  if (/pain|hurt|ache|swelling|fever|nausea|vomit|bleeding|dizzy|rash|cough|headache|fatigue|numbness/i.test(lower)) {
    return "symptom_check";
  }

  if (/treatment|cure|medicine|drug|therapy|surgery|dose|dosage|prescription|remedy/i.test(lower)) {
    return "treatment_info";
  }

  if (/pdf|document|report|scan|prescription|lab|blood test|x-ray|mri|ct|ecg|upload/i.test(lower)) {
    return "document_analysis";
  }

  return "general_question";
}

// ─────────────────────────────────────────────
// Entity Extraction & Synonym Expansion
// ─────────────────────────────────────────────

export function expandMedicalQuery(query: string): ExpandedQuery {
  const lowerQuery = query.toLowerCase();
  const entities: MedicalEntity[] = [];
  let expanded = query;
  const intent = classifyIntent(query);
  let isEmergency = intent === "emergency";

  // Check for emergency keywords even if intent classifier missed edge cases
  if (/chest pain|can't breathe|severe bleeding|unconscious|stroke|heart attack/i.test(lowerQuery)) {
    isEmergency = true;
  }

  for (const [term, synonyms] of Object.entries(MEDICAL_SYNONYMS)) {
    if (lowerQuery.includes(term)) {
      let type: MedicalEntity["type"] = "general";
      if (/pain|fever|nausea|vomit|cough|fatigue|headache|rash|swelling|dizzy|numb|bleed/i.test(term))
        type = "symptom";
      else if (/attack|stroke|diabetes|cancer|hypertension/i.test(term)) type = "condition";
      else if (/x-ray|mri|ct|ecg|blood test|scan/i.test(term)) type = "procedure";

      entities.push({ term, type, synonyms, matchedText: term });
      expanded += ` ${synonyms.join(" ")}`;
    }
  }

  return { original: query, expanded, entities, intent, isEmergency };
}

// ─────────────────────────────────────────────
// Query Variations for Multi-Query Retrieval
// ─────────────────────────────────────────────

export function generateQueryVariations(query: string): string[] {
  const variations = new Set<string>([query]);
  const lower = query.toLowerCase();

  if (!lower.includes("symptom") && !lower.includes("sign")) {
    variations.add(`What are the symptoms and signs of ${query}?`);
  }
  if (!lower.includes("treatment") && !lower.includes("manage")) {
    variations.add(`How is ${query} treated or managed medically?`);
  }
  if (!lower.includes("cause") && !lower.includes("etiology")) {
    variations.add(`What are the causes and risk factors of ${query}?`);
  }
  if (!lower.includes("diagnosis") && !lower.includes("test")) {
    variations.add(`How is ${query} diagnosed? What tests are used?`);
  }

  return Array.from(variations).slice(0, 4); // Max 4 variations
}

// ─────────────────────────────────────────────
// HyDE (Hypothetical Document Embedding)
// ─────────────────────────────────────────────

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function generateHyDE(query: string): Promise<string> {
  const useHyDE = process.env.RAG_USE_HYDE !== "false";
  if (!useHyDE) return query;

  const startTime = Date.now();
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama-3.1-8b-instant", // Cheap, fast model for HyDE
        messages: [
          {
            role: "system",
            content:
              "You are a medical knowledge base. Generate a concise, factual paragraph (3-5 sentences) that would perfectly answer the user's health question. Use specific medical terminology. Do not include disclaimers.",
          },
          { role: "user", content: query },
        ],
        max_tokens: 200,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${config.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 8000,
      }
    );

    const hydeDoc = response.data?.choices?.[0]?.message?.content?.trim();
    if (hydeDoc && hydeDoc.length > 50) {
      console.log(
        `[HyDE] Generated hypothetical document (${hydeDoc.length} chars) in ${Date.now() - startTime}ms`
      );
      return hydeDoc;
    }
  } catch (err: any) {
    console.warn(
      `[HyDE] Generation failed after ${Date.now() - startTime}ms, falling back to original query:`,
      err.message
    );
  }

  console.log(`[HyDE] No useful hypothetical document generated in ${Date.now() - startTime}ms`);

  return query;
}
