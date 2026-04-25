/**
 * Embedding Service — Medical Domain Embeddings
 *
 * Replaces all-MiniLM-L6-v2 (384d, generic) with PubMedBERT (768d, medical).
 * ⚠️  Requires recreating the Pinecone index with dimension=768.
 */

import { env, pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";

let embedder: FeatureExtractionPipeline | null = null;
let embedderReady = false;

/**
 * Medical domain embedding model options:
 * - "neuml/pubmedbert-base-embeddings" (recommended, 768d, medical-trained)
 * - "BAAI/bge-small-en-v1.5" (fallback, 384d, general but better than MiniLM)
 * - "Xenova/all-MiniLM-L6-v2" (legacy, 384d, smallest)
 */
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "neuml/pubmedbert-base-embeddings";

/**
 * Ensure the ONNX model file for the selected embedding model is present locally.
 * If the file is missing, it will be downloaded from HuggingFace Hub.
 * This provides a graceful fallback for the RAG pipeline when the model file
 * cannot be located at the remote URL.
 */
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const FALLBACK_EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
const MIN_VALID_ONNX_BYTES = 1024 * 1024;

function getModelCacheDir(): string {
  // Use a dedicated cache directory inside the backend folder
  const cacheDir = path.resolve(__dirname, "../../..", "model_cache");
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  return cacheDir;
}

function getModelDirectory(): string {
  const cacheDir = getModelCacheDir();
  // Create directory structure that matches Hugging Face repo path
  const modelDir = path.join(cacheDir, EMBEDDING_MODEL.replace('/', path.sep));
  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
  }
  return modelDir;
}

function downloadModelIfMissing(): void {
  const modelDir = getModelDirectory();
  const onnxDir = path.join(modelDir, "onnx");
  if (!fs.existsSync(onnxDir)) {
    fs.mkdirSync(onnxDir, { recursive: true });
  }

  const configPath = path.join(modelDir, "config.json");
  const tokenizerConfigPath = path.join(modelDir, "tokenizer_config.json");
  const tokenizerPath = path.join(modelDir, "tokenizer.json");
  const modelPath = path.join(onnxDir, "model_quantized.onnx");
  
  // Download config.json if missing
  if (!fs.existsSync(configPath)) {
    const configUrl = `https://huggingface.co/${EMBEDDING_MODEL}/resolve/main/config.json`;
    console.log(`[EmbeddingService] Config file not found locally. Downloading from ${configUrl}`);
    try {
      execSync(`curl -L -o "${configPath}" "${configUrl}"`, { stdio: "inherit" });
      console.log(`[EmbeddingService] Config downloaded to ${configPath}`);
    } catch (err) {
      console.error(`[EmbeddingService] Failed to download config:`, err);
    }
  }

  if (!fs.existsSync(tokenizerConfigPath)) {
    const tokenizerConfigUrl = `https://huggingface.co/${EMBEDDING_MODEL}/resolve/main/tokenizer_config.json`;
    console.log(`[EmbeddingService] tokenizer_config.json not found locally. Downloading from ${tokenizerConfigUrl}`);
    try {
      execSync(`curl -L -o "${tokenizerConfigPath}" "${tokenizerConfigUrl}"`, { stdio: "inherit" });
      console.log(`[EmbeddingService] tokenizer_config.json downloaded to ${tokenizerConfigPath}`);
    } catch (err) {
      console.error(`[EmbeddingService] Failed to download tokenizer_config.json:`, err);
    }
  }

  if (!fs.existsSync(tokenizerPath)) {
    const tokenizerUrl = `https://huggingface.co/${EMBEDDING_MODEL}/resolve/main/tokenizer.json`;
    console.log(`[EmbeddingService] tokenizer.json not found locally. Downloading from ${tokenizerUrl}`);
    try {
      execSync(`curl -L -o "${tokenizerPath}" "${tokenizerUrl}"`, { stdio: "inherit" });
      console.log(`[EmbeddingService] tokenizer.json downloaded to ${tokenizerPath}`);
    } catch (err) {
      console.error(`[EmbeddingService] Failed to download tokenizer.json:`, err);
    }
  }
  
  // Download model if missing
  if (!fs.existsSync(modelPath)) {
    const modelUrl = `https://huggingface.co/${EMBEDDING_MODEL}/resolve/main/onnx/model_quantized.onnx`;
    console.log(`[EmbeddingService] Model file not found locally. Downloading from ${modelUrl}`);
    try {
      execSync(`curl -L -o "${modelPath}" "${modelUrl}"`, { stdio: "inherit" });
      console.log(`[EmbeddingService] Model downloaded to ${modelPath}`);
    } catch (err) {
      console.error(`[EmbeddingService] Failed to download model:`, err);
    }
  }
}

