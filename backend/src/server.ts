import mongoose from "mongoose";
import app from "./app";
import config from "./config";
import { initReminderCron } from "./services/reminderService";

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/healthbot";

async function initializeServer() {
  console.log("⏳ Starting server initialization...");

  // --- STEP 1: Connect to MongoDB ---
  try {
    await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
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

      console.log("✅ Pinecone RAG system is enabled and configured");
    } else {
      console.log("ℹ️  RAG system is disabled (RAG_ENABLED=false)");
    }
  } catch (error: any) {
    console.error("⚠️  RAG initialization failed:", error?.message || error);
    console.log(
      "ℹ️  Chatbot will continue without RAG. You can add documents later."
    );
  }

  // --- STEP 3: Initialize Background Tasks ---
  initReminderCron();
}

// --- STEP 4: Start Express Server ---
let server: any;
initializeServer()
  .then(() => {
    server = app.listen(PORT, () => {
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

// --- STEP 5: Graceful Shutdown ---
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (server) {
    server.close(() => console.log('HTTP server closed'));
  }
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  if (server) {
    server.close(() => console.log('HTTP server closed'));
  }
  await mongoose.disconnect();
  process.exit(0);
});
