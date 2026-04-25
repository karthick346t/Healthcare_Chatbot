# 🛠️ NEXA Healthcare Chatbot — Complete Fix Roadmap

This is the prioritized action plan to turn your demo into production-grade software.

---

## 🔴 P0 — CRITICAL SECURITY FIXES (Do These FIRST)

### 1. Fix JWT Secret Fallback Vulnerability
**File:** `backend/src/services/authService.ts` (line 25)
**Current:**
```typescript
return jwt.sign({ userId }, config.JWT_REFRESH_SECRET || config.JWT_SECRET, ...)
```
**Change:** Remove the `|| config.JWT_SECRET` fallback entirely. If `JWT_REFRESH_SECRET` is missing, crash on startup (already validated in config.ts, so this fallback should never exist).

### 2. Add Authentication to ALL Unprotected Routes
**Files:** `backend/src/routes/rag.ts`, `backend/src/routes/appointments.ts`, `backend/src/routes/doctors.ts`
**Current:** `/api/rag/index`, `/api/appointments/hospitals`, `/api/doctors`, `/api/doctors/:id/block` are completely open.
**Change:** Add `authMiddleware` to ALL routes. For public routes like hospital listings, consider a separate public API with limited fields.

### 3. Fix Mass Assignment in Admin Routes
**File:** `backend/src/routes/admin.ts` (lines 99-118)
**Current:**
```typescript
const newDoctor = new Doctor(req.body);
const newHospital = new Hospital(req.body);
```
**Change:** Whitelist allowed fields, identical to how you did it in auth.ts profile update:
```typescript
const ALLOWED_DOCTOR_FIELDS = ['name', 'specialty', 'hospitalId', 'bio', 'availability'];
```

### 4. Fix Chat Session Ownership Race Condition
**File:** `backend/src/routes/chat.ts` (line 139)
**Current:**
```typescript
{ sessionId, $or: [{ userId }, { userId: { $exists: false } }] }
```
**Change:** Remove the `$exists: false` clause. Anonymous sessions should not be claimable by authenticated users.

### 5. Fix Appointment Token Number Race Condition
**Files:** `backend/src/routes/appointments.ts`, `backend/src/services/chatbotService.ts`
**Current:** Both use `countDocuments()` then save, which is non-atomic.
**Change:** Use MongoDB transactions with `findOneAndUpdate` on a counter collection, or use `$inc` on a daily slot counter document:
```typescript
const counter = await SlotCounter.findOneAndUpdate(
  { doctorId, date },
  { $inc: { count: 1 } },
  { upsert: true, new: true }
);
const tokenNumber = counter.count;
```

### 6. Remove `config.JWT_REFRESH_SECRET ||` from Refresh Endpoint
**File:** `backend/src/routes/auth.ts` (line 136)
**Current:** `jwt.verify(refreshToken, config.JWT_REFRESH_SECRET || config.JWT_SECRET)`
**Change:** `jwt.verify(refreshToken, config.JWT_REFRESH_SECRET)` — the startup validation already guarantees this exists.

---

## 🟠 P1 — HIGH PRIORITY ARCHITECTURE & RELIABILITY

### 7. Create a Unified LLM Service Abstraction
**New File:** `backend/src/services/llmService.ts`
**Change:** Abstract ALL LLM calls behind a single interface. Groq, OpenRouter, and any future provider should share:
- Common retry logic
- Common timeout handling
- Common error classification
- Single API key validation point

**Current pain:** `chatbotService.ts` calls Groq directly, `aiAnalysis.ts` calls both Groq and OpenRouter directly, each with different retry logic.

### 8. Stop Fetching ALL Doctors & Appointments on Every Chat Message
**File:** `backend/src/services/chatbotService.ts` (lines 123-208)
**Current:** `buildDoctorContext()` fetches every doctor from MongoDB on every single message. Same for `buildAppointmentContext()`.
**Change:** Cache these aggressively. Doctors change rarely — cache for 5 minutes minimum. Appointments are user-specific — cache per user for 1 minute.

