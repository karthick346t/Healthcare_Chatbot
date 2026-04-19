import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';

// Ensure environment variables are loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME;

if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME) {
  console.error("❌ Need PINECONE_API_KEY and PINECONE_INDEX_NAME in backend/.env");
  process.exit(1);
}

const pc = new Pinecone({
  apiKey: PINECONE_API_KEY
});

async function main() {
  const index = pc.index(PINECONE_INDEX_NAME as string);

  const embeddingsPath = path.join(
    process.cwd(),
    "data",
    "medlineplus_embeddings.jsonl"
  );

  if (!fs.existsSync(embeddingsPath)) {
    console.error(`❌ Precomputed embeddings file not found at ${embeddingsPath}`);
    process.exit(1);
  }

  console.log(`⏳ Loading records from JSONL file...`);
  const fileContents = fs.readFileSync(embeddingsPath, "utf-8");
  const lines = fileContents
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  console.log(`✅ Loaded ${lines.length} lines. Processing into vectors...`);

  const vectors: any[] = lines.map((line) => {
    const rec = JSON.parse(line);
    // Sanitize ID: Pinecone only accepts ASCII characters. Replace non-ASCII with hyphens.
    const sanitizedId = rec.id.replace(/[^\x00-\x7F]/g, '-');
    
    return {
      id: sanitizedId,
      values: rec.embedding,
      metadata: {
        source: rec.source,
        documentType: "general",
        section: `chunk_${rec.chunk_index}`,
        text: rec.text
      }
    };
  }).filter(v => v.values && v.values.length === 384);

  console.log(`✅ Processed ${vectors.length} valid dense vectors extracted.`);

  const batchSize = 100;
  const startIndex = 46600; // Resume from failure point
  console.log(`🚀 Resuming Pinecone upload from index ${startIndex} (skipping already uploaded records)...`);
  
  for (let i = startIndex; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    try {
      // Updated to pass batch directly for modern Pinecone SDK
      await index.upsert({ records: batch });
      process.stdout.write(`\rProgress: Uploaded ${Math.min(i + batchSize, vectors.length)} / ${vectors.length} vectors... `);
    } catch (err: any) {
      console.error(`\n❌ Failed at batch ${i}:`, err.message);
      // Wait and retry once
      await new Promise(r => setTimeout(r, 2000));
      await index.upsert({ records: batch });
    }
  }

  console.log(`\n\n🎉 Done! All ${vectors.length} vectors have been securely uploaded to Pinecone.`);
}

main().catch(console.error);
