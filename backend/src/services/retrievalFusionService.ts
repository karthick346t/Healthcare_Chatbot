/**
 * Retrieval Fusion Service — Reciprocal Rank Fusion (RRF)
 *
 * Combines dense (vector) and sparse (BM25) retrieval results into
 * a single unified ranking. RRF is algorithm-agnostic and works
 * without calibrating score distributions between different search methods.
 */

export interface FusionResult {
  id: string;
  text: string;
  score: number;
  metadata: any;
  sources: Array<"dense" | "sparse">;
  denseRank?: number;
  sparseRank?: number;
}

/**
 * Reciprocal Rank Fusion
 * Formula: score = Σ(1 / (k + rank_i)) for each list the document appears in
 * k = 60 is the standard constant that dampens the impact of low ranks.
 */
export function reciprocalRankFusion(
  denseResults: Array<{ id: string; text: string; score: number; metadata: any }>,
  sparseResults: Array<{ id: string; text: string; score: number; metadata: any }>,
  options?: { k?: number; topK?: number }
): FusionResult[] {
  const k = options?.k ?? 60;
  const topK = options?.topK ?? 20;

  const scores = new Map<string, {
    score: number;
    text: string;
    metadata: any;
    sources: Set<"dense" | "sparse">;
    denseRank?: number;
    sparseRank?: number;
  }>();

  // Score dense results by rank
  denseResults.forEach((r, idx) => {
    const rrfScore = 1 / (k + idx + 1);
    const existing = scores.get(r.id);
    if (existing) {
      existing.score += rrfScore;
      existing.sources.add("dense");
      existing.denseRank = idx + 1;
    } else {
      scores.set(r.id, {
        score: rrfScore,
        text: r.text,
        metadata: r.metadata,
        sources: new Set(["dense"]),
        denseRank: idx + 1,
      });
    }
  });

  // Score sparse results by rank
  sparseResults.forEach((r, idx) => {
    const rrfScore = 1 / (k + idx + 1);
    const existing = scores.get(r.id);
    if (existing) {
      existing.score += rrfScore;
      existing.sources.add("sparse");
      existing.sparseRank = idx + 1;
    } else {
      scores.set(r.id, {
        score: rrfScore,
        text: r.text,
        metadata: r.metadata,
        sources: new Set(["sparse"]),
        sparseRank: idx + 1,
      });
    }
  });

  return Array.from(scores.entries())
    .map(([id, data]) => ({
      id,
      text: data.text,
      score: data.score,
      metadata: data.metadata,
      sources: Array.from(data.sources),
      denseRank: data.denseRank,
      sparseRank: data.sparseRank,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
