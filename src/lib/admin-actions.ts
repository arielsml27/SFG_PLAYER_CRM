"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { crmUsers, userPlayerAssignments } from "@/db/schema";
import { getCurrentCrmUser } from "@/lib/current-user";
import { hashPassword } from "@/lib/password";

async function requireAdmin() {
  const user = await getCurrentCrmUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Admins only.");
  }
  return user;
}

export async function createCrmUser(formData: FormData) {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "AGENT";

  if (!email || !password) return;

  const { hash, salt } = hashPassword(password);
  await db.insert(crmUsers).values({ email, name, passwordHash: hash, passwordSalt: salt, role });

  revalidatePath("/crm/admin/users");
}

export async function deleteCrmUser(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) return; // don't let an admin delete their own account

  await db.delete(crmUsers).where(eq(crmUsers.id, userId));
  revalidatePath("/crm/admin/users");
}

export async function updateUserPlayerAssignments(userId: string, formData: FormData) {
  await requireAdmin();

  const playerIds = formData.getAll("playerIds").map(String);

  await db.delete(userPlayerAssignments).where(eq(userPlayerAssignments.userId, userId));
  if (playerIds.length > 0) {
    await db.insert(userPlayerAssignments).values(playerIds.map((playerId) => ({ userId, playerId })));
  }

  revalidatePath("/crm/admin/users");
}
