/**
 * RAG Status and Management Routes
 * 
 * Provides endpoints to check RAG status and manage documents
 */

import { Router, Request, Response } from 'express';
import { vectorStore } from '../services/ragService';
import { indexDocuments } from '../services/ragService';
import config from '../config';
import authMiddleware, { adminMiddleware } from '../middleware/auth';

const router = Router();

/**
 * GET /api/rag/status
 * Get RAG system status
 */
router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = await vectorStore.getStats();
    const docCount = stats.totalCount;
    
    res.json({
      enabled: config.RAG_ENABLED,
      documentCount: docCount,
      status: docCount > 0 ? 'active' : 'empty',
      message: docCount > 0 
        ? `RAG is active with ${docCount} document chunks indexed in Pinecone`
        : 'RAG is enabled but no documents indexed yet. Use POST /api/rag/index to add documents.',
      configuration: {
        topK: config.RAG_TOP_K,
        similarityThreshold: config.RAG_SIMILARITY_THRESHOLD,
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get RAG status',
      message: error.message
    });
  }
});

/**
 * POST /api/rag/index
 * Index documents into RAG system
 */
router.post('/index', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { documents } = req.body;
    
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Please provide an array of documents with content and metadata'
      });
    }
    
    // Validate document structure
    for (const doc of documents) {
      if (!doc.content || !doc.metadata) {
        return res.status(400).json({
          error: 'Invalid document structure',
          message: 'Each document must have "content" and "metadata" fields'
        });
      }
    }
    
    await indexDocuments(documents);
    const stats = await vectorStore.getStats();
    const docCount = stats.totalCount;
    
    res.json({
      success: true,
      message: `Indexed ${documents.length} documents`,
      totalDocuments: docCount
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to index documents',
      message: error.message
    });
  }
});

export default router;

