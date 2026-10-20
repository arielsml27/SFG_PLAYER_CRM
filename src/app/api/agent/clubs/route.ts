import { getClubMap } from "@/lib/data";
import { RELATIONSHIP_LEVEL_LABELS } from "@/lib/constants";
import { agentDenied, agentJson, checkAgentToken, publicOrigin } from "@/lib/agent-auth";

export const dynamic = "force-dynamic";

// GET /api/agent/clubs
// Read-only club relationship map for the agent: one row per club, sorted
// strongest relationship first (level 2 > 1 > 4 > 3, then unrated).
export async function GET(request: Request) {
  const auth = checkAgentToken(request);
  if (!auth.ok) return agentDenied(auth, "/api/agent/clubs");

  const origin = publicOrigin(request);
  const rows = await getClubMap();
  const clubs = rows.map((c) => ({
    id: c.id,
    name: c.name,
    country: c.country,
    league: c.league,
    contactsCount: c.contactsCount,
    strongestRelationshipLevel: c.strongestRelationshipLevel,
    strongestRelationshipLabel:
      c.strongestRelationshipLevel !== null ? RELATIONSHIP_LEVEL_LABELS[c.strongestRelationshipLevel] ?? null : null,
    primaryContactName: c.primaryContactName,
    proposalsCount: c.proposalsCount,
    openRequestsCount: c.openRequestsCount,
    crmUrl: `${origin}/crm/clubs/${c.id}`,
  }));

  console.info(`[agent-api] clubs -> ${clubs.length}`);
  return agentJson({ count: clubs.length, clubs });
}
