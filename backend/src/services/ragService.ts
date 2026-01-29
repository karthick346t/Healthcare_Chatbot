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
import { pipeline } from "@xenova/transformers";

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

const MAX_CHUNK_SIZE = 500; // characters per chunk
const CHUNK_OVERLAP = 50; // characters overlap between chunks
const TOP_K = 5; // Number of documents to retrieve
const SIMILARITY_THRESHOLD = 0.3; // Minimum similarity score

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

// ============================================
// Vector Store (In-Memory)
// ============================================

class VectorStore {
  private documents: DocumentChunk[] = [];

  /**
   * Add documents to the vector store (computes embeddings for them).
   * Use this for NEW documents indexed from Node.
   */
  async addDocuments(chunks: DocumentChunk[]): Promise<void> {
    const embedded = await embedChunks(chunks);
    this.documents.push(...embedded);
    console.log(
      `[RAG] Added ${embedded.length} chunks to vector store (total: ${this.documents.length})`
    );
  }

  /**
   * Add documents that ALREADY have embeddings (from Python RAG export).
   */
  async addPreembeddedDocuments(chunks: DocumentChunk[]): Promise<void> {
    const valid = chunks.filter(
      (c) => Array.isArray(c.embedding) && c.embedding!.length > 0
    );
    this.documents.push(...valid);
    console.log(
      `[RAG] Loaded ${valid.length} pre-embedded chunks into vector store (total: ${this.documents.length})`
    );
  }

  /**
   * Search for similar documents using cosine similarity
   */
  async search(
    queryEmbedding: number[],
    topK: number = TOP_K,
    threshold: number = SIMILARITY_THRESHOLD,
    filters?: { documentType?: string; source?: string }
  ): Promise<RetrievalResult[]> {
    if (this.documents.length === 0) {
      return [];
    }

    // Calculate cosine similarity for all documents
    const similarities = this.documents
      .map((doc, index) => {
        if (!doc.embedding) return null;

        // Apply filters
        if (
          filters?.documentType &&
          doc.metadata.documentType !== filters.documentType
        ) {
          return null;
        }
        if (filters?.source && doc.metadata.source !== filters.source) {
          return null;
        }

        const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
        return {
          chunk: doc,
          similarity,
          rank: index,
        };
      })
      .filter(
        (result): result is RetrievalResult =>
          result !== null && result.similarity >= threshold
      )
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map((result, index) => ({
        ...result,
        rank: index + 1,
      }));

    return similarities;
  }

  /**
   * Get all documents (for debugging)
   */
  getDocuments(): DocumentChunk[] {
    return this.documents;
  }

  /**
   * Clear the vector store
   */
  clear(): void {
    this.documents = [];
  }
}

// Singleton instance
const vectorStore = new VectorStore();

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
  // Extract key medical terms from conversation history
  const recentContext = conversationHistory
    .slice(-4) // Last 4 messages
    .map((msg) => msg.content)
    .join(" ");

  // Combine query with recent context
  const enhancedQuery = recentContext
    ? `${query}. Context: ${recentContext}`
    : query;

  // For now, return enhanced query
  // In production, you could use DeepSeek / other model to reformulate.
  return enhancedQuery;
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
    // Check if vector store has documents
    const docCount = vectorStore.getDocuments().length;
    if (docCount === 0) {
      console.log("[RAG] Vector store is empty. No documents indexed yet.");
      return {
        retrievedDocs: [],
        query,
        timestamp: new Date().toISOString(),
      };
    }

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

    // 4. Search vector store
    console.log(`[RAG] Searching ${docCount} documents in vector store...`);
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

/**
 * Load documents from CSV (for healthcare dataset)
 */
export async function loadDocumentsFromCSV(
  csvPath: string,
  questionColumn: string = "question",
  answerColumn: string = "answer"
): Promise<void> {
  // Not implemented here; you can wire a CSV parser if needed.
  console.log(
    `[RAG] CSV loading not implemented. Use indexDocuments() instead.`
  );
}

// ============================================
// Load Precomputed Embeddings from Python RAG
// ============================================

/**
 * Load precomputed MedlinePlus embeddings exported by the Python RAG pipeline.
 * Expects: src/data/medlineplus_embeddings.jsonl
 */
export async function loadPrecomputedEmbeddings(): Promise<void> {
  try {
    const embeddingsPath = path.join(
      process.cwd(),
      "data",
      "medlineplus_embeddings.jsonl"
    );

    if (!fs.existsSync(embeddingsPath)) {
      console.warn(
        `[RAG] Precomputed embeddings file not found at ${embeddingsPath}`
      );
      return;
    }

    const fileContents = fs.readFileSync(embeddingsPath, "utf-8");
    const lines = fileContents
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0);

    const docs: DocumentChunk[] = lines.map((line) => {
      const rec: PrecomputedEmbeddingRecord = JSON.parse(line);
      return {
        id: rec.id,
        content: rec.text,
        metadata: {
          source: rec.source,
          section: `chunk_${rec.chunk_index}`,
          documentType: "general", // you can refine this if you export documentType
        },
        embedding: rec.embedding,
      };
    });

    await vectorStore.addPreembeddedDocuments(docs);
  } catch (error: any) {
    console.error(
      "[RAG] Failed to load precomputed embeddings:",
      error?.message || error
    );
  }
}

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
  loadPrecomputedEmbeddings,
};
