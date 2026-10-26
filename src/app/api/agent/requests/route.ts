import { getRequests } from "@/lib/data";
import { agentDenied, agentJson, checkAgentToken } from "@/lib/agent-auth";

export const dynamic = "force-dynamic";

// GET /api/agent/requests?status=OPEN|CLOSED|ALL (default OPEN)
// Read-only list of club requests (בקשות) for the scouting agent: what each
// club is looking for, so the agent can search profiles per request.
export async function GET(request: Request) {
  const auth = checkAgentToken(request);
  if (!auth.ok) return agentDenied(auth, "/api/agent/requests");

  const status = (new URL(request.url).searchParams.get("status") ?? "OPEN").toUpperCase();
  const list = await getRequests();

  const requests = list
    .filter((r) => status === "ALL" || r.status === status)
    .map((r) => ({
      id: r.id,
      status: r.status,
      club: r.club?.name ?? null,
      clubCountry: r.club?.country ?? null,
      positionSought: r.positionSought ?? null,
      transferBudget: r.transferBudget ?? null,
      salaryBudget: r.salaryBudget ?? null,
      notes: r.notes ?? null,
      dealPartner: r.dealPartner ?? null,
      handledBy: r.handledBy ? r.handledBy.name || r.handledBy.email : null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      proposedPlayers: r.proposedPlayers.map((x) => ({
        id: x.player!.id,
        name: x.player!.fullNameHebrew ?? `${x.player!.firstName} ${x.player!.lastName}`.trim(),
      })),
    }));

  console.info(`[agent-api] requests status=${status} -> ${requests.length}`);
  return agentJson({ count: requests.length, requests });
}
