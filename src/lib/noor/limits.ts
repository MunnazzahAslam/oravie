/** Cost and abuse limits for Noor, shared by the chat route and the chat UI. */
export const NOOR_LIMITS = {
  maxInputChars: 500,
  maxHistory: 12,
  maxOutputTokens: 400,
  /** Model calls per reply, counting tool round trips. */
  maxSteps: 5,
  /** Messages one visitor may send per window. */
  rateLimit: 20,
  rateWindowMs: 10 * 60_000,
};
