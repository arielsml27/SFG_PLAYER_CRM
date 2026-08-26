"use server";

import { db } from "@/db";
import { clubs, clubContacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCurrentCrmUser } from "@/lib/current-user";

async function requireAdmin() {
  const user = await getCurrentCrmUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Admins only.");
  }
  return user;
}

const CLUB_LOGO_DIR = path.join(process.cwd(), "public", "uploads", "clubs");

async function saveClubLogo(file: File): Promise<string> {
  await mkdir(CLUB_LOGO_DIR, { recursive: true });
  const ext = path.extname(file.name) || ".png";
  const filename = `${crypto.randomUUID()}${ext}`;
  await writeFile(path.join(CLUB_LOGO_DIR, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/clubs/${filename}`;
}

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === "on" || fd.get(key) === "true";
}

export async function createClub(formData: FormData) {
  const logoFile = formData.get("logo");
  const logoPath = logoFile instanceof File && logoFile.size > 0 ? await saveClubLogo(logoFile) : null;

  const [club] = await db
    .insert(clubs)
    .values({
      name: str(formData, "name") ?? "",
      country: str(formData, "country"),
      league: str(formData, "league"),
      city: str(formData, "city"),
      website: str(formData, "website"),
      transfermarktLink: str(formData, "transfermarktLink"),
      logoPath,
      notes: str(formData, "notes"),
    })
    .returning();

  revalidatePath("/crm/clubs");
  redirect(`/crm/clubs/${club.id}`);
}

export async function updateClub(clubId: string, formData: FormData) {
  const logoFile = formData.get("logo");
  const removeLogo = bool(formData, "removeLogo");
  let logoPath: string | null | undefined = undefined;
  if (logoFile instanceof File && logoFile.size > 0) {
    logoPath = await saveClubLogo(logoFile);
  } else if (removeLogo) {
    logoPath = null;
  }

  await db
    .update(clubs)
    .set({
      name: str(formData, "name") ?? "",
      country: str(formData, "country"),
      league: str(formData, "league"),
      city: str(formData, "city"),
      website: str(formData, "website"),
      transfermarktLink: str(formData, "transfermarktLink"),
      ...(logoPath !== undefined ? { logoPath } : {}),
      notes: str(formData, "notes"),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(clubs.id, clubId));

  revalidatePath(`/crm/clubs/${clubId}`);
  revalidatePath("/crm/clubs");
}

export async function addClubContact(clubId: string, formData: FormData) {
  const name = str(formData, "name");
  if (!name) return;
  await db.insert(clubContacts).values({
    clubId,
    name,
    role: str(formData, "role"),
    phone: str(formData, "phone"),
    email: str(formData, "email"),
  });
  revalidatePath(`/crm/clubs/${clubId}`);
}

export async function deleteClubContact(clubId: string, contactId: string) {
  await db.delete(clubContacts).where(eq(clubContacts.id, contactId));
  revalidatePath(`/crm/clubs/${clubId}`);
}

export async function deleteClub(clubId: string) {
  await requireAdmin();

  try {
    await db.delete(clubs).where(eq(clubs.id, clubId));
  } catch {
    throw new Error("אי אפשר למחוק את המועדון - יש שחקנים, חוזים או עסקאות שמקושרים אליו.");
  }

  revalidatePath("/crm/clubs");
  redirect("/crm/clubs");
}
