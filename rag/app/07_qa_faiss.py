# 07_qa_faiss.py
"""
FAISS retrieval with SBERT embeddings + OpenRouter for generated answers.
"""

import os
import json
from pathlib import Path

import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import requests

# ----- paths -----
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

INDEX_DIR = os.path.join(BASE_DIR, "vectorstore", "medlineplus_faiss")
CHUNKS_DIR = os.path.join(BASE_DIR, "data_chunks")

INDEX_PATH = os.path.join(INDEX_DIR, "index.faiss")
META_PATH = os.path.join(INDEX_DIR, "metadata.jsonl")

# ----- OpenRouter -----
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("Set OPENROUTER_API_KEY!")

ANSWER_MODEL = "openai/gpt-oss-20b:free"

# ----- SBERT for embedding queries -----
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_NAME)

# ----- load FAISS -----
index = faiss.read_index(INDEX_PATH)

# ----- load metadata -----
metadata = []
with open(META_PATH, "r", encoding="utf-8") as f:
    for line in f:
        metadata.append(json.loads(line))

# ----- load chunk texts -----
chunk_text_map = {}
for root, _, files in os.walk(CHUNKS_DIR):
    for fname in files:
        if not fname.endswith(".jsonl"):
            continue
        with open(Path(root) / fname, "r", encoding="utf-8") as f:
            for line in f:
                rec = json.loads(line)
                chunk_text_map[rec["id"]] = rec["text"]


# ----- helpers -----
def embed_query(text: str):
    emb = model.encode([text], convert_to_numpy=True, normalize_embeddings=True)
    return emb.astype("float32")


def search_faiss(query: str, k: int = 5):
    qvec = embed_query(query)
    scores, indices = index.search(qvec, k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        meta = metadata[idx]
        cid = meta["id"]
        results.append({
            "score": float(score),
            "id": cid,
            "source": meta["source"],
            "chunk_index": meta["chunk_index"],
            "text": chunk_text_map[cid]
        })
    return results


def call_openrouter(prompt: str):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": ANSWER_MODEL,
        "messages": [{"role": "user", "content": prompt}]
    }
    resp = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        json=payload,
        headers=headers
    )
    return resp.json()["choices"][0]["message"]["content"]


def build_prompt(question: str, contexts):
    ctx = "\n\n---\n\n".join(
        [f"[{c['source']}]\n{c['text']}" for c in contexts]
    )
    return f"""
Answer the medical question ONLY using the context:

QUESTION:
{question}

CONTEXT:
{ctx}

If the answer is not in the context, say:
"No answer found in the provided context."
"""


# ----- CLI -----
def main():
    print("[ READY ] Ask medical questions. Type 'exit' to quit.\n")

    while True:
        q = input("Question > ").strip()
        if q in ("exit", "quit"):
            break

        results = search_faiss(q, k=5)
        prompt = build_prompt(q, results)
        answer = call_openrouter(prompt)

        print("\nANSWER:\n")
        print(answer)
        print("\n" + "="*60 + "\n")


if __name__ == "__main__":
    main()
