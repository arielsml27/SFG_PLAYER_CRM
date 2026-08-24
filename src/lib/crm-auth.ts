export const CRM_AUTH_COOKIE = "crm_auth";

// CRM_PASSWORD now doubles as the session-signing secret (not a shared login
// password anymore — each user has their own password, see crm-auth-actions.ts).
// Kept edge-safe (Web Crypto only, no node:sqlite) so it can run in middleware.
async function hmacHex(message: string): Promise<string> {
  const secret = process.env.CRM_PASSWORD ?? "";
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
  const sig = await hmacHex(userId);
  return `${userId}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const userId = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmacHex(userId);
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? userId : null;
}
