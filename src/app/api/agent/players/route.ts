import { getPlayersList } from "@/lib/data";
import { calcAge } from "@/lib/format";
import { agentDenied, agentJson, checkAgentToken } from "@/lib/agent-auth";

export const dynamic = "force-dynamic";

// GET /api/agent/players?q=&status=&position=
// Read-only player search for the agent. Returns a short card per player.
export async function GET(request: Request) {
  const auth = checkAgentToken(request);
  if (!auth.ok) return agentDenied(auth, "/api/agent/players");

  const { searchParams } = new URL(request.url);
  const list = await getPlayersList({
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    position: searchParams.get("position") ?? undefined,
  });

  const players = list.map((p) => ({
    id: p.id,
    nameHebrew: p.fullNameHebrew ?? `${p.firstName} ${p.lastName}`.trim(),
    nameEnglish: p.fullNameEnglish ?? null,
    age: calcAge(p.dateOfBirth),
    dateOfBirth: p.dateOfBirth ?? null,
    mainPosition: p.mainPosition ?? null,
    club: p.club?.name ?? null,
    country: p.currentCountry ?? null,
    status: p.status ?? null,
    representationStatus: p.representationStatus ?? null,
    contractEnd: p.latestContract?.endDate ?? null,
    representationEnd: p.latestRepresentation?.endDate ?? null,
  }));

  console.info(`[agent-api] list q=${searchParams.get("q") ?? ""} -> ${players.length}`);
  return agentJson({ count: players.length, players });
}
