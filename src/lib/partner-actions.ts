"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { partners } from "@/db/schema";
import { getCurrentCrmUser } from "@/lib/current-user";

async function requireUser() {
  const user = await getCurrentCrmUser();
  if (!user) throw new Error("Not authenticated.");
  return user;
}

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function valuesFromForm(formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("שם הוא שדה חובה");
  return {
    name,
    organization: str(formData, "organization"),
    role: str(formData, "role"),
    country: str(formData, "country"),
    city: str(formData, "city"),
    phone: str(formData, "phone"),
    whatsapp: str(formData, "whatsapp"),
    email: str(formData, "email"),
    notes: str(formData, "notes"),
    trusted: formData.get("trusted") === "on" || formData.get("trusted") === "true",
  };
}

export async function createPartner(formData: FormData) {
  await requireUser();
  await db.insert(partners).values(valuesFromForm(formData));
  revalidatePath("/crm/partners");
  redirect("/crm/partners");
}

export async function updatePartner(partnerId: string, formData: FormData) {
  await requireUser();
  await db
    .update(partners)
    .set({ ...valuesFromForm(formData), updatedAt: new Date().toISOString() })
    .where(eq(partners.id, partnerId));
  revalidatePath("/crm/partners");
  revalidatePath(`/crm/partners/${partnerId}`);
  redirect("/crm/partners");
}

export async function deletePartner(partnerId: string) {
  await requireUser();
  await db.delete(partners).where(eq(partners.id, partnerId));
  revalidatePath("/crm/partners");
  redirect("/crm/partners");
}
