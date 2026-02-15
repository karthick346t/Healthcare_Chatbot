# 04_chunk_texts.py
"""
Chunk cleaned text files from data_text_clean/ into overlapping segments
ready to embed for RAG.

Input:
    rag/data_text_clean/**/*.txt

Output:
    rag/data_chunks/**/*.jsonl
    (one .jsonl file per .txt, same relative path)

Each JSONL line has:
    {
        "id": "<relative_path_no_ext>-<chunk_index>",
        "source": "<relative path of original txt>",
        "chunk_index": <int>,
        "text": "<chunk text>"
    }

Run from project root (rag/):
    (venv) python chunking/04_chunk_texts.py
"""

import os
import json
from pathlib import Path

from tqdm import tqdm

# This file is in rag/chunking/, so go up one level to rag/
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

INPUT_TEXT_DIR = os.path.join(BASE_DIR, "data_text_clean")
OUTPUT_CHUNK_DIR = os.path.join(BASE_DIR, "data_chunks")

# Chunking config (you can tweak these)
CHUNK_SIZE_CHARS = 1200   # target size of each chunk
OVERLAP_CHARS = 200       # how much overlap between consecutive chunks


def ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def smart_char_chunks(
    text: str,
    chunk_size: int = CHUNK_SIZE_CHARS,
    overlap: int = OVERLAP_CHARS,
) -> list[str]:
    """
    Character-based sliding window chunking with light heuristics:
      - Try to break near sentence/paragraph boundaries if possible.
      - Otherwise just cut by characters with overlap.

    This DOES NOT rely on blank lines, so it works with your current cleaned text.
    """
    text = text.strip()
    if not text:
        return []

    n = len(text)
    chunks: list[str] = []
    start = 0

    while start < n:
        # Basic window
        window_end = min(start + chunk_size, n)
        window = text[start:window_end]

        # Try to find a nice split point inside the window
        split_pos = None
        min_reasonable = int(chunk_size * 0.5)  # don't cut too early

        # Look for paragraph break first
        candidates = []

        para_idx = window.rfind("\n\n")
        if para_idx != -1 and para_idx >= min_reasonable:
            candidates.append(start + para_idx + 2)  # include the \n\n

        # Then look for sentence boundaries
        for sep in [". ", "? ", "! "]:
            idx = window.rfind(sep)
            if idx != -1 and idx >= min_reasonable:
                candidates.append(start + idx + len(sep))

        if candidates:
            split_pos = max(candidates)  # choose the farthest good split
        else:
            split_pos = window_end  # just cut at the window end

        end = split_pos

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= n:
            break

        # Move start forward with overlap
        start = max(0, end - overlap)

    return chunks


def process_file(in_path: Path, rel: Path):
    """
    Read one cleaned .txt file, chunk it, and write JSONL file
    into data_chunks/ with same relative path (but .jsonl extension).
    """
    out_rel = rel.with_suffix(".jsonl")
    out_path = Path(OUTPUT_CHUNK_DIR) / out_rel
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with open(in_path, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read().strip()

    chunks = smart_char_chunks(text)

    with open(out_path, "w", encoding="utf-8") as f:
        for idx, chunk in enumerate(chunks):
            record = {
                "id": f"{str(out_rel.with_suffix('')).replace(os.sep, '/')}-{idx}",
                "source": str(rel).replace(os.sep, "/"),
                "chunk_index": idx,
                "text": chunk,
            }
            f.write(json.dumps(record, ensure_ascii=False) + "\n")


def main():
    ensure_dir(OUTPUT_CHUNK_DIR)

    for root, _, files in os.walk(INPUT_TEXT_DIR):
        for fname in tqdm(files, desc=f"Chunking in {root}"):
            if not fname.lower().endswith(".txt"):
                continue

            in_path = Path(root) / fname
            rel = in_path.relative_to(INPUT_TEXT_DIR)

            process_file(in_path, rel)


if __name__ == "__main__":
    main()
