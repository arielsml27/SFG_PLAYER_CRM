import { db } from "@/db";
import { players, clubContracts, representationAgreements, tasks, clubs, playerLinks, videos, documents, contacts, timelineEvents, deals, scoutingReports, questionnaireResponses } from "@/db/schema";
import { and, asc, desc, eq, gte, isNull, lte, like, or, sql } from "drizzle-orm";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function plusDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------- Dashboard ----------

export async function getDashboardData(visiblePlayerIds: string[] | null = null) {
  const today = todayISO();
  const in90 = plusDaysISO(90);
  const isVisible = (playerId: string | null | undefined) =>
    !visiblePlayerIds || (!!playerId && visiblePlayerIds.includes(playerId));

  const allPlayersRaw = await db.select().from(players);
  const allPlayers = visiblePlayerIds ? allPlayersRaw.filter((p) => visiblePlayerIds.includes(p.id)) : allPlayersRaw;
  const activePlayers = allPlayers.filter((p) => p.status === "ACTIVE_CLIENT");

  const expiringContracts = (
    await db
      .select({
        id: clubContracts.id,
        playerId: clubContracts.playerId,
        endDate: clubContracts.endDate,
        clubId: clubContracts.clubId,
        status: clubContracts.status,
      })
      .from(clubContracts)
      .where(and(gte(clubContracts.endDate, today), lte(clubContracts.endDate, in90), eq(clubContracts.status, "ACTIVE")))
      .orderBy(asc(clubContracts.endDate))
  ).filter((c) => isVisible(c.playerId));

  const expiringRepresentation = (
    await db
      .select()
      .from(representationAgreements)
      .where(
        and(
          gte(representationAgreements.endDate, today),
          lte(representationAgreements.endDate, in90),
          eq(representationAgreements.status, "ACTIVE")
        )
      )
      .orderBy(asc(representationAgreements.endDate))
  ).filter((r) => isVisible(r.playerId));

  const criticalTasks = (
    await db
      .select()
      .from(tasks)
      .where(and(or(eq(tasks.priority, "CRITICAL"), eq(tasks.priority, "HIGH")), or(eq(tasks.status, "OPEN"), eq(tasks.status, "IN_PROGRESS"))))
      .orderBy(asc(tasks.dueDate))
  ).filter((t) => isVisible(t.playerId));

  const openTasksCount = (
    await db.select().from(tasks).where(or(eq(tasks.status, "OPEN"), eq(tasks.status, "IN_PROGRESS")))
  ).filter((t) => isVisible(t.playerId)).length;

  const criticalPlayers = allPlayers.filter((p) => (p.priorityLevel ?? 0) >= 4);

  const openDeals = (
    await db.select().from(deals).where(or(eq(deals.status, "OPEN"), eq(deals.status, "IN_NEGOTIATION")))
  ).filter((d) => isVisible(d.playerId));

  const allClubs = await db.select().from(clubs);
  const clubById = new Map(allClubs.map((c) => [c.id, c]));
  const playerById = new Map(allPlayers.map((p) => [p.id, p]));

  // players missing key info
  const allLinks = await db.select().from(playerLinks);
  const allVideos = await db.select().from(videos);
  const allContacts = await db.select().from(contacts);
  const allContractsList = await db.select().from(clubContracts);
  const allRepList = await db.select().from(representationAgreements);

  const linksByPlayer = groupBy(allLinks, (l) => l.playerId);
  const videosByPlayer = groupBy(allVideos, (v) => v.playerId);
  const contactsByPlayer = groupBy(allContacts, (c) => c.playerId);
  const contractsByPlayer = groupBy(allContractsList, (c) => c.playerId);
  const repByPlayer = groupBy(allRepList, (r) => r.playerId);

  const missingInfoPlayers = allPlayers
    .filter((p) => p.status !== "LOST" && p.status !== "CLOSED")
    .map((p) => {
      const missing: string[] = [];
      if (!contractsByPlayer.get(p.id)?.length) missing.push("חוזה");
      if (!repByPlayer.get(p.id)?.length) missing.push("הסכם ייצוג");
      const hasStatsLink = linksByPlayer.get(p.id)?.some((l) => ["TRANSFERMARKT", "SOFASCORE", "WYSCOUT", "INSTAT"].includes(l.type));
      if (!hasStatsLink) missing.push("לינק סטטיסטיקה");
      if (!videosByPlayer.get(p.id)?.length) missing.push("וידאו");
      const hasFamilyContact = contactsByPlayer.get(p.id)?.some((c) => c.role === "FATHER" || c.role === "MOTHER");
      if (!hasFamilyContact) missing.push("איש קשר משפחתי");
      return { player: p, missing };
    })
    .filter((x) => x.missing.length > 0);

  return {
    totalPlayers: allPlayers.length,
    activePlayersCount: activePlayers.length,
    openTasksCount,
    criticalPlayersCount: criticalPlayers.length,
    openDealsCount: openDeals.length,
    missingInfoCount: missingInfoPlayers.length,
    expiringContracts: expiringContracts.map((c) => ({
      ...c,
      player: playerById.get(c.playerId),
      club: c.clubId ? clubById.get(c.clubId) : undefined,
    })),
    expiringRepresentation: expiringRepresentation.map((r) => ({
      ...r,
      player: playerById.get(r.playerId),
    })),
    criticalTasks: criticalTasks.map((t) => ({
      ...t,
      player: t.playerId ? playerById.get(t.playerId) : undefined,
    })),
    missingInfoPlayers,
  };
}

