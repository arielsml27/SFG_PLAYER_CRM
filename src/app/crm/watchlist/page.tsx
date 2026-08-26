import Link from "next/link";
import { getWatchlistPlayers } from "@/lib/data";
import { getCurrentCrmUser } from "@/lib/current-user";
import { getVisiblePlayerIds } from "@/lib/permissions";
import { updatePlayerWatchlist } from "@/lib/actions";
import { PLAYER_STATUSES, PLAYER_STATUS_LABELS } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import AutoSubmitSelect from "@/components/AutoSubmitSelect";
import AutoSubmitCheckbox from "@/components/AutoSubmitCheckbox";
import AutoSubmitTextInput from "@/components/AutoSubmitTextInput";
import { ExternalLink } from "lucide-react";

export default async function WatchlistPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = sp.status ?? "MONITORING";
  const currentUser = await getCurrentCrmUser();
  const visiblePlayerIds = currentUser ? await getVisiblePlayerIds(currentUser) : [];
  const players = await getWatchlistPlayers(status === "ALL" ? undefined : status, visiblePlayerIds);

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">שחקנים למעקב</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {players.length} שחקנים
          </p>
        </div>
        <form method="get" className="flex items-center gap-2">
          <label className="field-label m-0">סטטוס</label>
          <AutoSubmitSelect
            name="status"
            defaultValue={status}
            options={[{ value: "ALL", label: "הכל" }, ...PLAYER_STATUSES.map((s) => ({ value: s, label: PLAYER_STATUS_LABELS[s] }))]}
          />
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>שם</th>
              <th>מועדון</th>
              <th>עמדה</th>
              <th>סטטוס ייצוג</th>
              <th>טלפון אבא</th>
              <th>אינסטגרם</th>
              <th>מצב חוזה במועדון</th>
              <th>פגישה נקבעה</th>
              <th>מטפל</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">
                  <Link href={`/crm/players/${p.id}`} className="hover:underline" style={{ color: "var(--navy)" }}>
                    {p.firstName} {p.lastName}
                  </Link>
                </td>
                <td>{p.club?.name ?? "—"}</td>
                <td>{p.mainPosition}</td>
                <td>
                  <StatusBadge kind="representation" value={p.representationStatus} />
                </td>
                <td>{p.fatherPhone ?? "—"}</td>
                <td>
                  {p.instagramUrl ? (
                    <a
                      href={p.instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                      style={{ color: "var(--navy)" }}
                    >
                      פרופיל <ExternalLink size={12} />
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{p.latestContract ? <StatusBadge kind="contract" value={p.latestContract.status} /> : "—"}</td>
                <td>
                  <form action={updatePlayerWatchlist.bind(null, p.id)}>
                    <input type="hidden" name="agentInCharge" value={p.agentInCharge ?? ""} />
                    <AutoSubmitCheckbox name="meetingScheduled" defaultChecked={!!p.meetingScheduled} />
                  </form>
                </td>
                <td>
                  <form action={updatePlayerWatchlist.bind(null, p.id)}>
                    <input type="hidden" name="meetingScheduled" value={p.meetingScheduled ? "on" : ""} />
                    <AutoSubmitTextInput name="agentInCharge" defaultValue={p.agentInCharge ?? ""} placeholder="מי מטפל" />
                  </form>
                </td>
              </tr>
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-8" style={{ color: "var(--muted)" }}>
                  אין שחקנים בסטטוס הזה
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
