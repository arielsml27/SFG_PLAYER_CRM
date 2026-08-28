/**
 * חתימת סשן — Web Crypto בלבד, כדי שירוץ גם ב-middleware (Edge).
 * הסוד מגיע מ-APP_SECRET; אם לא הוגדר, המערכת עדיין עובדת מקומית
 * אבל העוגייה אינה מוגנת מזיוף — ראה README.
 */
export const AUTH_COOKIE = "samuel_auth";

async function hmacHex(message: string): Promise<string> {
  const secret = process.env.APP_SECRET ?? "samuel-local-dev-secret";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function signSessionToken(userId: string): Promise<string> {
  return `${userId}.${await hmacHex(userId)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const userId = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmacHex(userId);
  if (sig.length !== expected.length) return null;
  // השוואה בזמן קבוע
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? userId : null;
}