function hasValidLocalOnnx(modelName: string): boolean {
  const modelDir = path.join(getModelCacheDir(), modelName.replace("/", path.sep));
  const modelPath = path.join(modelDir, "onnx", "model_quantized.onnx");

  if (!fs.existsSync(modelPath)) {
    return false;
  }

  try {
    const stats = fs.statSync(modelPath);
    if (stats.size < MIN_VALID_ONNX_BYTES) {
      console.warn(
        `[Embedding] Ignoring invalid ONNX file at ${modelPath} (${stats.size} bytes).`
      );
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Embedding] Unable to inspect ONNX file at ${modelPath}:`, err);
    return false;
  }
}

function resolveEmbeddingModel(): string {
  downloadModelIfMissing();

  if (hasValidLocalOnnx(EMBEDDING_MODEL)) {
    return EMBEDDING_MODEL;
  }

  console.warn(
    `[Embedding] Local assets for ${EMBEDDING_MODEL} are incomplete or invalid. Falling back to ${FALLBACK_EMBEDDING_MODEL}.`
  );
  return FALLBACK_EMBEDDING_MODEL;
}

export async function initializeEmbedder(): Promise<void> {
  if (embedderReady) return;
  console.log(`[Embedding] Loading ${EMBEDDING_MODEL}...`);
  try {
    // Configure transformers.js to resolve local models from our cache root.
    // Then load by model id (not file:// URL), so internal path resolution works.
    const cacheDir = getModelCacheDir();
    env.allowLocalModels = true;
    env.localModelPath = `${cacheDir}${path.sep}`;
    const modelToLoad = resolveEmbeddingModel();

    try {
      embedder = await pipeline("feature-extraction", modelToLoad, {
        quantized: true,
        cache_dir: cacheDir,
      });
    } catch (err) {
      console.error(`[Embedding] Failed to load ${modelToLoad}:`, err);
      // Fallback to a smaller general model
      const fallback = FALLBACK_EMBEDDING_MODEL;
      console.log(`[Embedding] Falling back to ${fallback}`);
      embedder = await pipeline("feature-extraction", fallback, {
        quantized: true,
        cache_dir: cacheDir,
      });
    }
  } catch (err) {
    console.error(`[Embedding] Failed to load ${EMBEDDING_MODEL}:`, err);
    // Fallback to a smaller general model
    const fallback = FALLBACK_EMBEDDING_MODEL;
    console.log(`[Embedding] Falling back to ${fallback}`);
    embedder = await pipeline("feature-extraction", fallback, { quantized: true });
  }
  embedderReady = true;
  console.log(`[Embedding] ${EMBEDDING_MODEL} loaded (${getEmbeddingDimension()}d).`);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!embedderReady || !embedder) {
    await initializeEmbedder();
  }
  if (!embedder) throw new Error("Embedder failed to initialize");
  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

export function getEmbeddingDimension(): number {
  if (EMBEDDING_MODEL.includes("pubmedbert") || EMBEDDING_MODEL.includes("medical")) return 768;
  if (EMBEDDING_MODEL.includes("bge-small") || EMBEDDING_MODEL.includes("MiniLM")) return 384;
  return 768;
}

export function isMedicalModel(): boolean {
  return EMBEDDING_MODEL.includes("pubmedbert") || EMBEDDING_MODEL.includes("medical");
}

/**
 * Batch embedding for indexing pipelines.
 */
export async function embedChunks(
  chunks: Array<{ id: string; text: string; metadata: any }>
): Promise<Array<{ id: string; text: string; metadata: any; embedding: number[] }>> {
  const batchSize = 8;
  const results: Array<{ id: string; text: string; metadata: any; embedding: number[] }> = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const embeddings = await Promise.all(
      batch.map((c) => generateEmbedding(c.text).then((emb) => ({ ...c, embedding: emb })))
    );
    results.push(...embeddings);
  }

  return results;
}
