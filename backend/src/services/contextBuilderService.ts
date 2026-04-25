/**
 * Context Builder Service — Structured Context with Citations
 *
 * Replaces the brute-force text dumping in chatbotService.ts
 * with dynamic context sizing, source attribution, and relevance scoring.
 */

export interface CitedChunk {
  id: string;
  text: string;
  metadata: {
    source: string;
    documentType: string;
    sectionHeader?: string;
  };
  relevanceScore: number;
  citationNumber: number;
}

export interface BuiltContext {
  contextText: string;
  citations: CitedChunk[];
  tokenEstimate: number;
  confidence: "high" | "medium" | "low";
}

/**
 * Estimate token count (rough: ~4 chars per token for English).
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Build a structured, cited context block for the LLM system prompt.
 *
 * - Dynamically sizes based on query complexity
 * - Includes citation numbers for source attribution
 * - Computes confidence based on re-ranker scores
 * - Respects max token budget
 */
export function buildCitedContext(
  chunks: Array<{ id: string; text: string; metadata: any; relevanceScore: number }>,
  query: string,
  options?: { maxTokens?: number; minRelevance?: number }
): BuiltContext {
  const maxTokens = options?.maxTokens ?? 3000;
  const minRelevance = options?.minRelevance ?? 0.3;

  const citations: CitedChunk[] = [];
  let contextText = "## Retrieved Medical Information\n\n";
  let currentTokens = estimateTokens(contextText);

  // Dynamic sizing based on query type
  const isDetailedQuery = /symptoms?|treatment|diagnosis|causes?|management|prognosis/i.test(query);
  const chunkLimit = isDetailedQuery ? Math.min(chunks.length, 8) : Math.min(chunks.length, 5);

  // Filter by minimum relevance threshold
  const qualifiedChunks = chunks.filter((c) => c.relevanceScore >= minRelevance);

  let usedChunks = 0;
  for (let i = 0; i < Math.min(qualifiedChunks.length, chunkLimit); i++) {
    const chunk = qualifiedChunks[i];
    const chunkTokens = estimateTokens(chunk.text);

    if (currentTokens + chunkTokens + 20 > maxTokens) break;

    const citation: CitedChunk = {
      id: chunk.id,
      text: chunk.text,
      metadata: {
        source: chunk.metadata?.source || "unknown",
        documentType: chunk.metadata?.documentType || "general",
        sectionHeader: chunk.metadata?.sectionHeader,
      },
      relevanceScore: chunk.relevanceScore,
      citationNumber: usedChunks + 1,
    };
    citations.push(citation);

    contextText += `[${citation.citationNumber}] `;
    contextText += `${citation.metadata.documentType} — ${citation.metadata.source}`;
    if (citation.metadata.sectionHeader) {
      contextText += ` (${citation.metadata.sectionHeader})`;
    }
    contextText += ` [relevance: ${(citation.relevanceScore * 100).toFixed(1)}%]\n`;
    contextText += `${chunk.text.trim()}\n\n`;

    currentTokens += chunkTokens + 20;
    usedChunks++;
  }

  // Confidence assessment
  let confidence: BuiltContext["confidence"] = "low";
  if (usedChunks >= 3 && citations[0].relevanceScore > 0.75) {
    confidence = "high";
  } else if (usedChunks >= 2 && citations[0].relevanceScore > 0.5) {
    confidence = "medium";
  }

  if (usedChunks === 0) {
    contextText += "_No sufficiently relevant documents were found for this query._\n\n";
    confidence = "low";
  }

  contextText +=
    "\nWhen answering, cite sources using [1], [2], etc. " +
    "If the retrieved information is insufficient or irrelevant, say so clearly. " +
    "Do not fabricate information not present above.\n";

  return {
    contextText,
    citations,
    tokenEstimate: currentTokens,
    confidence,
  };
}
