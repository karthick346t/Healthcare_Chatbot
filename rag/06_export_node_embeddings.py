# 06_export_node_embeddings.py
"""
Export SBERT embeddings for use in the Node backend.

We do NOT read embeddings from FAISS.
Instead, we:
  - load metadata.jsonl (id, source, chunk_index)
  - load chunk texts from data_chunks/**/*.jsonl
  - recompute embeddings with SBERT
  - write backend/data/medlineplus_embeddings.jsonl

Run:
    (venv) python 06_export_node_embeddings.py
"""

import os
import json
from pathlib import Path

from sentence_transformers import SentenceTransformer
from tqdm import tqdm

# ---------- paths ----------

BASE_DIR = Path(__file__).resolve().parent
CHUNKS_DIR = BASE_DIR / "data_chunks"
INDEX_DIR = BASE_DIR / "vectorstore" / "medlineplus_faiss"
META_PATH = INDEX_DIR / "metadata.jsonl"

# Root project structure:
#   Healthcare-Chatbot/
#     rag/
#     backend/
PROJECT_ROOT = BASE_DIR.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
OUT_DIR = BACKEND_DIR / "data"
OUT_PATH = OUT_DIR / "medlineplus_embeddings.jsonl"

# ---------- SBERT model ----------

# Use the SAME model you used to build FAISS originally.
# If you followed my earlier suggestion, it was:
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

print(f"[EXPORT] Loading SBERT model: {MODEL_NAME}")
model = SentenceTransformer(MODEL_NAME)


# ---------- helpers ----------

def load_metadata():
    metas = []
    with META_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            metas.append(json.loads(line))
    print(f"[EXPORT] Loaded {len(metas)} metadata entries")
    return metas


def load_chunk_text_map():
    """
    Build id -> text map from data_chunks/**/*.jsonl
    """
    mapping = {}
    for root, _, files in os.walk(CHUNKS_DIR):
        for fname in files:
            if not fname.endswith(".jsonl"):
                continue
            jpath = Path(root) / fname
            with jpath.open("r", encoding="utf-8") as f:
                for line in f:
                    if not line.strip():
                        continue
                    rec = json.loads(line)
                    cid = rec["id"]
                    text = rec["text"]
                    mapping[cid] = text
    print(f"[EXPORT] Loaded texts for {len(mapping)} chunk IDs")
    return mapping


def main():
    print("[EXPORT] Loading metadata + chunk texts...")
    metas = load_metadata()
    id_to_text = load_chunk_text_map()

    texts = []
    records = []

    for meta in metas:
        cid = meta["id"]
        text = id_to_text.get(cid, "")
        if not text:
            # In case of mismatch, skip this one
            continue
        records.append({
            "id": cid,
            "source": meta.get("source", ""),
            "chunk_index": meta.get("chunk_index", 0),
            "text": text,
        })
        texts.append(text)

    print(f"[EXPORT] Will embed {len(records)} chunks")

    # Compute embeddings in batches
    batch_size = 64
    all_embeddings = []

    for i in tqdm(range(0, len(texts), batch_size), desc="[EXPORT] Embedding"):
        batch = texts[i:i+batch_size]
        embs = model.encode(
            batch,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )
        all_embeddings.extend(embs.tolist())

    # Write out to backend
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    with OUT_PATH.open("w", encoding="utf-8") as f:
        for rec, emb in zip(records, all_embeddings):
            rec_out = {
                "id": rec["id"],
                "source": rec["source"],
                "chunk_index": rec["chunk_index"],
                "text": rec["text"],
                "embedding": emb,
            }
            f.write(json.dumps(rec_out, ensure_ascii=False) + "\n")

    print(f"[EXPORT] Wrote {len(records)} embeddings → {OUT_PATH}")


if __name__ == "__main__":
    main()
