type Bucket = { failures: number; windowStart: number; lockedUntil: number };

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;
const LOCK_MS = 15 * 60 * 1000;

const g = globalThis as typeof globalThis & {
  __ctrLoginBuckets?: Map<string, Bucket>;
};

function buckets(): Map<string, Bucket> {
  g.__ctrLoginBuckets ??= new Map();
  return g.__ctrLoginBuckets;
}

export function clientKeyFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export function checkLoginAllowed(key: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets().get(key);
  if (!bucket) return { ok: true };
  if (bucket.lockedUntil > now) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.lockedUntil - now) / 1000) };
  }
  if (now - bucket.windowStart > WINDOW_MS) {
    buckets().delete(key);
    return { ok: true };
  }
  return { ok: true };
}

export function recordLoginFailure(key: string): void {
  const now = Date.now();
  const current = buckets().get(key);
  if (!current || now - current.windowStart > WINDOW_MS) {
    buckets().set(key, { failures: 1, windowStart: now, lockedUntil: 0 });
    return;
  }
  current.failures += 1;
  if (current.failures >= MAX_FAILURES) {
    current.lockedUntil = now + LOCK_MS;
  }
  buckets().set(key, current);
}

export function recordLoginSuccess(key: string): void {
  buckets().delete(key);
}
