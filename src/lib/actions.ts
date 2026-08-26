"use server";

import { db } from "@/db";
import {
  players,
  clubs,
  clubContracts,
  representationAgreements,
  playerLinks,
  videos,
  documents,
  contacts,
  timelineEvents,
  tasks,
  deals,
  scoutingReports,
  questionnaireResponses,
} from "@/db/schema";
import {
  PHYSICAL_SKILLS,
  MENTAL_SKILLS,
  FAMILY_SKILLS,
  ON_FIELD_BEHAVIOR_SKILLS,
  BODY_LANGUAGE_SKILLS,
  OVERALL_RATING_SKILLS,
  POSITION_GROUPS,
  TECHNICAL_SKILLS_BY_POSITION,
} from "@/lib/constants";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { generatePlayerAiSummaryText } from "@/lib/ai-summary";

const PLAYER_PHOTO_DIR = path.join(process.cwd(), "public", "uploads", "players");

async function savePlayerPhoto(file: File): Promise<string> {
  await mkdir(PLAYER_PHOTO_DIR, { recursive: true });
  const ext = path.extname(file.name) || ".jpg";
  const filename = `${crypto.randomUUID()}${ext}`;
  await writeFile(path.join(PLAYER_PHOTO_DIR, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/players/${filename}`;
}

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
function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === "on" || fd.get(key) === "true";
}

// ---------- Player ----------

export async function createPlayer(formData: FormData) {
  let clubId: string | null = str(formData, "currentClubId");
  const newClubName = str(formData, "newClubName");
  if (newClubName) {
    const [created] = await db.insert(clubs).values({ name: newClubName }).returning();
    clubId = created.id;
  }

  const photoFile = formData.get("photo");
  const photoPath = photoFile instanceof File && photoFile.size > 0 ? await savePlayerPhoto(photoFile) : null;

  const [player] = await db
    .insert(players)
    .values({
      firstName: str(formData, "firstName") ?? "",
      lastName: str(formData, "lastName") ?? "",
      fullNameHebrew: str(formData, "fullNameHebrew"),
      fullNameEnglish: str(formData, "fullNameEnglish"),
      photoPath,
      dateOfBirth: str(formData, "dateOfBirth") ?? "",
      nationality: str(formData, "nationality"),
      secondNationality: str(formData, "secondNationality"),
      passportNumber: str(formData, "passportNumber"),
      height: num(formData, "height"),
      weight: num(formData, "weight"),
      mainPosition: str(formData, "mainPosition") ?? "",
      secondaryPositions: str(formData, "secondaryPositions"),
      strongFoot: str(formData, "strongFoot"),
      currentClubId: clubId,
      currentLeague: str(formData, "currentLeague"),
      currentCountry: str(formData, "currentCountry"),
      startingPlace: str(formData, "startingPlace"),
      startingAge: num(formData, "startingAge"),
      previousClubs: str(formData, "previousClubs"),
      trainingFrequency: str(formData, "trainingFrequency"),
      playerComparison: str(formData, "playerComparison"),
      nutritionDiscipline: str(formData, "nutritionDiscipline"),
      extraTraining: str(formData, "extraTraining"),
      externalProfessionals: str(formData, "externalProfessionals"),
      familyFootballBackground: str(formData, "familyFootballBackground"),
      educationStatus: str(formData, "educationStatus"),
      languagesSpoken: str(formData, "languagesSpoken"),
      injuryHistory: str(formData, "injuryHistory"),
      willingToRelocate: str(formData, "willingToRelocate"),
      status: str(formData, "status") ?? "PROSPECT",
      internalRating: num(formData, "internalRating"),
      potentialRating: num(formData, "potentialRating"),
      priorityLevel: num(formData, "priorityLevel") ?? 0,
      representationStatus: str(formData, "representationStatus") ?? "UNKNOWN",
      agentInCharge: str(formData, "agentInCharge"),
      familyContactName: str(formData, "familyContactName"),
      familyContactPhone: str(formData, "familyContactPhone"),
      familyContactEmail: str(formData, "familyContactEmail"),
      address: str(formData, "address"),
      notes: str(formData, "notes"),
      tags: str(formData, "tags"),
      nextAction: str(formData, "nextAction"),
      nextActionDate: str(formData, "nextActionDate"),
    })
    .returning();

  revalidatePath("/crm/players");
  revalidatePath("/crm");
  redirect(`/crm/players/${player.id}`);
}

export async function updatePlayer(playerId: string, formData: FormData) {
  let clubId: string | null = str(formData, "currentClubId");
  const newClubName = str(formData, "newClubName");
  if (newClubName) {
    const [created] = await db.insert(clubs).values({ name: newClubName }).returning();
    clubId = created.id;
  }

  const photoFile = formData.get("photo");
  const removePhoto = bool(formData, "removePhoto");
  let photoPath: string | null | undefined = undefined;
  if (photoFile instanceof File && photoFile.size > 0) {
    photoPath = await savePlayerPhoto(photoFile);
  } else if (removePhoto) {
    photoPath = null;
  }

  await db
    .update(players)
    .set({
      firstName: str(formData, "firstName") ?? "",
      lastName: str(formData, "lastName") ?? "",
      fullNameHebrew: str(formData, "fullNameHebrew"),
      fullNameEnglish: str(formData, "fullNameEnglish"),
      email: str(formData, "email"),
      phone: str(formData, "phone"),
      ...(photoPath !== undefined ? { photoPath } : {}),
      dateOfBirth: str(formData, "dateOfBirth") ?? "",
      nationality: str(formData, "nationality"),
      secondNationality: str(formData, "secondNationality"),
      passportNumber: str(formData, "passportNumber"),
      height: num(formData, "height"),
      weight: num(formData, "weight"),
      mainPosition: str(formData, "mainPosition") ?? "",
      secondaryPositions: str(formData, "secondaryPositions"),
      strongFoot: str(formData, "strongFoot"),
      currentClubId: clubId,
      currentLeague: str(formData, "currentLeague"),
      currentCountry: str(formData, "currentCountry"),
      startingPlace: str(formData, "startingPlace"),
      startingAge: num(formData, "startingAge"),
      previousClubs: str(formData, "previousClubs"),
      trainingFrequency: str(formData, "trainingFrequency"),
      playerComparison: str(formData, "playerComparison"),
      nutritionDiscipline: str(formData, "nutritionDiscipline"),
      extraTraining: str(formData, "extraTraining"),
      externalProfessionals: str(formData, "externalProfessionals"),
      familyFootballBackground: str(formData, "familyFootballBackground"),
      educationStatus: str(formData, "educationStatus"),
      languagesSpoken: str(formData, "languagesSpoken"),
      injuryHistory: str(formData, "injuryHistory"),
      willingToRelocate: str(formData, "willingToRelocate"),
      status: str(formData, "status") ?? "PROSPECT",
      internalRating: num(formData, "internalRating"),
      potentialRating: num(formData, "potentialRating"),
      priorityLevel: num(formData, "priorityLevel") ?? 0,
      shortDescription: str(formData, "shortDescription"),
      strengths: str(formData, "strengths"),
      weaknesses: str(formData, "weaknesses"),
      playingStyle: str(formData, "playingStyle"),
      idealRole: str(formData, "idealRole"),
      targetLevel: str(formData, "targetLevel"),
      relevantClubs: str(formData, "relevantClubs"),
      internalValuation: str(formData, "internalValuation"),
      representationStatus: str(formData, "representationStatus") ?? "UNKNOWN",
      agentInCharge: str(formData, "agentInCharge"),
      familyContactName: str(formData, "familyContactName"),
      familyContactPhone: str(formData, "familyContactPhone"),
      familyContactEmail: str(formData, "familyContactEmail"),
      address: str(formData, "address"),
      notes: str(formData, "notes"),
      tags: str(formData, "tags"),
      nextAction: str(formData, "nextAction"),
      nextActionDate: str(formData, "nextActionDate"),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(players.id, playerId));

  revalidatePath(`/crm/players/${playerId}`);
  revalidatePath("/crm/players");
  revalidatePath("/crm");
  redirect(`/crm/players/${playerId}`);
}

export async function deletePlayer(playerId: string) {
  await db.delete(players).where(eq(players.id, playerId));
  revalidatePath("/crm/players");
  revalidatePath("/crm");
  redirect("/crm/players");
}

// ---------- Club contract ----------

export async function addClubContract(playerId: string, formData: FormData) {
  await db.insert(clubContracts).values({
    playerId,
    clubId: str(formData, "clubId"),
    startDate: str(formData, "startDate") ?? "",
    endDate: str(formData, "endDate") ?? "",
    monthlySalary: num(formData, "monthlySalary"),
    signingBonus: num(formData, "signingBonus"),
    releaseClause: num(formData, "releaseClause"),
    sellOnPercent: num(formData, "sellOnPercent"),
    trainingCompensationNotes: str(formData, "trainingCompensationNotes"),
    bonuses: str(formData, "bonuses"),
    status: str(formData, "status") ?? "ACTIVE",
    notes: str(formData, "notes"),
  });
  revalidatePath(`/crm/players/${playerId}`);
  revalidatePath("/crm");
}

export async function deleteClubContract(playerId: string, contractId: string) {
  await db.delete(clubContracts).where(eq(clubContracts.id, contractId));
  revalidatePath(`/crm/players/${playerId}`);
  revalidatePath("/crm");
}

// ---------- Representation ----------

export async function addRepresentation(playerId: string, formData: FormData) {
  await db.insert(representationAgreements).values({
    playerId,
    startDate: str(formData, "startDate") ?? "",
    endDate: str(formData, "endDate") ?? "",
    commissionPercent: num(formData, "commissionPercent"),
    exclusive: bool(formData, "exclusive"),
    isMinor: bool(formData, "isMinor"),
    parentsSigned: str(formData, "parentsSigned") ?? "NA",
    signedBy: str(formData, "signedBy"),
    status: str(formData, "status") ?? "ACTIVE",
    notes: str(formData, "notes"),
  });
  revalidatePath(`/crm/players/${playerId}`);
  revalidatePath("/crm");
}

export async function deleteRepresentation(playerId: string, repId: string) {
  await db.delete(representationAgreements).where(eq(representationAgreements.id, repId));
  revalidatePath(`/crm/players/${playerId}`);
  revalidatePath("/crm");
}

// ---------- Links ----------

export async function addLink(playerId: string, formData: FormData) {
  await db.insert(playerLinks).values({
    playerId,
    type: str(formData, "type") ?? "OTHER",
    title: str(formData, "title") ?? "",
    url: str(formData, "url") ?? "",
    notes: str(formData, "notes"),
  });
  revalidatePath(`/crm/players/${playerId}`);
  revalidatePath("/crm");
}

export async function deleteLink(playerId: string, linkId: string) {
  await db.delete(playerLinks).where(eq(playerLinks.id, linkId));
  revalidatePath(`/crm/players/${playerId}`);
}

// ---------- Videos ----------

export async function addVideo(playerId: string, formData: FormData) {
  await db.insert(videos).values({
    playerId,
    title: str(formData, "title") ?? "",
    type: str(formData, "type") ?? "HIGHLIGHTS",
    url: str(formData, "url") ?? "",
    date: str(formData, "date"),
    readyToSend: bool(formData, "readyToSend"),
    notes: str(formData, "notes"),
  });
  revalidatePath(`/crm/players/${playerId}`);
  revalidatePath("/crm");
}

export async function deleteVideo(playerId: string, videoId: string) {
  await db.delete(videos).where(eq(videos.id, videoId));
  revalidatePath(`/crm/players/${playerId}`);
}

// ---------- Documents ----------

export async function addDocument(playerId: string, formData: FormData) {
  await db.insert(documents).values({
    playerId,
    title: str(formData, "title") ?? "",
    type: str(formData, "type") ?? "OTHER",
    filePath: str(formData, "filePath"),
    expiryDate: str(formData, "expiryDate"),
    notes: str(formData, "notes"),
  });
  revalidatePath(`/crm/players/${playerId}`);
  revalidatePath("/crm");
}

export async function deleteDocument(playerId: string, documentId: string) {
  await db.delete(documents).where(eq(documents.id, documentId));
  revalidatePath(`/crm/players/${playerId}`);
}

// ---------- Contacts ----------

export async function addContact(playerId: string, formData: FormData) {
  await db.insert(contacts).values({
    playerId,
    name: str(formData, "name") ?? "",
    role: str(formData, "role") ?? "OTHER",
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    whatsapp: str(formData, "whatsapp"),
    relation: str(formData, "relation"),
    notes: str(formData, "notes"),
  });
  revalidatePath(`/crm/players/${playerId}`);
  revalidatePath("/crm");
}

export async function deleteContact(playerId: string, contactId: string) {
  await db.delete(contacts).where(eq(contacts.id, contactId));
  revalidatePath(`/crm/players/${playerId}`);
}

// ---------- Timeline ----------

export async function addTimelineEvent(playerId: string, formData: FormData) {
  await db.insert(timelineEvents).values({
    playerId,
    type: str(formData, "type") ?? "INTERNAL_NOTE",
    title: str(formData, "title") ?? "",
    description: str(formData, "description"),
    eventDate: str(formData, "eventDate") ?? new Date().toISOString().slice(0, 10),
    createdBy: str(formData, "createdBy"),
    link: str(formData, "link"),
  });
  revalidatePath(`/crm/players/${playerId}`);
}

export async function deleteTimelineEvent(playerId: string, eventId: string) {
  await db.delete(timelineEvents).where(eq(timelineEvents.id, eventId));
  revalidatePath(`/crm/players/${playerId}`);
}

// ---------- Tasks ----------

export async function addTask(formData: FormData) {
  const playerId = str(formData, "playerId");
  await db.insert(tasks).values({
    playerId,
    title: str(formData, "title") ?? "",
    description: str(formData, "description"),
    owner: str(formData, "owner"),
    dueDate: str(formData, "dueDate"),
    priority: str(formData, "priority") ?? "NORMAL",
    status: str(formData, "status") ?? "OPEN",
    reminderDate: str(formData, "reminderDate"),
  });
  if (playerId) revalidatePath(`/crm/players/${playerId}`);
  revalidatePath("/crm/tasks");
  revalidatePath("/crm");
}

export async function updateTaskStatus(taskId: string, status: string, playerId?: string | null) {
  await db.update(tasks).set({ status, updatedAt: new Date().toISOString() }).where(eq(tasks.id, taskId));
  if (playerId) revalidatePath(`/crm/players/${playerId}`);
  revalidatePath("/crm/tasks");
  revalidatePath("/crm");
}

export async function deleteTask(taskId: string, playerId?: string | null) {
  await db.delete(tasks).where(eq(tasks.id, taskId));
  if (playerId) revalidatePath(`/crm/players/${playerId}`);
  revalidatePath("/crm/tasks");
  revalidatePath("/crm");
}

// ---------- Deals ----------

export async function addDeal(playerId: string, formData: FormData) {
  await db.insert(deals).values({
    playerId,
    clubId: str(formData, "clubId"),
    type: str(formData, "type") ?? "OTHER",
    status: str(formData, "status") ?? "OPEN",
    expectedValue: num(formData, "expectedValue"),
    commissionPotential: num(formData, "commissionPotential"),
    startDate: str(formData, "startDate"),
    expectedCloseDate: str(formData, "expectedCloseDate"),
    notes: str(formData, "notes"),
  });
  revalidatePath(`/crm/players/${playerId}`);
  revalidatePath("/crm");
}

export async function deleteDeal(playerId: string, dealId: string) {
  await db.delete(deals).where(eq(deals.id, dealId));
  revalidatePath(`/crm/players/${playerId}`);
  revalidatePath("/crm");
}

// ---------- Scouting report ----------

const FIXED_RATING_SKILLS = [
  ...PHYSICAL_SKILLS,
  ...MENTAL_SKILLS,
  ...FAMILY_SKILLS,
  ...ON_FIELD_BEHAVIOR_SKILLS,
  ...BODY_LANGUAGE_SKILLS,
  ...OVERALL_RATING_SKILLS,
].map(([key]) => key);

export async function upsertScoutingReport(playerId: string, formData: FormData) {
  const ratingValues = Object.fromEntries(FIXED_RATING_SKILLS.map((key) => [key, num(formData, key)]));

  const positionGroup = POSITION_GROUPS.includes(str(formData, "positionGroup") as any)
    ? (str(formData, "positionGroup") as string)
    : null;
  const technicalKeys = positionGroup ? TECHNICAL_SKILLS_BY_POSITION[positionGroup].map(([key]) => key) : [];
  const technicalEntries = technicalKeys
    .map((key) => [key, num(formData, key)] as const)
    .filter(([, v]) => v !== null);
  const technicalRatings = technicalEntries.length ? JSON.stringify(Object.fromEntries(technicalEntries)) : null;

  const values = {
    playerId,
    scoutedBy: str(formData, "scoutedBy"),
    lastWatchedDate: str(formData, "lastWatchedDate"),
    summary: str(formData, "summary"),
    positionGroup,
    technicalRatings,
    ...ratingValues,
    updatedAt: new Date().toISOString(),
  };

  const existing = await db.select({ id: scoutingReports.id }).from(scoutingReports).where(eq(scoutingReports.playerId, playerId));

  if (existing.length) {
    await db.update(scoutingReports).set(values).where(eq(scoutingReports.playerId, playerId));
  } else {
    await db.insert(scoutingReports).values(values);
  }

  revalidatePath(`/crm/players/${playerId}`);
  redirect(`/crm/players/${playerId}?tab=scouting&saved=1`);
}

// ---------- AI player summary ----------

export async function generatePlayerAiSummary(playerId: string) {
  const player = (await db.select().from(players).where(eq(players.id, playerId)))[0];
  if (!player) return;

  const club = player.currentClubId
    ? (await db.select().from(clubs).where(eq(clubs.id, player.currentClubId)))[0]
    : undefined;

  try {
    const summary = await generatePlayerAiSummaryText(player, club?.name ?? null);
    await db
      .update(players)
      .set({ aiSummary: summary, aiSummaryGeneratedAt: new Date().toISOString() })
      .where(eq(players.id, playerId));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate summary.";
    revalidatePath(`/crm/players/${playerId}/export`);
    redirect(`/crm/players/${playerId}/export?summaryError=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/crm/players/${playerId}/export`);
}

// ---------- Clubs ----------

export async function createClub(formData: FormData) {
  await db.insert(clubs).values({
    name: str(formData, "name") ?? "",
    country: str(formData, "country"),
    league: str(formData, "league"),
    city: str(formData, "city"),
    website: str(formData, "website"),
    notes: str(formData, "notes"),
  });
  revalidatePath("/crm/clubs");
}

// ---------- Public player self-registration ----------

const PLAYER_VIDEO_DIR = path.join(process.cwd(), "public", "uploads", "players", "videos");

async function savePlayerVideo(file: File): Promise<string> {
  await mkdir(PLAYER_VIDEO_DIR, { recursive: true });
  const ext = path.extname(file.name) || ".mp4";
  const filename = `${crypto.randomUUID()}${ext}`;
  await writeFile(path.join(PLAYER_VIDEO_DIR, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/players/videos/${filename}`;
}

export async function registerPlayerPublic(formData: FormData): Promise<{ playerId: string }> {
  const noClub = bool(formData, "noClub");
  const clubName = str(formData, "clubName");
  let clubId: string | null = null;
  if (!noClub && clubName) {
    const existing = await db.select({ id: clubs.id }).from(clubs).where(eq(clubs.name, clubName));
    clubId = existing.length ? existing[0].id : (await db.insert(clubs).values({ name: clubName }).returning())[0].id;
  }

  const photoFile = formData.get("photo");
  const photoPath = photoFile instanceof File && photoFile.size > 0 ? await savePlayerPhoto(photoFile) : null;

  const [player] = await db
    .insert(players)
    .values({
      firstName: str(formData, "firstName") ?? "",
      lastName: str(formData, "lastName") ?? "",
      email: str(formData, "email"),
      phone: str(formData, "phone"),
      photoPath,
      dateOfBirth: str(formData, "dateOfBirth") ?? "",
      nationality: str(formData, "nationality"),
      secondNationality: str(formData, "secondNationality"),
      height: num(formData, "height"),
      weight: num(formData, "weight"),
      mainPosition: str(formData, "mainPosition") ?? "",
      secondaryPositions: str(formData, "secondaryPositions"),
      strongFoot: str(formData, "strongFoot"),
      currentClubId: clubId,
      currentLeague: str(formData, "currentLeague"),
      currentCountry: str(formData, "currentCountry"),
      startingPlace: str(formData, "startingPlace"),
      startingAge: num(formData, "startingAge"),
      previousClubs: str(formData, "previousClubs"),
      trainingFrequency: str(formData, "trainingFrequency"),
      playerComparison: str(formData, "playerComparison"),
      nutritionDiscipline: str(formData, "nutritionDiscipline"),
      extraTraining: str(formData, "extraTraining"),
      externalProfessionals: str(formData, "externalProfessionals"),
      familyFootballBackground: str(formData, "familyFootballBackground"),
      educationStatus: str(formData, "educationStatus"),
      languagesSpoken: str(formData, "languagesSpoken"),
      injuryHistory: str(formData, "injuryHistory"),
      willingToRelocate: str(formData, "willingToRelocate"),
      status: "PROSPECT",
      representationStatus: "UNKNOWN",
      priorityLevel: 0,
      shortDescription: str(formData, "shortDescription"),
      strengths: str(formData, "strengths"),
      weaknesses: str(formData, "weaknesses"),
      playingStyle: str(formData, "playingStyle"),
      idealRole: str(formData, "idealRole"),
      targetLevel: str(formData, "targetLevel"),
      familyContactName: str(formData, "familyContactName"),
      familyContactPhone: str(formData, "familyContactPhone"),
      familyContactEmail: str(formData, "familyContactEmail"),
      address: str(formData, "address"),
      tags: str(formData, "goals"),
      notes: "נרשם באופן עצמאי דרך אתר ההרשמה הציבורי (SFG OS)",
    })
    .returning();

  const statsLink = str(formData, "statsLink");
  if (statsLink) {
    await db.insert(playerLinks).values({ playerId: player.id, type: "OTHER", title: "קישור סטטיסטיקה", url: statsLink });
  }

  const socialLink = str(formData, "socialLink");
  if (socialLink) {
    await db.insert(playerLinks).values({ playerId: player.id, type: "OTHER", title: "רשת חברתית", url: socialLink });
  }

  const videoFile = formData.get("video");
  if (videoFile instanceof File && videoFile.size > 0) {
    const videoPath = await savePlayerVideo(videoFile);
    await db.insert(videos).values({ playerId: player.id, title: "סרטון היילייטס", type: "HIGHLIGHTS", url: videoPath, readyToSend: false });
  }

  revalidatePath("/crm/players");
  revalidatePath("/crm");

  return { playerId: player.id };
}

export async function requestPremiumUpgrade(playerId: string, playerName: string) {
  await db
    .update(players)
    .set({ subscriptionTier: "PREMIUM_REQUESTED", premiumRequestedAt: new Date().toISOString() })
    .where(eq(players.id, playerId));

  await db.insert(tasks).values({
    playerId,
    title: `${playerName} ביקש/ה שדרוג לפרימיום (₪1,800 לשנה, ₪150 לחודש)`,
    description:
      "השחקן/ית ביקש/ה לשדרג לפרימיום דרך האתר הציבורי. מה שצריך לספק: פגישת ייעוץ אישית חד-פעמית של שעה " +
      "(זום או פרונטלית) עם מנהל מקצועי מטעמנו, דוח סקאוטינג מפורט עם יעדים ל-3 החודשים הקרובים ולעונה הקרובה, " +
      "דף מלא בפלטפורמה שלנו עם אפשרות מעקב והעלאת תכנים, והמלצות ממוקדות לאנשי מקצוע רלוונטיים לפי הנקודות שהפרופיל צריך לחזק.",
    priority: "HIGH",
    status: "OPEN",
  });

  await db.insert(timelineEvents).values({
    playerId,
    type: "SUBSCRIPTION",
    title: "ביקש/ה שדרוג לפרימיום",
    description: "₪1,800 לשנה (₪150 לחודש). התבקש דרך תהליך ההרשמה הציבורי.",
    eventDate: new Date().toISOString().slice(0, 10),
  });

  revalidatePath(`/crm/players/${playerId}`);
  revalidatePath("/crm/tasks");
  revalidatePath("/crm");
}

export async function requestGoldUpgrade(playerId: string, playerName: string) {
  await db
    .update(players)
    .set({ subscriptionTier: "GOLD_REQUESTED", goldRequestedAt: new Date().toISOString() })
    .where(eq(players.id, playerId));

  await db.insert(tasks).values({
    playerId,
    title: `${playerName} ביקש/ה חבילת GOLD (₪6,600 לשנה, ₪550 לחודש)`,
    description:
      "השחקן/ית ביקש/ה את חבילת GOLD דרך האתר הציבורי. מה שצריך לספק: 3 פגישות פרונטליות או בזום של שעה, " +
      "דוח סקאוטינג מפורט עם חוזקות, חולשות ודברים שהשחקן צריך לשפר לשלושת החודשים הקרובים, ניתוח אנליסטי אישי 1:1 " +
      "של 5 משחקים, ניתוח מלא של הקבוצה הבאה על בסיס המצב הקיים מול מה שצפוי לשחקן, הכוונה במשא ומתן וייעוץ בבחירת " +
      "ייצוג רלוונטי, גישה למאגר אנשי מקצוע, בחירת סוכן נכון עבור המטרות, הכוונה לכל שירות שהשחקן צריך ממוקד למטרותיו, " +
      "ודף מלא בפלטפורמה שלנו עם הכוונות ופיצ'רים נוספים כמו בניית מותג ברשתות חברתיות והתנהלות פיננסית.",
    priority: "HIGH",
    status: "OPEN",
  });

  await db.insert(timelineEvents).values({
    playerId,
    type: "SUBSCRIPTION",
    title: "ביקש/ה חבילת GOLD",
    description: "₪6,600 לשנה (₪550 לחודש). התבקש דרך תהליך ההרשמה הציבורי.",
    eventDate: new Date().toISOString().slice(0, 10),
  });

  revalidatePath(`/crm/players/${playerId}`);
  revalidatePath("/crm/tasks");
  revalidatePath("/crm");
}

export async function saveQuestionnaireResponses(
  playerId: string,
  responses: { sectionId: string; questionId: string; value: string }[]
) {
  const rows = responses
    .filter((r) => r.value != null && r.value.trim() !== "")
    .map((r) => ({ playerId, sectionId: r.sectionId, questionId: r.questionId, value: r.value }));

  if (rows.length === 0) return;

  await db
    .insert(questionnaireResponses)
    .values(rows)
    .onConflictDoUpdate({
      target: [questionnaireResponses.playerId, questionnaireResponses.questionId],
      set: { value: sql`excluded.value`, updatedAt: sql`(current_timestamp)` },
    });

  await db.insert(timelineEvents).values({
    playerId,
    type: "QUESTIONNAIRE",
    title: "מילא/ה תשובות בשאלון המורחב",
    description: `${rows.length} תשובות נשלחו דרך השאלון המורחב.`,
    eventDate: new Date().toISOString().slice(0, 10),
  });

  revalidatePath(`/crm/players/${playerId}`);
}

export async function requestProfessionalReferral(playerId: string, playerName: string) {
  await db.insert(tasks).values({
    playerId,
    title: `${playerName} ביקש/ה חיבור לאיש מקצוע`,
    description: "השחקן/ית ביקש/ה מהפרופיל הציבורי חיבור לאיש מקצוע רלוונטי ממאגר SFG (סוכן, תזונאי, מאמן מנטלי וכו').",
    priority: "NORMAL",
    status: "OPEN",
  });

  await db.insert(timelineEvents).values({
    playerId,
    type: "INTERNAL_NOTE",
    title: "ביקש/ה חיבור לאיש מקצוע",
    description: "התבקש דרך הפרופיל הציבורי.",
    eventDate: new Date().toISOString().slice(0, 10),
  });

  revalidatePath(`/crm/players/${playerId}`);
  revalidatePath("/crm/tasks");
}
