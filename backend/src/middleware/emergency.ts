import { Request, Response, NextFunction } from 'express';

// ─────────────────────────────────────────────────────────────────────────────
// Emergency Keyword Interceptor
//
// Catches life-threatening symptom patterns BEFORE the LLM is called.
// If triggered, it returns a structured emergency response immediately.
// This is a safety-critical layer — it must be fast, reliable, and hardcoded.
// ─────────────────────────────────────────────────────────────────────────────

const EMERGENCY_PATTERNS = [
  // Cardiac
  /\bchest\s*pain\b/i,
  /\bheart\s*attack\b/i,
  /\bcardiac\s*arrest\b/i,
  /\bpalpitation[s]?\s*(severe|extreme|can'?t\s*breathe)/i,

  // Respiratory
  /\bcan'?t\s*breathe\b/i,
  /\bstopped?\s*breathing\b/i,
  /\brespiratory\s*(arrest|failure)\b/i,
  /\bsevere\s*shortness\s*of\s*breath\b/i,
  /\bchok(ing|e)\b/i,

  // Neurological
  /\bstroke\b/i,
  /\bseizure\b/i,
  /\bunconscious\b/i,
  /\bblack(?:ed|ing)\s*out\b/i,
  /\bsudden\s*(?:loss\s*of\s*)?(?:vision|speech|numbness|paralysis)\b/i,

  // Bleeding & Trauma
  /\bsevere\s*bleeding\b/i,
  /\blocal\s*blood\s*loss\b/i,
  /\bbleed(?:ing)?\s*(?:heavily|profusely|non-?stop)\b/i,
  /\bsevere\s*trauma\b/i,
  /\bhead\s*injur(?:y|ies)\b/i,

  // Mental health emergencies
  /\bsuicid(?:e|al)\b/i,
  /\bwant\s*to\s*(?:kill|harm|hurt)\s*(?:myself|me)\b/i,
  /\bself[\s-]harm(?:ing)?\b/i,
  /\boverdos(?:e|ing)\b/i,

  // Poisoning & Allergic
  /\bpoison(?:ed|ing)?\b/i,
  /\banaphylax(?:is|tic)\b/i,
  /\bsevere\s*allergic\s*reaction\b/i,

  // General extreme distress
  /\bnot\s*responding\b/i,
  /\bpassed?\s*out\b/i,
  /\bsomeone\s*(?:is\s*)?dying\b/i,
  /\blife[\s-]?threatening\b/i,
];

const EMERGENCY_RESPONSE = `🚨 **This sounds like a medical emergency.**

**Please call emergency services immediately:**
- 🇮🇳 **India:** Dial **112** (National Emergency) or **108** (Ambulance)
- 🌍 **International:** Dial your local emergency number (911 / 999 / 000)

**While waiting for help:**
- Stay calm and stay with the person.
- Do NOT give food or water unless instructed by a professional.
- If trained, begin CPR if the person is unresponsive and not breathing.

⚠️ *NEXA is an AI assistant and cannot respond to emergencies. Please contact trained medical professionals immediately.*`;

/**
 * Emergency Middleware
 *
 * Applied on POST /api/chat before the message reaches the LLM.
 * If the message matches any emergency pattern, it returns an immediate
 * escalation response without touching the LLM at all.
 */
export function emergencyInterceptor(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const message: string = req.body?.message || '';

  if (!message || typeof message !== 'string') {
    return next();
  }

  const isEmergency = EMERGENCY_PATTERNS.some((pattern) => pattern.test(message));

  if (isEmergency) {
    console.warn(`[🚨 EMERGENCY] Keyword detected in message from user: ${req.user?.userId || 'anonymous'}`);
    res.json({ message: EMERGENCY_RESPONSE, isEmergency: true });
    return;
  }

  next();
}
