/**
 * RAG Service — Backward-Compatibility Re-Export Layer
 *
 * ⚠️  DEPRECATION NOTICE:
 * This file previously contained the entire naive RAG implementation.
 * All functionality has been split into focused service modules:
 *
 *   - chunkingService.ts         → Semantic + hierarchical chunking
 *   - embeddingService.ts        → Medical domain embeddings (PubMedBERT)
 *   - queryIntelligenceService.ts → Entity extraction, expansion, HyDE
 *   - sparseRetrievalService.ts  → BM25 keyword search
 *   - retrievalFusionService.ts  → Reciprocal Rank Fusion
 *   - rerankerService.ts         → Cross-encoder re-ranking
 *   - contextBuilderService.ts   → Structured citations
 *   - ragOrchestrator.ts         → Master pipeline
 *
 * This file now re-exports the new modules with legacy-compatible names
 * so existing imports across the codebase don't break immediately.
 */

import { Pinecone } from "@pinecone-database/pinecone";
import config from "../config";

// Re-export new services with legacy-compatible names
export {
  semanticChunkMedicalDocument,
  type Chunk,
  chunkDocument,
} from "./chunkingService";

export {
  generateEmbedding,
  getEmbeddingDimension,
  isMedicalModel,
  initializeEmbedder,
} from "./embeddingService";

export {
  expandMedicalQuery,
  generateQueryVariations,
  generateHyDE,
  classifyIntent,
  type ExpandedQuery,
  type MedicalEntity,
} from "./queryIntelligenceService";

export {
  reciprocalRankFusion,
  type FusionResult,
} from "./retrievalFusionService";

export {
  rerankDocuments,
  initializeReranker,
  type RankedDocument,
} from "./rerankerService";

export {
  buildCitedContext,
  type CitedChunk,
  type BuiltContext,
} from "./contextBuilderService";

export {
  advancedRetrieveContext,
  indexDocumentsToPinecone,
  getIndexStats,
  initializeRAG,
  type AdvancedRAGContext,
  type RetrievalConfig,
  DEFAULT_RETRIEVAL_CONFIG,
} from "./ragOrchestrator";

// ─────────────────────────────────────────────
// Legacy Pinecone Store (backward compatible)
// ─────────────────────────────────────────────

const pc = new Pinecone({ apiKey: config.PINECONE_API_KEY });
const index = pc.index(config.PINECONE_INDEX_NAME);

class PineconeStore {
  async addDocuments(chunks: Array<{ id: string; content: string; metadata: any; embedding?: number[] }>): Promise<void> {
    const vectors = chunks
      .filter((c) => c.embedding && c.embedding.length > 0)
      .map((chunk) => ({
        id: chunk.id,
        values: chunk.embedding!,
        metadata: {
          source: chunk.metadata?.source || "unknown",
          documentType: chunk.metadata?.documentType || "general",
          section: chunk.metadata?.section || "",
          text: chunk.content,
        },
      }));

    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert({ records: batch });
    }

    console.log(`[RAG] Upserted ${vectors.length} chunks to Pinecone.`);
  }

  async getStats(): Promise<{ totalCount: number }> {
    try {
      const stats = await index.describeIndexStats();
      return { totalCount: stats.totalRecordCount || 0 };
    } catch (err) {
      console.error("[Pinecone] Stats failed", err);
      return { totalCount: 0 };
    }
  }

  async search(
    queryEmbedding: number[],
    topK: number,
    threshold: number,
    filters?: any
  ): Promise<Array<{ chunk: { id: string; content: string; metadata: any }; similarity: number; rank: number }>> {
    const req: any = {
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    };
    if (filters && Object.keys(filters).length > 0) {
      req.filter = filters;
    }

    const response = await index.query(req);
    const matches = (response.matches || []) as Array<{
      id: string;
      score?: number;
      metadata?: Record<string, any>;
    }>;

    return matches
      .filter((match) => (match.score || 0) >= threshold)
      .map((match, idx) => ({
        chunk: {
          id: match.id,
          content: (match.metadata?.text as string) || "",
          metadata: {
            source: (match.metadata?.source as string) || "unknown",
            documentType: (match.metadata?.documentType as string) || "general",
            section: match.metadata?.section,
          },
        },
        similarity: match.score || 0,
        rank: idx + 1,
      }));
  }
}

