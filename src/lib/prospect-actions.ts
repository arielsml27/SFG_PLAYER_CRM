"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { prospects } from "@/db/schema";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}
function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  return v === null ? null : Number(v);
}

function valuesFromForm(formData: FormData) {
  const status = str(formData, "status") ?? "NOT_CONTACTED";
  const hasMeeting = status === "MEETING_SCHEDULED";
  const meetingHeld = status === "MEETING_HELD";
  return {
    name: str(formData, "name") ?? "",
    club: str(formData, "club"),
    position: str(formData, "position"),
    age: num(formData, "age"),
    parentPhone: str(formData, "parentPhone"),
    contactedByUserId: str(formData, "contactedByUserId"),
    status,
    meetingDate: hasMeeting ? str(formData, "meetingDate") : null,
    meetingTime: hasMeeting ? str(formData, "meetingTime") : null,
    meetingLocation: hasMeeting ? str(formData, "meetingLocation") : null,
    followUpDate: meetingHeld ? str(formData, "followUpDate") : null,
    notes: meetingHeld ? str(formData, "notes") : null,
  };
}

export async function createProspect(formData: FormData) {
  await db.insert(prospects).values(valuesFromForm(formData));
  revalidatePath("/crm/watchlist");
}

export async function updateProspect(prospectId: string, formData: FormData) {
  await db
    .update(prospects)
    .set({ ...valuesFromForm(formData), updatedAt: new Date().toISOString() })
    .where(eq(prospects.id, prospectId));
  revalidatePath("/crm/watchlist");
}

export async function deleteProspect(prospectId: string) {
  await db.delete(prospects).where(eq(prospects.id, prospectId));
  revalidatePath("/crm/watchlist");
}
