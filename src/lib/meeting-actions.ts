"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { meetings } from "@/db/schema";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function valuesFromForm(formData: FormData) {
  return {
    withWhom: str(formData, "withWhom") ?? "",
    context: str(formData, "context"),
    responsibleUserId: str(formData, "responsibleUserId"),
    meetingType: str(formData, "meetingType") ?? "IN_PERSON",
    meetingDate: str(formData, "meetingDate"),
    meetingTime: str(formData, "meetingTime"),
  };
}

export async function createMeeting(formData: FormData) {
  await db.insert(meetings).values(valuesFromForm(formData));
  revalidatePath("/crm/meetings");
}

export async function deleteMeeting(meetingId: string) {
  await db.delete(meetings).where(eq(meetings.id, meetingId));
  revalidatePath("/crm/meetings");
}
