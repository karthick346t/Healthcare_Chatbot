/**
 * RAG Service - Retrieval-Augmented Generation for Healthcare Chatbot
 *
 * This service handles:
 * - Document chunking and embedding
 * - Vector similarity search
 * - Query reformulation
 * - Context retrieval and ranking
 */

import * as fs from "fs";
import * as path from "path";
import { Pinecone } from '@pinecone-database/pinecone';
import config from '../config';
// import { pipeline } from "@xenova/transformers"; // Removed for dynamic import compatibility

// ============================================
// Types & Interfaces
// ============================================

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

/**
 * Shape of precomputed embeddings exported from the Python RAG pipeline.
 */
interface PrecomputedEmbeddingRecord {
  id: string;
  source: string;
  chunk_index: number;
  text: string;
  embedding: number[];
}

// ============================================
// Configuration
// ============================================

const MAX_CHUNK_SIZE = 1000; // characters per chunk
const CHUNK_OVERLAP = 200; // characters overlap between chunks
const TOP_K = 5; // Number of documents to retrieve
const SIMILARITY_THRESHOLD = 0.45; // Minimum similarity score

// ============================================
// SBERT Embedding (local, via @xenova/transformers)
// ============================================

let embeddingPipelinePromise: Promise<any> | null = null;

/**
 * Lazy-load a SBERT-compatible embedding pipeline.
 * Make sure to use the SAME model family as in your Python export script.
 * JS uses the Xenova ONNX export of all-MiniLM-L6-v2.
 */
async function getEmbeddingPipeline() {
  if (!embeddingPipelinePromise) {
    const { pipeline } = await (eval('import("@xenova/transformers")') as Promise<any>);
    embeddingPipelinePromise = pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2" // ONNX export matching sentence-transformers/all-MiniLM-L6-v2
    );
  }
  return embeddingPipelinePromise;
}

/**
 * Generates embeddings for text using local SBERT (no external API).
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const pipe = await getEmbeddingPipeline();
    const output = await pipe(text, { pooling: "mean", normalize: true });
    const data = output.data as Float32Array | number[];
    return Array.from(data);
  } catch (error: any) {
    console.error(
      "[RAG] SBERT embedding generation failed:",
      error?.message || error
    );
    throw error;
  }
}

// ============================================
// Document Chunking
// ============================================

/**
 * Chunks medical documents intelligently, preserving context
 */
export function chunkDocument(
  content: string,
  metadata: DocumentChunk["metadata"],
  chunkSize: number = MAX_CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];

  // Split by paragraphs first (preserve medical document structure)
  const paragraphs = content
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0);

  let currentChunk = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed chunk size
    if (
      currentChunk.length + paragraph.length > chunkSize &&
      currentChunk.length > 0
    ) {
      // Save current chunk
      chunks.push({
        id: `${metadata.source}_chunk_${chunkIndex}`,
        content: currentChunk.trim(),
        metadata: {
          ...metadata,
          section: `chunk_${chunkIndex}`,
        },
      });

      // Start new chunk with overlap
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + "\n\n" + paragraph;
      chunkIndex++;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  // Add remaining chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `${metadata.source}_chunk_${chunkIndex}`,
      content: currentChunk.trim(),
      metadata: {
        ...metadata,
        section: `chunk_${chunkIndex}`,
      },
    });
  }

  return chunks;
}

// ============================================
// Embedding Generation for New Documents
// ============================================

/**
 * Batch generate embeddings for multiple chunks (for new docs indexed in Node).
 */
export async function embedChunks(
  chunks: DocumentChunk[]
): Promise<DocumentChunk[]> {
  const embeddedChunks: DocumentChunk[] = [];

  // Process in batches
  const batchSize = 10;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const embeddingPromises = batch.map((chunk) =>
      generateEmbedding(chunk.content).then((embedding) => ({
        ...chunk,
        embedding,
      }))
    );

    const embedded = await Promise.all(embeddingPromises);
    embeddedChunks.push(...embedded);
  }

  return embeddedChunks;
}

const pc = new Pinecone({
  apiKey: config.PINECONE_API_KEY
});
const index = pc.index(config.PINECONE_INDEX_NAME);

class PineconeStore {
  async addDocuments(chunks: DocumentChunk[]): Promise<void> {
    const embedded = await embedChunks(chunks);
    const vectors = embedded.map(chunk => {
      // Pinecone allows certain nested formats but keeping it flat is safer.
      const md = {
        source: chunk.metadata.source,
        documentType: chunk.metadata.documentType || "general",
        section: chunk.metadata.section || "",
        text: chunk.content
      };
      
      return {
        id: chunk.id,
        values: chunk.embedding as number[],
        metadata: md
      };
    }).filter(v => v.values && v.values.length > 0);
    
    // Batch upserts to Pinecone
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert({ records: batch });
    }
    
