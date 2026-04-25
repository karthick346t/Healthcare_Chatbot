/**
 * Sparse Retrieval Service — BM25 Keyword Search
 *
 * Complements dense vector retrieval with exact term matching.
 * Critical for medical queries containing specific drug names, ICD codes,
 * and procedure names that dense embeddings often miss.
 */

interface SparseDocument {
  id: string;
  text: string;
  metadata: any;
}

interface SparseResult {
  id: string;
  text: string;
  score: number;
  metadata: any;
}

class BM25Index {
  private docs: SparseDocument[] = [];
  private df: Map<string, number> = new Map(); // document frequency
  private docLengths: number[] = [];
  private avgDocLength = 0;
  private built = false;

  private k1 = 1.5;
  private b = 0.75;

  private stopwords = new Set([
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "her", "was", "one", "our",
    "this", "that", "with", "have", "from", "they", "she", "his", "him", "been", "their",
    // Medical stopwords (too generic to be useful for discrimination)
    "patient", "may", "also", "used", "treatment", "symptoms", "medical", "health", "doctor",
  ]);

  addDocument(id: string, text: string, metadata: any): void {
    this.docs.push({ id, text, metadata });
    this.built = false;
  }

  build(): void {
    if (this.built) return;

    this.df.clear();
    this.docLengths = [];
    let totalLength = 0;

    for (const doc of this.docs) {
      const tokens = this.tokenize(doc.text);
      this.docLengths.push(tokens.length);
      totalLength += tokens.length;

      const seen = new Set<string>();
      for (const token of tokens) {
        if (!seen.has(token)) {
          this.df.set(token, (this.df.get(token) || 0) + 1);
          seen.add(token);
        }
      }
    }

    this.avgDocLength = totalLength / this.docs.length || 1;
    this.built = true;
  }

  search(query: string, topK: number = 10): SparseResult[] {
    if (!this.built) this.build();
    if (this.docs.length === 0) return [];

    const qTokens = this.tokenize(query);
    const scores: number[] = new Array(this.docs.length).fill(0);

    for (const token of qTokens) {
      const df = this.df.get(token) || 0;
      if (df === 0) continue;

      const idf = Math.log((this.docs.length - df + 0.5) / (df + 0.5) + 1);

      for (let i = 0; i < this.docs.length; i++) {
        const docTokens = this.tokenize(this.docs[i].text);
        const tf = docTokens.filter((t) => t === token).length;
        const docLen = this.docLengths[i];

        const denom = tf + this.k1 * (1 - this.b + this.b * (docLen / this.avgDocLength));
        const score = idf * ((tf * (this.k1 + 1)) / (denom || 1));
        scores[i] += score;
      }
    }

    return scores
      .map((score, idx) => ({
        id: this.docs[idx].id,
        text: this.docs[idx].text,
        score,
        metadata: this.docs[idx].metadata,
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !this.stopwords.has(t));
  }

  clear(): void {
    this.docs = [];
    this.df.clear();
    this.docLengths = [];
    this.built = false;
  }

  size(): number {
    return this.docs.length;
  }
}

// Singleton index instance
const index = new BM25Index();

export function addSparseDocument(id: string, text: string, metadata: any): void {
  index.addDocument(id, text, metadata);
}

export function buildSparseIndex(): void {
  index.build();
}

export function sparseSearch(query: string, topK?: number): SparseResult[] {
  return index.search(query, topK);
}

export function clearSparseIndex(): void {
  index.clear();
}

export function getSparseIndexSize(): number {
  return index.size();
}
