"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { clubRequests, requestProposedPlayers } from "@/db/schema";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function valuesFromForm(formData: FormData) {
  return {
    country: str(formData, "country"),
    league: str(formData, "league"),
    club: str(formData, "club"),
    positionSought: str(formData, "positionSought"),
    transferBudget: str(formData, "transferBudget"),
    salaryBudget: str(formData, "salaryBudget"),
    notes: str(formData, "notes"),
    handledByUserId: str(formData, "handledByUserId"),
    dealPartner: str(formData, "dealPartner"),
    status: str(formData, "status") ?? "OPEN",
  };
}

export async function createRequest(formData: FormData) {
  await db.insert(clubRequests).values(valuesFromForm(formData));
  revalidatePath("/crm/requests");
}

export async function updateRequest(requestId: string, formData: FormData) {
  await db
    .update(clubRequests)
    .set({ ...valuesFromForm(formData), updatedAt: new Date().toISOString() })
    .where(eq(clubRequests.id, requestId));
  revalidatePath("/crm/requests");
}

export async function deleteRequest(requestId: string) {
  await db.delete(clubRequests).where(eq(clubRequests.id, requestId));
  revalidatePath("/crm/requests");
}

export async function addProposedPlayer(requestId: string, formData: FormData) {
  const playerId = str(formData, "playerId");
  if (!playerId) return;
  await db.insert(requestProposedPlayers).values({ requestId, playerId }).onConflictDoNothing();
  revalidatePath("/crm/requests");
}

export async function removeProposedPlayer(requestId: string, playerId: string) {
  await db
    .delete(requestProposedPlayers)
    .where(and(eq(requestProposedPlayers.requestId, requestId), eq(requestProposedPlayers.playerId, playerId)));
  revalidatePath("/crm/requests");
}
