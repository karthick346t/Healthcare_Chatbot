/**
 * Re-Ranker Service — Cross-Encoder Precision Scoring
 *
 * Takes the fused candidate set from hybrid retrieval and re-scores
 * each (query, document) pair with a cross-encoder for true relevance.
 * This is the single biggest precision improvement in the pipeline.
 */

import { pipeline } from "@xenova/transformers";

// The transformer pipeline returns a generic pipeline object; we use any to avoid strict type mismatches.
let reranker: any = null;
let rerankerReady = false;

/**
 * Cross-encoder re-ranker model options:
 * - "Xenova/bge-reranker-base" (recommended, ~110M params, best quality)
 * - "Xenova/ms-marco-MiniLM-L-12-v2" (faster, ~33M params)
 * - "mixedbread-ai/mxbai-rerank-xsmall-v1" (tiny, fastest)
 */
const RERANKER_MODEL = process.env.RERANKER_MODEL || "Xenova/bge-reranker-base";

export async function initializeReranker(): Promise<void> {
  const useReranker = process.env.RAG_USE_RERANKER !== "false";
  if (!useReranker) {
    console.log("[Reranker] Disabled via RAG_USE_RERANKER=false");
    return;
  }
  if (rerankerReady) return;

  console.log(`[Reranker] Loading ${RERANKER_MODEL}...`);
  reranker = await pipeline("text-classification", RERANKER_MODEL);
  rerankerReady = true;
  console.log(`[Reranker] ${RERANKER_MODEL} loaded.`);
}

export interface RankedDocument {
  id: string;
  text: string;
  metadata: any;
  relevanceScore: number; // 0.0 - 1.0
}

export async function rerankDocuments(
  query: string,
  documents: Array<{ id: string; text: string; metadata: any }>,
  topK: number = 5
): Promise<RankedDocument[]> {
  if (!rerankerReady || !reranker) {
    // Reranker disabled or not loaded — return documents as-is with placeholder scores
    return documents.slice(0, topK).map((d, i) => ({
      ...d,
      relevanceScore: 1 - i * 0.05, // Decay fallback
    }));
  }

  if (documents.length === 0) return [];

  // Build query-document pairs for cross-encoder
  const pairs = documents.map((d) => `${query} [SEP] ${d.text.substring(0, 512)}`);

  // Batch inference (batch_size tunable based on memory)
  const batchSize = 8;
  const allScores: number[] = [];

  for (let i = 0; i < pairs.length; i += batchSize) {
    const batch = pairs.slice(i, i + batchSize);
    const outputs = (await reranker(batch, { batch_size: batchSize })) as Array<{
      label: string;
      score: number;
    }>;

    for (const out of outputs) {
      // BGE reranker outputs LABEL_1 for relevant, LABEL_0 for not relevant
      const score = out.label === "LABEL_1" ? out.score : 1 - out.score;
      allScores.push(Math.max(0, Math.min(1, score)));
    }
  }

  const ranked = documents
    .map((doc, i) => ({
      ...doc,
      relevanceScore: allScores[i] ?? 0,
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topK);

  return ranked;
}
