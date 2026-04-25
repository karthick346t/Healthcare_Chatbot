/**
 * RAG Orchestrator — Advanced Retrieval Pipeline
 *
 * Master controller that wires together:
 * 1. Query Intelligence (expansion, entities, intent, HyDE)
 * 2. Hybrid Retrieval (dense Pinecone + sparse BM25)
 * 3. Fusion (Reciprocal Rank Fusion)
 * 4. Re-Ranking (cross-encoder BGE)
 * 5. Context Building (citations, dynamic sizing)
 *
 * Replaces: retrieveContext() and reformulateQuery() in ragService.ts
 * Replaces: ragContextManager.ts conversation memory (simplified)
 */

import { Pinecone } from "@pinecone-database/pinecone";
import config from "../config";
import {
  expandMedicalQuery,
  generateQueryVariations,
  generateHyDE,
  type ExpandedQuery,
} from "./queryIntelligenceService";
import { generateEmbedding, getEmbeddingDimension } from "./embeddingService";
import { sparseSearch, addSparseDocument, buildSparseIndex, clearSparseIndex } from "./sparseRetrievalService";
import { reciprocalRankFusion, type FusionResult } from "./retrievalFusionService";
import { rerankDocuments, initializeReranker, type RankedDocument } from "./rerankerService";
import { buildCitedContext, type BuiltContext } from "./contextBuilderService";

// ─────────────────────────────────────────────
// Pinecone Setup
// ─────────────────────────────────────────────

const pc = new Pinecone({ apiKey: config.PINECONE_API_KEY });
const pineconeIndex = pc.index(config.PINECONE_INDEX_NAME);

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface AdvancedRAGContext {
  contextText: string;
  citations: BuiltContext["citations"];
  confidence: BuiltContext["confidence"];
  tokenEstimate: number;
  queryInfo: ExpandedQuery;
  retrievalStats: {
    denseCandidates: number;
    sparseCandidates: number;
    fusedCandidates: number;
    finalChunks: number;
    latencyMs: number;
  };
}

export interface RetrievalConfig {
  useHyDE: boolean;
  useMultiQuery: boolean;
  useSparse: boolean;
  useReranker: boolean;
  topKDense: number;
  topKSparse: number;
  topKFusion: number;
  topKFinal: number;
  minRelevance: number;
  maxContextTokens: number;
}

export const DEFAULT_RETRIEVAL_CONFIG: RetrievalConfig = {
  useHyDE: process.env.RAG_USE_HYDE !== "false",
  useMultiQuery: true,
  useSparse: true,
  useReranker: process.env.RAG_USE_RERANKER !== "false",
  topKDense: 20,
  topKSparse: 20,
  topKFusion: 20,
  topKFinal: 5,
  minRelevance: 0.3,
  maxContextTokens: 3000,
};

// ─────────────────────────────────────────────
// Dense Retrieval (Pinecone)
// ─────────────────────────────────────────────

async function denseRetrieve(
  queryEmbedding: number[],
  topK: number,
  filters?: Record<string, any>
): Promise<Array<{ id: string; text: string; score: number; metadata: any }>> {
  const pineconeStart = Date.now();
  const req: any = {
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  };
  if (filters && Object.keys(filters).length > 0) {
    req.filter = filters;
  }

  const response = await pineconeIndex.query(req);
  const matches = (response.matches || []) as Array<{
    id: string;
    score?: number;
    metadata?: Record<string, any>;
  }>;

  console.log(
    `[Pinecone] Query returned ${(matches || []).length} matches in ${Date.now() - pineconeStart}ms (topK=${topK})`
  );

  return matches.map((m) => ({
    id: m.id,
    text: (m.metadata?.text as string) || "",
    score: m.score || 0,
    metadata: m.metadata || {},
  }));
}

// ─────────────────────────────────────────────
// Master Orchestrator
// ─────────────────────────────────────────────

