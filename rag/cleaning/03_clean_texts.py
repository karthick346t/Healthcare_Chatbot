# 03_clean_texts.py
import os
import re
from pathlib import Path
from tqdm import tqdm

# This file is in rag/cleaning/ (or rag/extracting/), so go up one level to rag/
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

# Input: already-extracted raw text
INPUT_TEXT_DIR = os.path.join(BASE_DIR, "data_text")

# Output: cleaned text
OUTPUT_TEXT_DIR = os.path.join(BASE_DIR, "data_text_clean")


def ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def clean_text(text: str) -> str:
    """
    Shallow cleaning for MedlinePlus-style pages
    (both Encyclopedia and Drug Info):

      - Fix common encoding artifacts
      - Drop navigation / banner / share / cite / browse boilerplate
      - Normalize whitespace and blank lines
    """

    # --- Fix common mis-encoded characters ---
    text = text.replace("\xa0", " ")  # non-breaking space
    text = text.replace("Â", " ")     # often appears around symbols
    replacements = {
        "â": "'",   # apostrophe
        "â": '"',   # left double quote
        "â": '"',   # right double quote
        "â": "-",   # en dash
        "â": "-",   # em dash
        "Â®": "",     # registered mark
    }
    for bad, good in replacements.items():
        text = text.replace(bad, good)

    # --- Line-based filtering ---
    lines = [line.strip() for line in text.splitlines()]

    # Lines we know are pure boilerplate / nav / chrome
    drop_exact = {
        "Skip navigation",
        "Official websites use .gov",
        ".gov",
        "A",
        "website belongs to an official government",
        "organization in the United States.",
        "Secure .gov websites use HTTPS",
        "lock",
        "(Lock",
        "Locked padlock icon",
        ") or",
        "https://",
        "means you've safely connected to",
        "means you’ve safely connected to",
        "Share sensitive information only on official,",
        "secure websites.",
        "You Are Here:",
        "Home",
        "Medical Encyclopedia",
        "Drugs, Herbs and Supplements",
        "Learn how to cite this page",
        "Browse Drugs and Medicines",
    }

    # Lines that start with any of these prefixes will be dropped
    drop_prefixes = (
        "URL of this page:",
        "To use the sharing features on this page, please enable JavaScript.",
    )

    cleaned_lines: list[str] = []

    for line in lines:
        if not line:
            # Keep blank lines for now; we’ll collapse later
            cleaned_lines.append("")
            continue

        # Drop known boilerplate lines
        if line in drop_exact:
            continue

        # Drop lines starting with known boilerplate prefixes
        if any(line.startswith(prefix) for prefix in drop_prefixes):
            continue

        cleaned_lines.append(line)

    cleaned = "\n".join(cleaned_lines)

    # Collapse 3+ blank lines into just 2
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    cleaned = cleaned.strip()

    return cleaned


def main():
    ensure_dir(OUTPUT_TEXT_DIR)

    for root, _, files in os.walk(INPUT_TEXT_DIR):
        for fname in tqdm(files, desc=f"Cleaning in {root}"):
            if not fname.lower().endswith(".txt"):
                continue

            in_path = Path(root) / fname
            rel = in_path.relative_to(INPUT_TEXT_DIR)

            out_path = Path(OUTPUT_TEXT_DIR) / rel
            out_path.parent.mkdir(parents=True, exist_ok=True)

            with open(in_path, "r", encoding="utf-8", errors="ignore") as f:
                raw_text = f.read()

            cleaned = clean_text(raw_text)

            with open(out_path, "w", encoding="utf-8") as f:
                f.write(cleaned)


if __name__ == "__main__":
    main()
