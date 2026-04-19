/**
 * RAG System Initialization Script (Pinecone)
 *
 * This script prints current Pinecone index stats.
 * To add documents, use the uploadToPinecone.ts script instead.
 *
 * Usage:
 *   ts-node src/scripts/initializeRAG.ts
 */

import { vectorStore } from "../services/ragService";

async function main() {
  console.log("🚀 Checking RAG system (Pinecone)...\n");

  try {
    const stats = await vectorStore.getStats();
    console.log(`✅ Pinecone index contains ${stats.totalCount} document chunks.`);
    console.log("\n🎉 RAG system is ready to use!");
  } catch (error: any) {
    console.error("❌ RAG check failed:", error.message || error);
    process.exit(1);
  }
}

main();