export async function advancedRetrieveContext(
  query: string,
  conversationHistory: any[] = [],
  options: {
    config?: Partial<RetrievalConfig>;
    filters?: Record<string, any>;
  } = {}
): Promise<AdvancedRAGContext> {
  const startTime = Date.now();
  const cfg: RetrievalConfig = { ...DEFAULT_RETRIEVAL_CONFIG, ...options.config };

  try {
    const queryIntelStart = Date.now();
    // ── Step 1: Query Intelligence ─────────────────────────────
    const expanded = expandMedicalQuery(query);
    console.log(
      `[RAG] Query: "${query}" | Intent: ${expanded.intent} | Entities: ${expanded.entities.length}`
    );

    // Emergency short-circuit: if emergency detected, add explicit emergency context
    let emergencyPrefix = "";
    if (expanded.isEmergency) {
      emergencyPrefix =
        "EMERGENCY CONTEXT: The user may be experiencing a medical emergency. Prioritize safety and recommend immediate professional care. ";
      console.warn("[RAG] Emergency intent detected — adding safety prefix.");
    }
    const queryIntelMs = Date.now() - queryIntelStart;

    // ── Step 2: Generate Query Variations ──────────────────────
    const variationStart = Date.now();
    const queries = cfg.useMultiQuery
      ? generateQueryVariations(expanded.expanded)
      : [expanded.expanded];
    const variationMs = Date.now() - variationStart;

    // ── Step 3: Optional HyDE ──────────────────────────────────
    const hydeStart = Date.now();
    if (cfg.useHyDE) {
      const hydeDoc = await generateHyDE(query);
      if (hydeDoc !== query) {
        queries.push(hydeDoc);
      }
    }
    const hydeMs = Date.now() - hydeStart;

    // ── Step 4: Dense Retrieval (for each query variation) ─────
    const denseStart = Date.now();
    const denseCandidates: Array<{ id: string; text: string; score: number; metadata: any }> = [];
    for (const [index, q] of queries.entries()) {
      const perQueryStart = Date.now();
      const embedding = await generateEmbedding(q);
      const results = await denseRetrieve(embedding, cfg.topKDense, options.filters);
      denseCandidates.push(...results);
      console.log(
        `[RAG Dense] Query ${index + 1}/${queries.length} (${q.length} chars) finished in ${Date.now() - perQueryStart}ms and produced ${results.length} candidates`
      );
    }
    const denseMs = Date.now() - denseStart;

    // Deduplicate dense results (keep highest score per ID)
    const denseMap = new Map<string, (typeof denseCandidates)[0]>();
    for (const r of denseCandidates) {
      const existing = denseMap.get(r.id);
      if (!existing || existing.score < r.score) {
        denseMap.set(r.id, r);
      }
    }
    const uniqueDense = Array.from(denseMap.values()).sort((a, b) => b.score - a.score);

    // ── Step 5: Sparse Retrieval ───────────────────────────────
    const sparseStart = Date.now();
    let uniqueSparse: Array<{ id: string; text: string; score: number; metadata: any }> = [];
    if (cfg.useSparse) {
      const sparseCandidates = queries.flatMap((q) => sparseSearch(q, cfg.topKSparse));
      // Deduplicate
      const sparseMap = new Map<string, (typeof sparseCandidates)[0]>();
      for (const r of sparseCandidates) {
        const existing = sparseMap.get(r.id);
        if (!existing || existing.score < r.score) {
          sparseMap.set(r.id, r);
        }
      }
      uniqueSparse = Array.from(sparseMap.values()).sort((a, b) => b.score - a.score);
    }
    const sparseMs = Date.now() - sparseStart;

    // ── Step 6: Reciprocal Rank Fusion ─────────────────────────
    const fusionStart = Date.now();
    const fused = reciprocalRankFusion(uniqueDense, uniqueSparse, {
      k: 60,
      topK: cfg.topKFusion,
    });
    const fusionMs = Date.now() - fusionStart;

    // ── Step 7: Cross-Encoder Re-Ranking ───────────────────────
    const rerankStart = Date.now();
    let finalChunks: RankedDocument[] = fused.map((f) => ({
      id: f.id,
      text: f.text,
      metadata: f.metadata,
      relevanceScore: f.score, // RRF score as fallback
    }));

    if (cfg.useReranker) {
      finalChunks = await rerankDocuments(expanded.original, finalChunks, cfg.topKFinal);
    } else {
      finalChunks = finalChunks.slice(0, cfg.topKFinal);
    }
    const rerankMs = Date.now() - rerankStart;

    // ── Step 8: Build Cited Context ────────────────────────────
    const contextStart = Date.now();
    const context = buildCitedContext(
      finalChunks.map((c) => ({
        id: c.id,
        text: c.text,
        metadata: c.metadata,
        relevanceScore: c.relevanceScore,
      })),
      query,
      { maxTokens: cfg.maxContextTokens, minRelevance: cfg.minRelevance }
    );
    const contextMs = Date.now() - contextStart;

    // Prepend emergency context if detected
    if (emergencyPrefix) {
      context.contextText = emergencyPrefix + "\n\n" + context.contextText;
    }

    const latencyMs = Date.now() - startTime;
    console.log(
      `[RAG Timing] queryIntel=${queryIntelMs}ms | variations=${variationMs}ms | hyde=${hydeMs}ms | dense=${denseMs}ms | sparse=${sparseMs}ms | fusion=${fusionMs}ms | rerank=${rerankMs}ms | context=${contextMs}ms | total=${latencyMs}ms`
    );
    console.log(
      `[RAG] Retrieved ${finalChunks.length} chunks in ${latencyMs}ms (confidence: ${context.confidence})`
    );

    return {
      contextText: context.contextText,
      citations: context.citations,
      confidence: context.confidence,
      tokenEstimate: context.tokenEstimate,
      queryInfo: expanded,
      retrievalStats: {
        denseCandidates: uniqueDense.length,
        sparseCandidates: uniqueSparse.length,
        fusedCandidates: fused.length,
        finalChunks: finalChunks.length,
        latencyMs,
      },
    };
  } catch (error: any) {
    console.error("[RAG Orchestrator] Retrieval failed:", error.message);

    // Graceful degradation: return empty context with low confidence
    return {
      contextText: "## Retrieved Medical Information\n\n_No relevant documents could be retrieved due to a system error. Please rely on general medical knowledge._\n",
      citations: [],
      confidence: "low",
      tokenEstimate: 30,
      queryInfo: expandMedicalQuery(query),
      retrievalStats: {
        denseCandidates: 0,
        sparseCandidates: 0,
        fusedCandidates: 0,
        finalChunks: 0,
        latencyMs: Date.now() - startTime,
      },
    };
  }
}

