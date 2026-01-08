import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app";
import config from "./config";
import { vectorStore, loadPrecomputedEmbeddings } from "./services/ragService";

// Load environment variables immediately
dotenv.config();

const PORT = process.env.PORT || 4000;
// Use 127.0.0.1 to avoid Node.js/IPv6 issues on Windows
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/healthbot";

async function initializeServer() {
  console.log("⏳ Starting server initialization...");

  // --- STEP 1: Connect to MongoDB ---
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    // Critical failure: Stop the server if DB is down
    throw err; 
  }

  // --- STEP 2: Initialize RAG System ---
  try {
    if (config.RAG_ENABLED) {
      console.log("🚀 Initializing RAG system...");

      // Load precomputed MedlinePlus embeddings from Python pipeline
      await loadPrecomputedEmbeddings();

      const docCount = vectorStore.getDocuments().length;

      if (docCount === 0) {
        console.warn(
          "⚠️  Vector store is still empty after loading precomputed embeddings.\n" +
            "   Make sure src/data/medlineplus_embeddings.jsonl exists and is not empty."
        );
      } else {
        console.log(
          `✅ RAG system ready with ${docCount} document chunks indexed`
        );
      }
    } else {
      console.log("ℹ️  RAG system is disabled (RAG_ENABLED=false)");
    }
  } catch (error: any) {
    console.error("⚠️  RAG initialization failed:", error?.message || error);
    console.log(
      "ℹ️  Chatbot will continue without RAG. You can add documents later."
    );
  }
}

// --- STEP 3: Start Express Server ---
initializeServer()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n✅ Healthcare Chatbot server running on port ${PORT}`);
      console.log(`📡 API endpoints:`);
      console.log(`   - POST /api/chat`);
      console.log(`   - POST /api/upload`);
    });
  })
  .catch((error) => {
    console.error("❌ Server initialization failed:", error);
    process.exit(1);
  });