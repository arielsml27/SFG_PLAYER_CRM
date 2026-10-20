"use server";

import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { clubs, clubContacts, clubRequests, requestLinks } from "@/db/schema";
import { getCurrentCrmUser } from "@/lib/current-user";
import { buildRequestRow, cleanPublicRequest, type PublicRequestInput } from "@/lib/request-form";

async function requireUser() {
  const user = await getCurrentCrmUser();
  if (!user) throw new Error("צריך להתחבר מחדש למערכת.");
  return user;
}

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

// 32 random bytes, base64url: 43 unguessable characters, URL safe.
function newToken(): string {
  return randomBytes(32).toString("base64url");
}

// Creates a request link. clubId null = generic link usable by any club.
// A contactId pins the form to one of the club's contacts (prefilled, read-only).
export async function createRequestLink(formData: FormData) {
  const user = await requireUser();
  const clubId = str(formData, "clubId");
  const contactId = str(formData, "contactId");
  let contactName = str(formData, "contactName");

  let resolvedContactId: string | null = null;
  if (clubId && contactId) {
    const contact = (
      await db.select().from(clubContacts).where(and(eq(clubContacts.id, contactId), eq(clubContacts.clubId, clubId)))
    )[0];
    if (contact) {
      resolvedContactId = contact.id;
      contactName = contactName ?? contact.name;
    }
  }

  await db.insert(requestLinks).values({
    token: newToken(),
    clubId,
    contactId: resolvedContactId,
    contactName,
    createdBy: user.id,
    active: true,
  });

  if (clubId) revalidatePath(`/crm/clubs/${clubId}`);
  revalidatePath("/crm/requests");
}

export async function setRequestLinkActive(linkId: string, active: boolean) {
  await requireUser();
  const link = (await db.select().from(requestLinks).where(eq(requestLinks.id, linkId)))[0];
  if (!link) return;
  await db.update(requestLinks).set({ active }).where(eq(requestLinks.id, linkId));
  if (link.clubId) revalidatePath(`/crm/clubs/${link.clubId}`);
  revalidatePath("/crm/requests");
}

// ---------- Public submit (no login) ----------

// Per-token throttle: a club contact will never legitimately send more than a
// handful of requests in a few minutes, and this stops a leaked link from being
// used to flood the CRM. In-memory is fine for a single-instance deployment.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const submissions = new Map<string, number[]>();

function rateLimited(token: string): boolean {
  const now = Date.now();
  const recent = (submissions.get(token) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    submissions.set(token, recent);
    return true;
  }
  recent.push(now);
  submissions.set(token, recent);
  return false;
}

export type SubmitResult = { ok: true } | { ok: false; error: string };

export async function submitPublicRequest(token: string, raw: Partial<PublicRequestInput>): Promise<SubmitResult> {
  if (typeof token !== "string" || token.length < 16 || token.length > 128) return { ok: false, error: "inactive" };

  const link = (await db.select().from(requestLinks).where(eq(requestLinks.token, token)))[0];
  if (!link || !link.active) return { ok: false, error: "inactive" };
  if (rateLimited(token)) return { ok: false, error: "failed" };

  const contact = link.contactId
    ? (await db.select().from(clubContacts).where(eq(clubContacts.id, link.contactId)))[0] ?? null
    : null;
  const club = link.clubId ? (await db.select().from(clubs).where(eq(clubs.id, link.clubId)))[0] ?? null : null;

  const cleaned = cleanPublicRequest(raw, { clubLocked: !!club, contactLocked: !!contact });
  if (!cleaned.ok) return cleaned;

  // When the link is pinned to a contact, the CRM record wins over whatever
  // the browser sent for the read-only fields.
  const input: PublicRequestInput = contact
    ? { ...cleaned.value, name: contact.name, role: contact.role ?? cleaned.value.role, phone: contact.phone ?? cleaned.value.phone }
    : cleaned.value;
  if (!input.name && link.contactName) input.name = link.contactName;

  const row = buildRequestRow(input, { clubName: club?.name ?? null });

  await db.insert(clubRequests).values({
    clubId: link.clubId,
    positionSought: row.positionSought,
    notes: row.notes,
    source: row.source,
    requestLinkId: link.id,
    status: "OPEN",
  });

  console.info(`[request-form] new request via link ${link.id} (${club?.name ?? "no club"})`);
  revalidatePath("/crm/requests");
  if (link.clubId) revalidatePath(`/crm/clubs/${link.clubId}`);
  return { ok: true };
}
