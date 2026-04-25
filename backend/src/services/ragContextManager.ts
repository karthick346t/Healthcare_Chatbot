/**
 * ⚠️ DEPRECATED — ragContextManager.ts
 *
 * This file is no longer used. Its functionality has been superseded by:
 * - queryIntelligenceService.ts  → Medical entity extraction, synonym expansion, intent classification
 * - contextBuilderService.ts     → Structured context with citations and dynamic sizing
 * - ragOrchestrator.ts           → Session-aware retrieval pipeline with emergency detection
 *
 * Keeping the file to avoid breaking legacy imports, but it exports a no-op stub.
 * TODO: Remove all imports of this file and delete it.
 */

class NoOpContextManager {
  getContext() {
    return {
      sessionId: "",
      ragContexts: [],
      relevantEntities: [],
      lastRetrievalTime: new Date().toISOString(),
    };
  }
  addRAGContext() {}
  getRelevantContext() {
    return { retrievedDocs: [], conversationSummary: "", relevantEntities: [] };
  }
  shouldRefreshContext() {
    return false;
  }
  clearContext() {}
  cleanup() {}
}

const contextManager = new NoOpContextManager();
export default contextManager;