// ─────────────────────────────────────────────
// Indexing Helpers (for document upload pipeline)
// ─────────────────────────────────────────────

export async function indexDocumentsToPinecone(
  chunks: Array<{ id: string; text: string; metadata: any; embedding: number[] }>
): Promise<void> {
  const vectors = chunks
    .map((c) => ({
      id: c.id,
      values: c.embedding,
      metadata: {
        ...c.metadata,
        text: c.text,
      },
    }))
    .filter((v) => v.values && v.values.length > 0);

  // Batch upserts
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await pineconeIndex.upsert({ records: batch });
  }

  // Also populate sparse index
  for (const chunk of chunks) {
    addSparseDocument(chunk.id, chunk.text, chunk.metadata);
  }
  buildSparseIndex();

  console.log(`[RAG] Indexed ${vectors.length} chunks to Pinecone + sparse index.`);
}

export async function getIndexStats(): Promise<{ totalCount: number; embeddingDimension: number; sparseSize: number }> {
  try {
    const stats = await pineconeIndex.describeIndexStats();
    return {
      totalCount: stats.totalRecordCount || 0,
      embeddingDimension: getEmbeddingDimension(),
      sparseSize: 0, // Sparse index is in-memory, not queryable here
    };
  } catch (err) {
    console.error("[Pinecone] Stats failed:", err);
    return { totalCount: 0, embeddingDimension: getEmbeddingDimension(), sparseSize: 0 };
  }
}

// ─────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────

export async function initializeRAG(): Promise<void> {
  console.log("[RAG] Initializing advanced retrieval pipeline...");
  await initializeReranker();
  console.log("[RAG] Advanced retrieval pipeline ready.");
}