### 9. Fix the `any` TypeScript Epidemic
**File Priority:**
1. `backend/src/services/chatbotService.ts` — Replace all `any[]` for history, `any` for RAG docs, `any` for document entries with proper interfaces.
2. `backend/src/routes/appointments.ts` — Replace `(populated as any)` with proper lean result typing.
3. `backend/src/services/aiAnalysis.ts` — Replace `any[]` for conversationHistory.

**Example fix:**
```typescript
// Instead of
conversationHistory: any[] = []

// Use
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
```

### 10. Remove Dead RAG Code
**Files:** `backend/src/services/ragService.ts` (lines 293-312)
**Current:** `cosineSimilarity()` is completely unused since Pinecone does similarity server-side.
**Change:** Delete it. Also delete the unused `PrecomputedEmbeddingRecord` interface and the commented-out FAISS loading code.

### 11. Fix Frontend Duplicate `useAuth`
**Files:** `frontend/src/hooks/useAuth.ts` vs `frontend/src/context/AuthContext.tsx`
**Change:** Delete one. The context should export the hook:
```typescript
// In AuthContext.tsx
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
```
Then delete `frontend/src/hooks/useAuth.ts` entirely and update all imports.

### 12. Fix Chatbot State Synchronization Bug
**File:** `frontend/src/components/Chatbot.tsx`
**Current:** You maintain `messages` (UI format) and `conversationHistory` (API format) as separate arrays.
**Change:** Derive one from the other. Keep a single source of truth:
```typescript
const [messages, setMessages] = useState<Message[]>([]);
// Derive UI messages from messages
const uiMessages = messages.map(m => ({
  sender: m.role === 'user' ? 'user' : 'bot',
  text: m.content
}));
```

---

## 🟡 P2 — MEDIUM PRIORITY CLEANUP & PERFORMANCE

### 13. Fix Double dotenv.config() Calls
**Files:** `backend/src/server.ts`, `backend/src/services/awsService.ts`
**Change:** Remove `dotenv.config()` from everywhere except `backend/src/config.ts`. Config.ts is imported before everything else, so it's the only place that needs it.

### 14. Fix Module System Inconsistency
**File:** `backend/src/app.ts` (lines 134-135)
**Current:** Uses `require()` inside an ES module file.
**Change:**
```typescript
import mongoose from 'mongoose';
import { vectorStore } from './services/ragService';
```
(Move imports to top of file where they belong.)

### 15. Remove Translation API Memory Bomb
**File:** `translation-api/main.py`
**Current:** Loads 1.6GB model globally with no request queue or batching.
**Change:** Either:
- **Option A:** Add model quantization (`torch_dtype=torch.float16`, use `quantize`)
- **Option B:** Cache the model once but add request batching and a semaphore limit:
```python
import asyncio
semaphore = asyncio.Semaphore(2)  # Max 2 concurrent translations

@app.post("/translate")
async def translate(...):
    async with semaphore:
        ...
```
- **Option C:** Replace with a managed translation API (Google Translate, Azure Translator)

### 16. Add Request Validation to RAG Routes
**File:** `backend/src/routes/rag.ts`
**Change:** Add authMiddleware AND body validation:
```typescript
router.post('/index', authMiddleware, adminMiddleware, async (req, res) => {
  // existing logic
});
```

### 17. Fix Upload Route File Cleanup
**File:** `backend/src/routes/upload.ts` (lines 338-345)
**Current:** Cleanup in `finally` block doesn't check if file was already deleted in the `shouldSkipAI` branch.
**Change:** Track deletion state:
```typescript
let cleanedUp = false;
// ... in shouldSkipAI branch ...
cleanedUp = true;
// ... in finally ...
if (!cleanedUp && file?.path) { ... }
```

### 18. Fix Frontend API Base URL Logic
**File:** `frontend/src/services/apiConfig.ts`
**Current:** Falls back to empty string in production, causing relative URLs.
**Change:**
```typescript
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000" : window.location.origin);
```

