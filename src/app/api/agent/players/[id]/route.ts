import { getPlayerDetail } from "@/lib/data";
import { calcAge } from "@/lib/format";
import { buildHive } from "@/lib/proposal";
import { agentDenied, agentJson, checkAgentToken, publicOrigin } from "@/lib/agent-auth";

export const dynamic = "force-dynamic";

// Scouting fields shared with the agent. Family assessments stay out.
const SCOUTING_FIELDS = [
  "scoutedBy", "lastWatchedDate", "summary", "positionGroup",
  "speed", "pace", "stamina", "explosiveness", "supportPlay", "crossing", "strength", "durability",
  "concentration", "attitude", "motivation", "workRate", "leadership", "composure",
  "workRateOffBall", "tacklingPressDefense", "dribblingShootingCreating", "passingRangeUnderPressure",
  "firstTouchTightSpace", "spaceAwareness", "teamCommunication", "selfControlAfterFoul",
  "gameReadingAnticipation", "postureConfidence", "composureUnderPressure", "endGameEffort",
  "generalTechnicalAbility", "mentalResilience", "overallPotential",
] as const;

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value ?? null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

// GET /api/agent/players/:id
// Read-only player profile for the agent: the data a proposal or a deal
// discussion needs. Contact details, passport, address, family and medical
// fields are deliberately not included.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = checkAgentToken(request);
  if (!auth.ok) return agentDenied(auth, `/api/agent/players/${id}`);

  const detail = await getPlayerDetail(id);
  if (!detail) return agentJson({ error: "not_found" }, 404);

  const { player: p, scoutingReport: r } = detail;
  const origin = publicOrigin(request);

  const scouting = r
    ? {
        ...Object.fromEntries(SCOUTING_FIELDS.map((k) => [k, (r as Record<string, unknown>)[k] ?? null])),
        technicalRatings: parseJson(r.technicalRatings),
        scale: "0-5 stars",
      }
    : null;

  const body = {
    id: p.id,
    crmUrl: `${origin}/crm/players/${p.id}`,
    proposalUrl: `${origin}/crm/players/${p.id}/proposal`,
    name: {
      hebrew: p.fullNameHebrew ?? `${p.firstName} ${p.lastName}`.trim(),
      english: p.fullNameEnglish ?? null,
      first: p.firstName,
      last: p.lastName,
    },
    photoUrl: p.photoPath ? new URL(p.photoPath, origin).toString() : null,
    dateOfBirth: p.dateOfBirth ?? null,
    age: calcAge(p.dateOfBirth),
    nationality: p.nationality ?? null,
    secondNationality: p.secondNationality ?? null,
    height: p.height ?? null,
    weight: p.weight ?? null,
    mainPosition: p.mainPosition ?? null,
    secondaryPositions: p.secondaryPositions ?? null,
    strongFoot: p.strongFoot ?? null,
    club: detail.club?.name ?? null,
    league: p.currentLeague ?? null,
    country: p.currentCountry ?? null,
    status: p.status ?? null,
    representationStatus: p.representationStatus ?? null,
    agentInCharge: p.agentInCharge ?? null,
    priorityLevel: p.priorityLevel ?? null,
    internalRating: p.internalRating ?? null,
    potentialRating: p.potentialRating ?? null,
    internalValuation: p.internalValuation ?? null,
    targetLevel: p.targetLevel ?? null,
    relevantClubs: p.relevantClubs ?? null,
    shortDescription: p.shortDescription ?? null,
    strengths: p.strengths ?? null,
    weaknesses: p.weaknesses ?? null,
    playingStyle: p.playingStyle ?? null,
    idealRole: p.idealRole ?? null,
    aiSummary: p.aiSummary ?? null,
    nextAction: p.nextAction ?? null,
    nextActionDate: p.nextActionDate ?? null,
    contracts: detail.contracts.map((c) => ({
      club: c.club?.name ?? null,
      status: c.status,
      startDate: c.startDate,
      endDate: c.endDate,
      monthlySalary: c.monthlySalary ?? null,
      releaseClause: c.releaseClause ?? null,
      sellOnPercent: c.sellOnPercent ?? null,
      trainingCompensationNotes: c.trainingCompensationNotes ?? null,
    })),
    representation: detail.representation.map((a) => ({
      status: a.status,
      startDate: a.startDate,
      endDate: a.endDate,
      exclusive: a.exclusive ?? null,
      commissionPercent: a.commissionPercent ?? null,
      isMinor: a.isMinor ?? null,
      parentsSigned: a.parentsSigned ?? null,
    })),
    links: detail.links.map((l) => ({ type: l.type, title: l.title, url: l.url })),
    videos: detail.videos.map((v) => ({ type: v.type, title: v.title, url: v.url, readyToSend: v.readyToSend ?? null })),
    scouting,
    // Same 1-10 attribute hive the proposal page draws.
    hive: buildHive(r, p.mainPosition).map((a) => ({ key: a.key, label: a.label, value: a.value })),
  };

  console.info(`[agent-api] player ${p.id}`);
  return agentJson(body);
}
