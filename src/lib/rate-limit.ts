/**
 * A small sliding-window rate limit, kept in memory per server instance.
 * On Vercel each instance counts separately, so this is a first line of
 * defence against a single visitor hammering the chat; the hard ceiling on
 * cost is the spending limit set in the AI provider's dashboard.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  const allowed = recent.length < limit;
  if (allowed) recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing without bound.
  if (hits.size > 5000) {
    for (const [k, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return { allowed, retryAfterSeconds: allowed ? 0 : Math.ceil((windowMs - (now - recent[0])) / 1000) };
}

/** The visitor's address as reported by the hosting proxy. */
export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}
