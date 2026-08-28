/**
 * הגבלת ניסיונות כניסה. מונה בזיכרון — מספיק למערכת של משתמש אחד,
 * ומתאפס בהפעלה מחדש. המטרה היא לחסום ניחוש סיסמאות אוטומטי ברגע
 * שהמערכת נגישה מהאינטרנט.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

type Bucket = { count: number; firstAt: number };

declare global {
  var __samuelLoginBuckets: Map<string, Bucket> | undefined;
}

const buckets = (globalThis.__samuelLoginBuckets ??= new Map<string, Bucket>());

export function checkLoginAllowed(key: string): { allowed: boolean; retryInMinutes: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.firstAt > WINDOW_MS) {
    return { allowed: true, retryInMinutes: 0 };
  }
  if (bucket.count < MAX_ATTEMPTS) {
    return { allowed: true, retryInMinutes: 0 };
  }
  return {
    allowed: false,
    retryInMinutes: Math.max(1, Math.ceil((WINDOW_MS - (now - bucket.firstAt)) / 60000)),
  };
}

export function recordFailedLogin(key: string) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.firstAt > WINDOW_MS) {
    buckets.set(key, { count: 1, firstAt: now });
    return;
  }
  bucket.count += 1;
}

export function clearLoginAttempts(key: string) {
  buckets.delete(key);
}
