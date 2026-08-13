const buckets = new Map();

export function rateLimit({ key, limit = 5, windowMs = 15 * 60 * 1000 }) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (current.count >= limit) {
    const waitMin = Math.max(1, Math.ceil((current.resetAt - now) / 60000));
    return {
      ok: false,
      remaining: 0,
      message: `Too many attempts. Try again in ${waitMin} minute${waitMin === 1 ? "" : "s"}.`,
    };
  }
  current.count += 1;
  return { ok: true, remaining: limit - current.count };
}

export function clearRateLimit(key) {
  buckets.delete(key);
}
