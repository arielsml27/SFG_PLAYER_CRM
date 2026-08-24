import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userPlayerAssignments } from "@/db/schema";

// null = no restriction (ADMIN sees everyone). An array restricts to those player IDs.
export async function getVisiblePlayerIds(user: { id: string; role: string }): Promise<string[] | null> {
  if (user.role === "ADMIN") return null;
  const rows = await db
    .select({ playerId: userPlayerAssignments.playerId })
    .from(userPlayerAssignments)
    .where(eq(userPlayerAssignments.userId, user.id));
  return rows.map((r) => r.playerId);
}
