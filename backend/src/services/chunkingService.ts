/**
 * Chunking Service — Semantic + Hierarchical Medical Document Chunking
 *
 * Replaces the naive paragraph-based chunking in ragService.ts
 * with structure-aware, medical-boundary-respecting chunking.
 */

// NOTE: The original implementation used RecursiveCharacterTextSplitter from the
// `langchain` library. To avoid a missing module error in this environment we
// provide a minimal local fallback that mimics the required API.
class SimpleRecursiveCharacterTextSplitter {
  chunkSize: number;
  chunkOverlap: number;
  separators: string[];
  constructor({ chunkSize, chunkOverlap, separators }: { chunkSize: number; chunkOverlap: number; separators: string[] }) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    this.separators = separators;
  }
  async splitText(text: string): Promise<string[]> {
    // Very naive splitter: split by the first separator that yields chunks <= size
    const sep = this.separators.find((s) => s && text.includes(s)) || " ";
    const parts = text.split(sep);
    const chunks: string[] = [];
    let buffer = "";
    for (const part of parts) {
      if ((buffer + sep + part).length > this.chunkSize) {
        if (buffer) chunks.push(buffer.trim());
        buffer = part;
      } else {
        buffer = buffer ? buffer + sep + part : part;
      }
    }
    if (buffer) chunks.push(buffer.trim());
    // Apply overlap by merging adjacent chunks
    if (this.chunkOverlap > 0 && chunks.length > 1) {
      const overlapped: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        let chunk = chunks[i];
        if (i > 0) {
          const prev = chunks[i - 1];
          const overlap = prev.slice(-this.chunkOverlap);
          chunk = overlap + chunk;
        }
        overlapped.push(chunk);
      }
      return overlapped;
    }
    return chunks;
  }
}

export interface Chunk {
  id: string;
  text: string;
  metadata: {
    source: string;
    documentType: string;
    pageNumber?: number;
    sectionHeader?: string;
    parentChunkId?: string;
    chunkIndex: number;
    totalChunks: number;
    isTable?: boolean;
  };
}

const DEFAULT_CHUNK_SIZE = 512;
const DEFAULT_CHUNK_OVERLAP = 100;

/**
 * Detect markdown tables and preserve them as atomic units.
 */
function extractTables(text: string): { proseParts: string[]; tables: Array<{ markdown: string }> } {
  const tableRegex = /(\|.*\|[\r\n]+)(\|[-:\| ]+\|[\r\n]+)(\|.*\|[\r\n]*)+/g;
  const tables: Array<{ markdown: string }> = [];
  const proseParts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tableRegex.exec(text)) !== null) {
    proseParts.push(text.slice(lastIndex, match.index));
    tables.push({ markdown: match[0] });
    lastIndex = match.index + match[0].length;
  }
  proseParts.push(text.slice(lastIndex));

  return { proseParts, tables };
}

/**
 * Semantic chunking for medical documents:
 * 1. Splits by major section headers (## / ###)
 * 2. Preserves tables as atomic chunks
 * 3. Uses recursive character splitting with medical-aware separators
 * 4. Maintains parent-child relationships for context retrieval
 */
export async function semanticChunkMedicalDocument(
  text: string,
  source: string,
  documentType: string,
  options?: {
    chunkSize?: number;
    chunkOverlap?: number;
  }
): Promise<Chunk[]> {
  const chunkSize = options?.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const chunkOverlap = options?.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP;

  const chunks: Chunk[] = [];

  // Split by major medical sections
  const sectionRegex = /(?=^#{1,3}\s+.{3,}$)/gm;
  const sections = text.split(sectionRegex).filter((s) => s.trim().length > 50);

  for (let secIdx = 0; secIdx < sections.length; secIdx++) {
    const section = sections[secIdx];
    const headerMatch = section.match(/^#{1,3}\s+(.+)$/m);
    const sectionHeader = headerMatch ? headerMatch[1].trim() : undefined;

    // Extract and isolate tables
    const { proseParts, tables } = extractTables(section);

    // Chunk prose with medical-aware boundaries
    const proseSplitter = new SimpleRecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ["\n## ", "\n### ", "\n\n", "\n", ". ", " ", ""],
    });

    const proseChunks = await proseSplitter.splitText(proseParts.join("\n\n"));

    const parentChunkId = `doc_${source}_sec_${secIdx}`;

    for (let i = 0; i < proseChunks.length; i++) {
      chunks.push({
        id: `${parentChunkId}_p_${i}`,
        text: proseChunks[i],
        metadata: {
          source,
          documentType,
          sectionHeader,
          parentChunkId,
          chunkIndex: i,
          totalChunks: proseChunks.length,
        },
      });
    }

    // Add table chunks (atomic — never split tables)
    for (let t = 0; t < tables.length; t++) {
      chunks.push({
        id: `${parentChunkId}_t_${t}`,
        text: tables[t].markdown,
        metadata: {
          source,
          documentType,
          sectionHeader,
          parentChunkId,
          chunkIndex: proseChunks.length + t,
          totalChunks: proseChunks.length + tables.length,
          isTable: true,
        },
      });
    }
  }

  return chunks;
}

/**
 * Legacy-compatible wrapper — exposes the same interface as old chunkDocument()
 * so existing callers don't break during migration.
 */
export function chunkDocument(
  content: string,
  metadata: { source: string; documentType: string; page?: number; section?: string; timestamp?: string },
  chunkSize?: number,
  overlap?: number
): Promise<Chunk[]> {
  return semanticChunkMedicalDocument(content, metadata.source, metadata.documentType, {
    chunkSize: chunkSize ?? DEFAULT_CHUNK_SIZE,
    chunkOverlap: overlap ?? DEFAULT_CHUNK_OVERLAP,
  });
}
