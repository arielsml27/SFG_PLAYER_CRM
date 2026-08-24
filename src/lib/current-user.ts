import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { crmUsers } from "@/db/schema";
import { CRM_AUTH_COOKIE, verifySessionToken } from "@/lib/crm-auth";

export async function getCurrentCrmUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CRM_AUTH_COOKIE)?.value;
  const userId = await verifySessionToken(token);
  if (!userId) return null;

  const rows = await db.select().from(crmUsers).where(eq(crmUsers.id, userId));
  return rows[0] ?? null;
}