    console.log(`[RAG] Upserted ${vectors.length} chunks to Pinecone index ${config.PINECONE_INDEX_NAME}`);
  }

  async getStats(): Promise<{ totalCount: number }> {
    try {
      const stats = await index.describeIndexStats();
      return { totalCount: stats.totalRecordCount || 0 };
    } catch (err) {
      console.error("[Pinecone] Failed to get stats", err);
      return { totalCount: 0 };
    }
  }

  async search(
    queryEmbedding: number[],
    topK: number,
    threshold: number,
    filters?: any
  ): Promise<RetrievalResult[]> {
    const queryRequest: any = {
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true
    };
    if (filters && Object.keys(filters).length > 0) {
      queryRequest.filter = filters;
    }

    try {
      const response = await index.query(queryRequest);
      const matches = response.matches || [];
      
      return matches
        .filter(match => match.score && match.score >= threshold)
        .map((match, idx) => ({
          chunk: {
            id: match.id,
            content: (match.metadata as any)?.text || "",
            metadata: {
              source: (match.metadata as any)?.source || "unknown",
              documentType: ((match.metadata as any)?.documentType as any) || "general",
              section: (match.metadata as any)?.section
            }
          },
          similarity: match.score as number,
          rank: idx + 1
        }));
    } catch (err: any) {
      console.error("[Pinecone] Search failed", err);
      return [];
    }
  }
}

// Global instance to expose for backward API compatibility with our script structures
const vectorStore = new PineconeStore();

// ============================================
// Cosine Similarity Calculation
// ============================================

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

// ============================================
// Query Reformulation
// ============================================

/**
 * Reformulates query to improve retrieval accuracy
 * Expands medical terminology and adds context
 */
export async function reformulateQuery(
  query: string,
  conversationHistory: any[] = []
): Promise<string> {
  const trimmed = query.trim();

  // If the query is very short (likely a follow-up pronoun like "it", "that", "yes"),
  // anchor it with just the first sentence of the last assistant reply so the
  // embedding is meaningful without being polluted by full history.
  if (trimmed.length < 25 && conversationHistory.length > 0) {
    const lastBotMsg = [...conversationHistory]
      .reverse()
      .find((m) => m.role === 'assistant');
    if (lastBotMsg) {
      const anchor = lastBotMsg.content
        .split(/[.!?]/)[0]  // First sentence only
        .slice(0, 80)        // Max 80 chars
        .trim();
      if (anchor) {
        return `${trimmed} (context: ${anchor})`;
      }
    }
  }

  // Default: use the query as-is for clean, focused embedding
  return trimmed;
}

// ============================================
// Main RAG Retrieval Function
// ============================================

/**
 * Retrieves relevant medical documents for a query
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
  try {
    // 1. Reformulate query with conversation context
    const reformulatedQuery = await reformulateQuery(query, conversationHistory);
    console.log(`[RAG] Reformulated query: "${reformulatedQuery}"`);

    // 2. Generate query embedding (local SBERT)
    console.log("[RAG] Generating query embedding...");
    const queryEmbedding = await generateEmbedding(reformulatedQuery);

    // 3. Build filters
    const filters: { documentType?: string; source?: string } = {};
    if (options.documentType) filters.documentType = options.documentType;
    if (options.source) filters.source = options.source;

    // 4. Search Pinecone vector store
    console.log(`[RAG] Searching Pinecone...`);
    const results = await vectorStore.search(
      queryEmbedding,
      options.topK || TOP_K,
      options.threshold || SIMILARITY_THRESHOLD,
      Object.keys(filters).length > 0 ? filters : undefined
    );

    console.log(`[RAG] Found ${results.length} relevant documents`);

    return {
      retrievedDocs: results,
      query,
      reformulatedQuery,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("[RAG] Retrieval failed:", error.message);
    console.error("[RAG] Error details:", error);
    return {
      retrievedDocs: [],
      query,
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================
// Document Loading & Indexing
// ============================================

/**
 * Load and index documents from various sources
 * (for new docs indexed directly in Node)
 */
export async function indexDocuments(
  documents: Array<{
    content: string;
    metadata: DocumentChunk["metadata"];
  }>
): Promise<void> {
  const allChunks: DocumentChunk[] = [];

  for (const doc of documents) {
    const chunks = chunkDocument(doc.content, doc.metadata);
    allChunks.push(...chunks);
  }

  await vectorStore.addDocuments(allChunks);
  console.log(
    `[RAG] Indexed ${documents.length} documents into ${allChunks.length} chunks`
  );
}

// ============================================
// Load Precomputed Embeddings from Python RAG
// Deprecated: Now we use Pinecone upload script.
// ============================================

// ============================================
// Exports
// ============================================

export { vectorStore };
export default {
  retrieveContext,
  indexDocuments,
  chunkDocument,
  embedChunks,
  reformulateQuery,
  vectorStore,
};