const vectorStore = new PineconeStore();
export { vectorStore };

// ─────────────────────────────────────────────
// Legacy type re-exports (for import compatibility)
// ─────────────────────────────────────────────

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    page?: number;
    section?: string;
    documentType: "guideline" | "research" | "record" | "general";
    timestamp?: string;
  };
  embedding?: number[];
}

export interface RetrievalResult {
  chunk: DocumentChunk;
  similarity: number;
  rank: number;
}

export interface RAGContext {
  retrievedDocs: RetrievalResult[];
  query: string;
  reformulatedQuery?: string;
  timestamp: string;
}

// ─────────────────────────────────────────────
// Legacy function stubs (redirect to new pipeline)
// ─────────────────────────────────────────────

import { advancedRetrieveContext } from "./ragOrchestrator";

/**
 * @deprecated Use advancedRetrieveContext() from ragOrchestrator.ts instead.
 * This stub redirects to the new advanced pipeline for backward compatibility.
 */
export async function retrieveContext(
  query: string,
  conversationHistory: any[] = [],
  options: {
    topK?: number;
    threshold?: number;
    documentType?: string;
    source?: string;
  } = {}
): Promise<RAGContext> {
  const result = await advancedRetrieveContext(query, conversationHistory, {
    config: {
      topKFinal: options.topK ?? 5,
      minRelevance: options.threshold ?? 0.3,
    },
    filters: options.documentType
      ? { documentType: options.documentType }
      : options.source
        ? { source: options.source }
        : undefined,
  });

  return {
    retrievedDocs: result.citations.map((c, i) => ({
      chunk: {
        id: c.id,
        content: c.text,
        metadata: {
          source: c.metadata.source,
          documentType: c.metadata.documentType as any,
          section: c.metadata.sectionHeader,
        },
      },
      similarity: c.relevanceScore,
      rank: i + 1,
    })),
    query,
    reformulatedQuery: result.queryInfo.expanded,
    timestamp: new Date().toISOString(),
  };
}

// Legacy chunkDocument and embedChunks are re-exported from new services above.

/**
 * @deprecated The reformulateQuery logic is now handled by queryIntelligenceService.expandMedicalQuery().
 */
export async function reformulateQuery(query: string, conversationHistory: any[] = []): Promise<string> {
  const { expandMedicalQuery } = await import("./queryIntelligenceService");
  return expandMedicalQuery(query).expanded;
}

/**
 * @deprecated Use indexDocumentsToPinecone() from ragOrchestrator.ts instead.
 */
export async function indexDocuments(
  documents: Array<{ content: string; metadata: DocumentChunk["metadata"] }>
): Promise<void> {
  const { semanticChunkMedicalDocument } = await import("./chunkingService");
  const { embedChunks } = await import("./embeddingService");
  const { indexDocumentsToPinecone } = await import("./ragOrchestrator");

  const allChunks: Array<{ id: string; text: string; metadata: any }> = [];
  for (const doc of documents) {
    const chunks = await semanticChunkMedicalDocument(doc.content, doc.metadata.source, doc.metadata.documentType);
    allChunks.push(...chunks);
  }

  const embedded = await embedChunks(allChunks);
  await indexDocumentsToPinecone(embedded);
}

// Re-export chunkDocument and embedChunks from their new homes for default export compatibility
async function _chunkDocument(
  content: string,
  metadata: DocumentChunk["metadata"],
  chunkSize?: number,
  overlap?: number
): Promise<Array<{ id: string; text: string; metadata: any }>> {
  const { chunkDocument: cd } = await import("./chunkingService");
  return cd(content, metadata, chunkSize, overlap);
}

async function _embedChunks(
  chunks: DocumentChunk[]
): Promise<DocumentChunk[]> {
  const { embedChunks: ec } = await import("./embeddingService");
  const input = chunks.map((c) => ({ id: c.id, text: c.content, metadata: c.metadata }));
  const embedded = await ec(input);
  return embedded.map((e) => ({ ...e, content: e.text } as DocumentChunk));
}

// Default export for legacy imports
export default {
  retrieveContext,
  indexDocuments,
  chunkDocument: _chunkDocument,
  embedChunks: _embedChunks,
  reformulateQuery,
  vectorStore,
};
