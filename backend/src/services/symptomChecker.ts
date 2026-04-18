/**
 * Symptom Checker Service
 *
 * Rule-based urgency triage to classify user messages into:
 *   EMERGENCY  → Needs 911 / immediate care
 *   URGENT     → Should see a doctor within hours (same-day)
 *   ROUTINE    → Can be addressed via chatbot / scheduled appointment
 *
 * This is intentionally conservative — uncertain cases are escalated
 * to a higher urgency tier (fail-safe toward safety).
 */

export type UrgencyLevel = 'EMERGENCY' | 'URGENT' | 'ROUTINE';

export interface SymptomCheckResult {
  level: UrgencyLevel;
  reason: string;
  recommendation: string;
}

// ─────────────────────────────────────────────
// Keyword Rule Sets
// ─────────────────────────────────────────────

const EMERGENCY_KEYWORDS: RegExp[] = [
  /\bchest\s*pain\b/i,
  /\bheart\s*attack\b/i,
  /\bstroke\b/i,
  /\bseizure\b/i,
  /\bunconscious\b/i,
  /\bcan'?t\s*breathe\b/i,
  /\bsevere\s*bleeding\b/i,
  /\bsuicid(?:e|al)\b/i,
  /\boverdos(?:e|ing)\b/i,
  /\banaphylax(?:is|tic)\b/i,
  /\bpassed?\s*out\b/i,
  /\bcardiac\s*arrest\b/i,
  /\brespiratory\s*arrest\b/i,
  /\bself[\s-]harm\b/i,
  /\bchok(?:ing|e)\b/i,
];

const URGENT_KEYWORDS: RegExp[] = [
  // High fever (38.5°C+ or 101.3°F+)
  /\bhigh\s*fever\b/i,
  /\bfever\s*(?:of\s+)?(?:3[89]|40|41)\b/i,
  /\btemperature\s*(?:of\s+)?(?:10[2-9]|110)\b/i,

  // Infection indicators
  /\bsevere\s*(?:headache|migraine)\b/i,
  /\bstiff\s*neck\b/i,
  /\bmeningitis\b/i,
  /\bsepsis\b/i,

  // Breathing
  /\bshortness\s*of\s*breath\b/i,
  /\bdifficulty\s*breathing\b/i,

  // Digestive
  /\bblood\s*in\s*(?:stool|urine|vomit)\b/i,
  /\bvomiting\s*blood\b/i,
  /\bsevere\s*abdominal\s*pain\b/i,

  // Neurological
  /\bsudden\s*(?:vision\s*loss|confusion|weakness)\b/i,
  /\bextreme\s*dizziness\b/i,
  /\bsevere\s*vertigo\b/i,

  // Trauma
  /\bbroken?\s*bone\b/i,
  /\bfracture\b/i,
  /\bdeep\s*cut\b/i,
  /\bsevere\s*burn\b/i,

  // Pediatric
  /\bbab(?:y|ies)\s*(?:not|won'?t)\s*(?:breathe|eat|respond)\b/i,
  /\bnewborn\s*fever\b/i,

  // Mental health (non-suicidal but urgent)
  /\bpanic\s*attack\b/i,
  /\bsevere\s*anxiety\s*attack\b/i,
  /\bpsychotic\s*episode\b/i,
];

// ─────────────────────────────────────────────
// Recommendations
// ─────────────────────────────────────────────

const RECOMMENDATIONS: Record<UrgencyLevel, string> = {
  EMERGENCY:
    '🚨 Call emergency services (112 in India / 911 in US) immediately. Do not wait for an appointment.',
  URGENT:
    '⚠️ Please visit the nearest emergency room or urgent care clinic within the next few hours. Do not ignore these symptoms.',
  ROUTINE:
    '✅ Your symptoms appear routine. You may use this chatbot for guidance, or book an appointment with a doctor at your convenience.',
};

// ─────────────────────────────────────────────
// Core Check Function
// ─────────────────────────────────────────────

/**
 * Checks the urgency level of a given user message.
 *
 * @param message - The raw user message text
 * @returns SymptomCheckResult with level, reason, and recommendation
 */
export function checkSymptomUrgency(message: string): SymptomCheckResult {
  if (!message || typeof message !== 'string') {
    return {
      level: 'ROUTINE',
      reason: 'No message provided.',
      recommendation: RECOMMENDATIONS.ROUTINE,
    };
  }

  // Check EMERGENCY first (highest priority, fail-safe)
  for (const pattern of EMERGENCY_KEYWORDS) {
    if (pattern.test(message)) {
      return {
        level: 'EMERGENCY',
        reason: `Emergency keyword matched: "${pattern.source}"`,
        recommendation: RECOMMENDATIONS.EMERGENCY,
      };
    }
  }

  // Check URGENT
  for (const pattern of URGENT_KEYWORDS) {
    if (pattern.test(message)) {
      return {
        level: 'URGENT',
        reason: `Urgent symptom keyword matched: "${pattern.source}"`,
        recommendation: RECOMMENDATIONS.URGENT,
      };
    }
  }

  // Default: ROUTINE
  return {
    level: 'ROUTINE',
    reason: 'No high-urgency keywords detected.',
    recommendation: RECOMMENDATIONS.ROUTINE,
  };
}

/**
 * Returns a formatted contextual note based on urgency level,
 * suitable for prepending to RAG results or model context.
 */
export function buildUrgencyContext(result: SymptomCheckResult): string {
  if (result.level === 'ROUTINE') return '';

  const icon = result.level === 'EMERGENCY' ? '🚨' : '⚠️';
  return `\n\n${icon} **Urgency Level: ${result.level}**\n${result.recommendation}\n`;
}

export default { checkSymptomUrgency, buildUrgencyContext };
