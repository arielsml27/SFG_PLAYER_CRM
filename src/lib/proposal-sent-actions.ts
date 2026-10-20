"use server";

import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { clubs, proposalsSent } from "@/db/schema";
import { getCurrentCrmUser } from "@/lib/current-user";
import { getVisiblePlayerIds } from "@/lib/permissions";
import { PROPOSAL_SENT_STATUSES } from "@/lib/constants";
import { PROPOSAL_LANGS, type ProposalLang } from "@/lib/proposal";

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

function revalidateFor(playerId: string, clubId: string | null) {
  revalidatePath(`/crm/players/${playerId}`);
  if (clubId) revalidatePath(`/crm/clubs/${clubId}`);
  revalidatePath("/crm/clubs/map");
}

// Called from the proposal page when the user sends / copies the proposal for a
// club. The club is matched by id when the "prepared for" text is one of our
// clubs, otherwise the free text is kept. The same player + club within 24 hours
// updates the existing row instead of adding another one.
export async function logProposalSent(input: {
  playerId: string;
  clubId?: string | null;
  clubNameFree?: string | null;
  language: string;
}): Promise<{ ok: true; id: string; updated: boolean } | { ok: false; error: string }> {
  const user = await getCurrentCrmUser();
  if (!user) return { ok: false, error: "צריך להתחבר מחדש למערכת." };

  const visible = await getVisiblePlayerIds(user);
  if (visible && !visible.includes(input.playerId)) return { ok: false, error: "אין הרשאה לשחקן הזה." };

  const clubNameFree = input.clubNameFree?.trim() || null;
  let clubId = input.clubId?.trim() || null;
  if (clubId) {
    const rows = await db.select({ id: clubs.id }).from(clubs).where(eq(clubs.id, clubId));
    if (!rows.length) clubId = null;
  }
  if (!clubId && !clubNameFree) return { ok: false, error: "חסר שם מועדון." };

  const language: ProposalLang | null = (PROPOSAL_LANGS as readonly string[]).includes(input.language)
    ? (input.language as ProposalLang)
    : null;
  const now = new Date().toISOString();
  const since = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();
  const sentBy = user.name || user.email;

  const clubMatch = clubId ? eq(proposalsSent.clubId, clubId) : and(isNull(proposalsSent.clubId), eq(proposalsSent.clubNameFree, clubNameFree!));
  const existing = await db
    .select({ id: proposalsSent.id })
    .from(proposalsSent)
    .where(and(eq(proposalsSent.playerId, input.playerId), clubMatch, gte(proposalsSent.sentAt, since)))
    .orderBy(desc(proposalsSent.sentAt));

  if (existing.length) {
    await db
      .update(proposalsSent)
      .set({ sentAt: now, sentBy, language, clubNameFree, updatedAt: now })
      .where(eq(proposalsSent.id, existing[0].id));
    revalidateFor(input.playerId, clubId);
    return { ok: true, id: existing[0].id, updated: true };
  }

  const [row] = await db
    .insert(proposalsSent)
    .values({ playerId: input.playerId, clubId, clubNameFree, sentAt: now, sentBy, language, status: "SENT" })
    .returning({ id: proposalsSent.id });
  revalidateFor(input.playerId, clubId);
  return { ok: true, id: row.id, updated: false };
}

export async function updateProposalSentStatus(proposalId: string, status: string) {
  if (!(PROPOSAL_SENT_STATUSES as readonly string[]).includes(status)) return;
  const [row] = await db
    .update(proposalsSent)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(proposalsSent.id, proposalId))
    .returning({ playerId: proposalsSent.playerId, clubId: proposalsSent.clubId });
  if (row) revalidateFor(row.playerId, row.clubId);
}

export async function deleteProposalSent(proposalId: string) {
  const [row] = await db
    .delete(proposalsSent)
    .where(eq(proposalsSent.id, proposalId))
    .returning({ playerId: proposalsSent.playerId, clubId: proposalsSent.clubId });
  if (row) revalidateFor(row.playerId, row.clubId);
}
