// Lightweight heuristic to produce a concise 10-15 word insight from full text
export function shortenInsight(text: string, minWords: number = 10, maxWords: number = 15): string {
  if (!text || typeof text !== 'string') return '';

  // Normalize spaces/newlines
  let t = text.replace(/\s+/g, ' ').trim();

  // Remove the word 'summary' (case-insensitive) from the content
  t = t.replace(/\bsummary\b/gi, '');
  t = t.replace(/\s+/g, ' ').trim();

  // Split into words, strip basic punctuation from ends
  const rawWords = t
    .split(/\s+/)
    .map(w => w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ''))
    .filter(w => w && w.length > 0);

  if (rawWords.length <= maxWords) {
    // Return as-is (after trimming) if within limit
    return rawWords.join(' ').trim();
  }

  // Take the first maxWords words to satisfy the 10-15 word window
  const clipped = rawWords.slice(0, maxWords);
  // Ensure we meet minWords if possible
  const result = clipped.length >= minWords ? clipped : rawWords.slice(0, maxWords);
  return result.join(' ').trim();
}

export default shortenInsight;
