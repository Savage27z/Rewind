const windows = new Map<string, number[]>();

export function rateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const timestamps = (windows.get(key) || []).filter((t) => t > cutoff);

  if (timestamps.length >= maxRequests) {
    const oldest = timestamps[0];
    return { allowed: false, remaining: 0, retryAfterMs: oldest + windowMs - now };
  }

  timestamps.push(now);
  windows.set(key, timestamps);

  return { allowed: true, remaining: maxRequests - timestamps.length, retryAfterMs: 0 };
}
