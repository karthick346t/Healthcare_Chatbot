/**
 * Removes unwanted artifacts from model responses
 * (DeepSeek, LLaMA, Gemini, etc.)
 */
export function cleanModelText(text: string): string {
  if (!text) return "";

  return text
    // DeepSeek / LLaMA artifacts (add fullwidth pipe support)
    .replace(/<\|begin▁of▁sentence\|>/gi, "")
    .replace(/<\|end▁of▁sentence\|>/gi, "")
    .replace(/<\|.*?\|>/g, "") // <|...|>
    // --- new: match fullwidth vertical bar and any variant ---
    .replace(/<[\|｜].*?[\|｜]>/g, "") // matches <|...|> or <｜...｜>
    // --- also catch /gi in Unicode mode, and angle-brackets-only tokens
    .replace(/<.*?>/g, "")
    .replace(/<\/?s>/gi, "")
    // Unicode invisible characters or tokens
    .replace(/\p{Cf}/gu, "")
    // .replace(/\s+/g, " ") // REMOVED: broken markdown structure by removing newlines
    .trim();
}
