import { createHash, timingSafeEqual } from "node:crypto";

// Read-only access for Ariel's Claude agent. Enabled only when AGENT_API_TOKEN
// is set on the server (at least 32 characters). Remove the variable to cut
// access off immediately.
const MIN_TOKEN_LENGTH = 32;

export type AgentAuthResult = { ok: true } | { ok: false; status: 401 | 404 };

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function checkAgentToken(request: Request): AgentAuthResult {
  const expected = process.env.AGENT_API_TOKEN ?? "";
  // Not configured: behave as if the endpoint does not exist.
  if (expected.length < MIN_TOKEN_LENGTH) return { ok: false, status: 404 };

  const header = request.headers.get("authorization") ?? "";
  const supplied = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!supplied) return { ok: false, status: 401 };

  return timingSafeEqual(digest(supplied), digest(expected)) ? { ok: true } : { ok: false, status: 401 };
}

export function agentJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}

export function agentDenied(result: Extract<AgentAuthResult, { ok: false }>, path: string): Response {
  console.warn(`[agent-api] denied ${result.status} ${path}`);
  return result.status === 404 ? new Response("Not found", { status: 404 }) : agentJson({ error: "unauthorized" }, 401);
}
