# 05_build_faiss_index.py
"""
Build FAISS index using SBERT local embeddings.
No API calls required.

Input:
    rag/data_chunks/**/*.jsonl
Output:
    rag/vectorstore/medlineplus_faiss/
"""

import os
import json
from pathlib import Path
from typing import List, Dict

import numpy as np
import faiss
from tqdm import tqdm
from sentence_transformers import SentenceTransformer

# ----- paths -----
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
CHUNKS_DIR = os.path.join(BASE_DIR, "data_chunks")
INDEX_DIR = os.path.join(BASE_DIR, "vectorstore", "medlineplus_faiss")

INDEX_PATH = os.path.join(INDEX_DIR, "index.faiss")
META_PATH = os.path.join(INDEX_DIR, "metadata.jsonl")

os.makedirs(INDEX_DIR, exist_ok=True)

# ----- SBERT model -----
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_NAME)


# ----- helpers -----
def iter_chunk_records(chunks_dir: Path):
    for root, _, files in os.walk(chunks_dir):
        for fname in files:
            if not fname.endswith(".jsonl"):
                continue
            with open(Path(root) / fname, "r", encoding="utf-8") as f:
                for line in f:
                    yield json.loads(line)


def build_faiss_index():
    records = list(iter_chunk_records(Path(CHUNKS_DIR)))
    total = len(records)
    print(f"[INFO] Total chunks: {total}")

    texts = [rec["text"] for rec in records]
    metadata = [
        {
            "id": rec["id"],
            "source": rec["source"],
            "chunk_index": rec["chunk_index"]
        }
        for rec in records
    ]

    # ---- embed with SBERT ----
    print("[INFO] Computing SBERT embeddings...")
    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        batch_size=32,
        show_progress_bar=True,
        normalize_embeddings=True
    )

    dim = embeddings.shape[1]
    print(f"[INFO] Embedding dim = {dim}")

    # ---- FAISS index ----
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)

    faiss.write_index(index, INDEX_PATH)
    print(f"[INFO] Saved FAISS index → {INDEX_PATH}")

    with open(META_PATH, "w", encoding="utf-8") as f:
        for m in metadata:
            f.write(json.dumps(m, ensure_ascii=False) + "\n")

    print(f"[INFO] Saved metadata → {META_PATH}")


def main():
    build_faiss_index()


if __name__ == "__main__":
    main()