### 19. Add Database Connection Pool Settings
**File:** `backend/src/server.ts`
**Current:** `mongoose.connect(MONGO_URI)` with zero options.
**Change:**
```typescript
await mongoose.connect(MONGO_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

### 20. Add Graceful Shutdown
**File:** `backend/src/server.ts`
**Current:** No SIGTERM/SIGINT handlers.
**Change:**
```typescript
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => console.log('HTTP server closed'));
  await mongoose.disconnect();
  process.exit(0);
});
```

---

## 🟢 P3 — LOW PRIORITY POLISH & MAINTENANCE

### 21. Fix Swagger Public Exposure
**File:** `backend/src/app.ts` (line 173)
**Current:** `/api/docs` is public and reveals your full API schema.
**Change:** Move Swagger behind auth or disable in production:
```typescript
if (config.NODE_ENV !== 'production') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
```

### 22. Fix Health Check `require()` and Error Handling
**File:** `backend/src/app.ts` (lines 132-160)
**Current:** Catches error but doesn't log it. Uses `require()` inside handler.
**Change:**
```typescript
app.get('/healthz', async (req, res) => {
  try {
    const dbConnected = mongoose.connection.readyState === 1;
    const ragStats = await vectorStore.getStats().catch(() => ({ totalCount: 0 }));
    const status = dbConnected ? 200 : 503;
    res.status(status).json({ status: dbConnected ? 'ok' : 'error', db: dbConnected ? 'connected' : 'disconnected', rag: ragStats });
  } catch (error) {
    logger.error('Health check failed', error); // Use winston, not console
    res.status(503).json({ status: 'error', message: 'Service unavailable' });
  }
});
```

### 23. Replace All `console.log` with Structured Logger
**Files:** `backend/src/routes/*.ts`, `backend/src/services/*.ts`
**Change:** Import `logger` from `../utils/logger` and use `logger.info()`, `logger.warn()`, `logger.error()`. You already set up Winston with MongoDB transport — actually use it.

### 24. Fix `mongoose-field-encryption` Configuration
**File:** `backend/src/models/ChatSession.ts` (lines 59-64)
**Current:** Encryption only applies if `ENCRYPTION_KEY` env var exists, but it's not in required vars and not documented as critical.
**Change:** Either make `ENCRYPTION_KEY` required for production, or remove the plugin and handle encryption at the application layer.

### 25. Fix CORS Origin Allow-Empty
**File:** `backend/src/app.ts` (lines 74-83)
**Current:** `if (!origin) return callback(null, true)` allows any non-browser client.
**Change:** Be explicit about what you want. If you need Postman/curl for development, add an `ALLOW_NO_ORIGIN` env var:
```typescript
if (!origin) {
  return config.NODE_ENV === 'development' 
    ? callback(null, true) 
    : callback(new Error('Origin required'));
}
```

### 26. Fix `appointmentDate` Normalization Duplication
**Files:** `backend/src/routes/appointments.ts` (used 3+ times), `backend/src/services/chatbotService.ts`
**Current:** `date.setHours(0,0,0,0)` is copy-pasted everywhere.
**Change:** Create a utility:
```typescript
// utils/dateHelpers.ts
export function startOfDay(date: Date | string): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
```

### 27. Add Input Sanitization to Upload Route
**File:** `backend/src/routes/upload.ts` (line 155)
**Current:** `JSON.parse(conversationHistory)` with no try/catch or validation.
**Change:**
```typescript
let history: Message[] = [];
if (conversationHistory) {
  try {
    const parsed = typeof conversationHistory === 'string' 
      ? JSON.parse(conversationHistory) 
      : conversationHistory;
    if (Array.isArray(parsed)) history = parsed;
  } catch {
    // ignore invalid history, backend will load from DB anyway
  }
}
```

### 28. Fix Frontend React Key Instability
**File:** `frontend/src/components/Chatbot.tsx` (line 316)
**Current:** `key={\`${sessionId}-${i}-${m.text.slice(0, 20)}\`}`
**Change:** Use a stable ID. Since your backend doesn't return message IDs, use index alone (React accepts array index when items don't reorder):
```typescript
key={\`msg-${sessionId}-${i}\`}
```

### 29. Add `try/catch` to `apiGetMe` in Frontend
**File:** `frontend/src/services/authApi.ts` (line 157-160)
**Current:** `apiGetMe` calls `handleResponse` which throws on error, but no caller seems to catch it.
**Change:** Wrap in try/catch wherever `apiGetMe` is called, or make the hook resilient.

### 30. Write Actual Tests
**Files:** `backend/package.json`, `frontend/package.json`
**Change:** Replace the `echo 'Tests not implemented yet'` scripts with actual test suites. Start with:
- Auth flow (register, login, refresh, logout)
- Appointment booking with concurrent requests
- Chat message with emergency keyword detection
- File upload with invalid file types

---

## 📋 FILE-BY-FILE CHANGE CHECKLIST

| File | Changes Needed |
|------|----------------|
| `backend/src/services/authService.ts` | Remove `\|\| config.JWT_SECRET` fallback on line 25 |
| `backend/src/routes/auth.ts` | Remove `\|\| config.JWT_SECRET` on line 136 |
| `backend/src/routes/appointments.ts` | Add auth to `/hospitals`, `/hospitals/:id/doctors`, `/check-availability`; fix race condition; add transaction |
| `backend/src/routes/chat.ts` | Fix session ownership query; remove `$exists: false` |
| `backend/src/routes/admin.ts` | Whitelist req.body fields for doctor/hospital creation |
| `backend/src/routes/rag.ts` | Add authMiddleware to ALL routes |
| `backend/src/routes/doctors.ts` | Add authMiddleware; `/block` needs staffMiddleware |
| `backend/src/services/chatbotService.ts` | Type all `any` → interfaces; cache doctor/appointment context; extract booking logic |
| `backend/src/services/ragService.ts` | Delete dead `cosineSimilarity` function; delete unused interfaces |
| `backend/src/services/aiAnalysis.ts` | Type all `any` → interfaces; unify retry logic with llmService |
| `backend/src/services/awsService.ts` | Remove `dotenv.config()` call |
| `backend/src/server.ts` | Remove `dotenv.config()`; add connection options; add graceful shutdown |
| `backend/src/app.ts` | Move `require()` to top imports; fix health check; swagger behind auth |
| `backend/src/utils/logger.ts` | Export `logger` as default properly; ensure all files import it |
| `frontend/src/components/Chatbot.tsx` | Single source of truth for messages; fix keys |
| `frontend/src/hooks/useAuth.ts` | **DELETE**; move logic to AuthContext |
| `frontend/src/services/apiConfig.ts` | Fix production fallback URL |
| `translation-api/main.py` | Add request semaphore/queue; add model quantization |
| `build_deploy.js` | Use `pnpm` not `npm` to match project |
| `README.md` | Update to reflect actual architecture (Groq primary, not OpenRouter) |

---

## 🎯 RECOMMENDED EXECUTION ORDER

**Week 1 (Security):**
1. Fix JWT secrets (P0 #1, #6)
2. Auth all routes (P0 #2)
3. Fix mass assignment (P0 #3)
4. Fix session ownership (P0 #4)

**Week 2 (Reliability):**
5. Fix race conditions (P0 #5)
6. Create LLM abstraction (P1 #7)
7. Add DB caching (P1 #8)
8. Add graceful shutdown (P2 #20)

**Week 3 (Code Quality):**
9. Fix TypeScript types (P1 #9)
10. Remove dead code (P1 #10, P2 #13)
11. Fix frontend state (P1 #12)
12. Unify logging (P3 #23)

**Week 4 (Performance & Polish):**
13. Fix translation API (P2 #15)
14. Fix CORS/security headers (P3 #25)
15. Write tests (P3 #30)
16. Update README (P3)

---

**Estimated effort: 80-120 hours of focused development.**

The good news: your core ideas (RAG chat, appointment booking, document analysis) are solid. The bad news: the implementation is a pile of shortcuts that compound into technical debt. Fix the P0 items immediately — the rest can be iterative.
