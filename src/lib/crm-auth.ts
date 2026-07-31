export const CRM_AUTH_COOKIE = "crm_auth";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hashBuffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function expectedCrmAuthToken(): Promise<string> {
  const password = process.env.CRM_PASSWORD ?? "";
  return sha256Hex(`crm-auth:${password}`);
}
