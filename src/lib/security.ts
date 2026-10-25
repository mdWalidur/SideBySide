const buckets = new Map<string, { count: number; resetAt: number }>();
const MAX_RATE_LIMIT_BUCKETS = 10_000;
let nextSweepAt = 0;

export function requestRateLimitKey(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  const forwardedChain = request.headers.get("x-forwarded-for");
  const forwardedIp = forwardedChain?.split(",").at(-1)?.trim();
  return (realIp || forwardedIp || "local").slice(0, 100);
}

export function checkRateLimit(key: string, maxRequests = 60, windowMs = 60_000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  if (now >= nextSweepAt || (buckets.size >= MAX_RATE_LIMIT_BUCKETS && !buckets.has(key))) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
    nextSweepAt = now + Math.min(windowMs, 60_000);
  }

  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    if (buckets.size >= MAX_RATE_LIMIT_BUCKETS) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey !== undefined) buckets.delete(oldestKey);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count };
}

export function sanitizeText(value: unknown, maxLength = 320): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLength);
}

export function parseBoundedNumber(
  value: unknown,
  min: number,
  max: number
): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const num = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(num)) return undefined;
  return Math.max(min, Math.min(max, num));
}

