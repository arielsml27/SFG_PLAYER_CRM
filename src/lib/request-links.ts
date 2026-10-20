// Read side of the public request links (server only, no "use server").
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { clubs, clubContacts, requestLinks } from "@/db/schema";

export type RequestLinkRow = typeof requestLinks.$inferSelect;

export async function getRequestLinksForClub(clubId: string) {
  return db.select().from(requestLinks).where(eq(requestLinks.clubId, clubId)).orderBy(desc(requestLinks.createdAt));
}

// Links not tied to any club (created from the requests page).
export async function getGenericRequestLinks() {
  return db.select().from(requestLinks).where(isNull(requestLinks.clubId)).orderBy(desc(requestLinks.createdAt));
}

// Everything the public page needs for one token. Null when the token is
// unknown; inactive links are returned with active=false so the page can
// say so instead of 404ing a link the club already has.
export async function getRequestLinkByToken(token: string) {
  if (!token || token.length < 16 || token.length > 128) return null;
  const link = (await db.select().from(requestLinks).where(eq(requestLinks.token, token)))[0];
  if (!link) return null;

  const club = link.clubId ? (await db.select().from(clubs).where(eq(clubs.id, link.clubId)))[0] ?? null : null;
  const contact = link.contactId
    ? (await db.select().from(clubContacts).where(and(eq(clubContacts.id, link.contactId))))[0] ?? null
    : null;

  return { link, club, contact };
}

export function requestLinkUrl(token: string): string {
  return `/request/${token}`;
}
