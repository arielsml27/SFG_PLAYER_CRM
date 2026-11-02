import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks, userPlayerAssignments } from "@/db/schema";
import { getCurrentCrmUser } from "@/lib/current-user";

type CrmUser = NonNullable<Awaited<ReturnType<typeof getCurrentCrmUser>>>;

// null = no restriction (ADMIN sees everyone). An array restricts to those player IDs.
export async function getVisiblePlayerIds(user: { id: string; role: string }): Promise<string[] | null> {
  if (user.role === "ADMIN") return null;
  const rows = await db
    .select({ playerId: userPlayerAssignments.playerId })
    .from(userPlayerAssignments)
    .where(eq(userPlayerAssignments.userId, user.id));
  return rows.map((r) => r.playerId);
}

// ---------- Guards for server actions ----------
// Every write action must call one of these before touching the DB. Page-level
// redirects and hidden nav items are only UX: a server action can be invoked
// directly, so the check has to live next to the write.

export class AccessDeniedError extends Error {
  constructor(message = "אין לך הרשאה לפעולה הזו") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export async function requireCrmUser(): Promise<CrmUser> {
  const user = await getCurrentCrmUser();
  if (!user) throw new AccessDeniedError("נדרשת התחברות");
  return user;
}

export async function requireAdmin(): Promise<CrmUser> {
  const user = await requireCrmUser();
  if (user.role !== "ADMIN") throw new AccessDeniedError("פעולה למנהל בלבד");
  return user;
}

// ADMIN: always. AGENT: only for a player assigned to them.
export async function requirePlayerAccess(playerId: string): Promise<CrmUser> {
  const user = await requireCrmUser();
  if (user.role === "ADMIN") return user;
  const [row] = await db
    .select({ playerId: userPlayerAssignments.playerId })
    .from(userPlayerAssignments)
    .where(and(eq(userPlayerAssignments.userId, user.id), eq(userPlayerAssignments.playerId, playerId)));
  if (!row) throw new AccessDeniedError("השחקן הזה לא משויך אליך");
  return user;
}

// Tasks: a task linked to a player follows that player's access; a task with
// no player is shared agency work that any logged-in user may handle.
export async function requireTaskAccess(taskId: string): Promise<CrmUser> {
  const user = await requireCrmUser();
  if (user.role === "ADMIN") return user;
  const [task] = await db.select({ playerId: tasks.playerId }).from(tasks).where(eq(tasks.id, taskId));
  if (!task) throw new AccessDeniedError("המשימה לא נמצאה");
  if (task.playerId) await requirePlayerAccess(task.playerId);
  return user;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentCrmUser();
  return user?.role === "ADMIN";
}
