# Healthcare Chatbot — Data Sources Documentation

This document explicitly calls out the datasets, corpora, and external sources used by the Healthcare Chatbot for its RAG (Retrieval-Augmented Generation) pipeline and baseline medical knowledge.

## Primary Sources for RAG System

1. **MedlinePlus (National Library of Medicine)**
   - **Source:** [MedlinePlus Connect / NLM](https://medlineplus.gov/)
   - **Nature of Data:** NIH-reviewed plain-language medical encyclopedias, disease descriptions, and healthy living guidelines.
   - **License / Terms of Use:** Public Domain (US Government Data). Data is provided freely, but attribution to the U.S. National Library of Medicine is legally standard.
   - **How it's used:** Pre-chunked into `.jsonl` files and stored in the vector database to ground the LLM's answers on standard symptoms, conditions, and treatments.

2. **`healthcare_dataset.csv` (General Health Q&A Dataset)**
   - **Source:** Originally sampled from open-source Kaggle datasets (e.g. valid-source datasets compiling patient Q&A).
   - **Nature of Data:** Example human questions and doctor-vetted answers.
   - **Usage Note:** This dataset acts as a supplemental retrieval baseline to train the QA pattern recognition.
   - **Data Bias Advisory:** Many open datasets rely on demographic data constrained to the region of collection. The model has an inherited bias based on the underlying text representation in these datasets. 

## Models used in System

- **Language Model (Primary):** `gpt-oss-120b` (via OpenRouter) / `llama-3.3-70b-versatile`
- **Embedding Model:** `all-MiniLM-L6-v2` (SentenceTransformers Python / ONNX via `@xenova/transformers`)
- **Vision Model:** `nvidia/nemotron-nano` (via Groq/Nvidia inference endpoints)
- **Translation:** Facebook `M2M100` (418M) running locally.

## Important Clinical Note
The data provided through this RAG system is retrieved for **informational purposes only** and operates under the firm instruction **not to replace licensed medical advice.**

> ⚠️ As noted in the codebase (Symptom Checker & Emergency Middleware), the application applies aggressive fail-safes. The internal dataset holds no proprietary patient history beyond what users choose to upload during a specific, localized session. 