function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

// ---------- Players list ----------

export async function getPlayersList(
  params: { q?: string; status?: string; position?: string },
  visiblePlayerIds: string[] | null = null
) {
  const allPlayersRaw = await db.select().from(players).orderBy(desc(players.updatedAt));
  const allPlayers = visiblePlayerIds ? allPlayersRaw.filter((p) => visiblePlayerIds.includes(p.id)) : allPlayersRaw;
  const allClubs = await db.select().from(clubs);
  const clubById = new Map(allClubs.map((c) => [c.id, c]));

  const allContractsList = await db.select().from(clubContracts);
  const allRepList = await db.select().from(representationAgreements);
  const contractsByPlayer = groupBy(allContractsList, (c) => c.playerId);
  const repByPlayer = groupBy(allRepList, (r) => r.playerId);

  let list = allPlayers.map((p) => {
    const contracts = (contractsByPlayer.get(p.id) ?? []).slice().sort((a, b) => (a.endDate < b.endDate ? 1 : -1));
    const reps = (repByPlayer.get(p.id) ?? []).slice().sort((a, b) => (a.endDate < b.endDate ? 1 : -1));
    return {
      ...p,
      club: p.currentClubId ? clubById.get(p.currentClubId) : undefined,
      latestContract: contracts[0],
      latestRepresentation: reps[0],
    };
  });

  if (params.q) {
    const q = params.q.trim().toLowerCase();
    list = list.filter((p) =>
      [p.firstName, p.lastName, p.fullNameHebrew, p.fullNameEnglish, p.club?.name, p.currentCountry]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q))
    );
  }
  if (params.status) {
    list = list.filter((p) => p.status === params.status);
  }
  if (params.position) {
    list = list.filter((p) => p.mainPosition === params.position);
  }

  return list;
}

// ---------- Player detail ----------

export async function getPlayerDetail(id: string, visiblePlayerIds: string[] | null = null) {
  if (visiblePlayerIds && !visiblePlayerIds.includes(id)) return null;

  const player = (await db.select().from(players).where(eq(players.id, id)))[0];
  if (!player) return null;

  const [club, contracts, representation, links, videoList, docList, contactList, timeline, taskList, dealList, allClubs, scoutingReportRows, questionnaireRows] =
    await Promise.all([
      player.currentClubId ? db.select().from(clubs).where(eq(clubs.id, player.currentClubId)) : Promise.resolve([]),
      db.select().from(clubContracts).where(eq(clubContracts.playerId, id)).orderBy(desc(clubContracts.startDate)),
      db.select().from(representationAgreements).where(eq(representationAgreements.playerId, id)).orderBy(desc(representationAgreements.startDate)),
      db.select().from(playerLinks).where(eq(playerLinks.playerId, id)).orderBy(desc(playerLinks.createdAt)),
      db.select().from(videos).where(eq(videos.playerId, id)).orderBy(desc(videos.createdAt)),
      db.select().from(documents).where(eq(documents.playerId, id)).orderBy(desc(documents.createdAt)),
      db.select().from(contacts).where(eq(contacts.playerId, id)).orderBy(desc(contacts.createdAt)),
      db.select().from(timelineEvents).where(eq(timelineEvents.playerId, id)).orderBy(desc(timelineEvents.eventDate)),
      db.select().from(tasks).where(eq(tasks.playerId, id)).orderBy(desc(tasks.createdAt)),
      db.select().from(deals).where(eq(deals.playerId, id)).orderBy(desc(deals.createdAt)),
      db.select().from(clubs),
      db.select().from(scoutingReports).where(eq(scoutingReports.playerId, id)),
      db.select().from(questionnaireResponses).where(eq(questionnaireResponses.playerId, id)),
    ]);

  const clubById = new Map(allClubs.map((c) => [c.id, c]));

  return {
    player,
    club: club[0],
    contracts: contracts.map((c) => ({ ...c, club: c.clubId ? clubById.get(c.clubId) : undefined })),
    representation,
    links,
    videos: videoList,
    documents: docList,
    contacts: contactList,
    timeline,
    tasks: taskList,
    deals: dealList.map((d) => ({ ...d, club: d.clubId ? clubById.get(d.clubId) : undefined })),
    allClubs,
    scoutingReport: scoutingReportRows[0],
    questionnaireResponses: questionnaireRows,
  };
}

export async function getQuestionnaireResponses(playerId: string) {
  return db.select().from(questionnaireResponses).where(eq(questionnaireResponses.playerId, playerId));
}

export async function getAllClubs() {
  return db.select().from(clubs).orderBy(asc(clubs.name));
}

export async function getAllTasks(params: { status?: string } = {}, visiblePlayerIds: string[] | null = null) {
  const list = await db.select().from(tasks).orderBy(asc(tasks.dueDate));
  const allPlayers = await db.select().from(players);
  const playerById = new Map(allPlayers.map((p) => [p.id, p]));
  return list
    .filter((t) => !params.status || t.status === params.status)
    .filter((t) => !visiblePlayerIds || (!!t.playerId && visiblePlayerIds.includes(t.playerId)))
    .map((t) => ({ ...t, player: t.playerId ? playerById.get(t.playerId) : undefined }));
}
