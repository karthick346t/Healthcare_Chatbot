import dotenv from "dotenv";
dotenv.config();

// ─────────────────────────────────────────────
// Startup validation — fail fast on missing config
// ─────────────────────────────────────────────
const REQUIRED_VARS = [
  'JWT_SECRET',
  'MONGO_URI',
  'GROQ_API_KEY',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_BUCKET_NAME',
  'OPENROUTER_API_KEY'
];

const missing = REQUIRED_VARS.filter(v => !process.env[v] || process.env[v]!.trim() === "");

if (missing.length > 0) {
  console.error(
    "\n❌ FATAL: Missing required environment variables in .env:\n" +
    missing.map(v => `   - ${v}`).join("\n") +
    "\n\nPlease check your .env file and ensure all are provided.\n"
  );
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET!;

export default {
  PORT: process.env.PORT || "4000",
  NODE_ENV: process.env.NODE_ENV || "development",

  // API Keys
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY as string,
  GROQ_API_KEY: process.env.GROQ_API_KEY as string,

  // RAG Configuration
  RAG_ENABLED: process.env.RAG_ENABLED !== "false", // Default: true
  RAG_TOP_K: parseInt(process.env.RAG_TOP_K || "5"),
  RAG_SIMILARITY_THRESHOLD: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || "0.45"),

  // Auth Configuration — JWT_SECRET validated above
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",

  // CORS — set FRONTEND_ORIGIN in .env for production
  FRONTEND_ORIGINS: (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
};
