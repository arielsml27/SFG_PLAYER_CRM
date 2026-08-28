import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { AUTH_COOKIE, verifySessionToken } from "./auth";

export type CurrentUser = { id: string; name: string; email: string };

export async function currentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const userId = await verifySessionToken(token);
  if (!userId) return null;
  const rows = await db
    .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await currentUser();
  if (!user) throw new Error("לא מחובר");
  return user;
}
