import Link from "next/link";
import { getDashboardData } from "@/lib/data";
import { formatDate, daysUntil } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import { AlertTriangle, Users, ListChecks, Briefcase, FileWarning, UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();

  const stats = [
    { label: "שחקנים פעילים", value: data.activePlayersCount, icon: UserCheck, href: "/crm/players?status=ACTIVE_CLIENT" },
    { label: 'סה"כ שחקנים', value: data.totalPlayers, icon: Users, href: "/crm/players" },
    { label: "משימות פתוחות", value: data.openTasksCount, icon: ListChecks, href: "/crm/tasks" },
    { label: "שחקנים קריטיים", value: data.criticalPlayersCount, icon: AlertTriangle, href: "/crm/players" },
    { label: 'עסקאות פתוחות', value: data.openDealsCount, icon: Briefcase, href: "/crm/players" },
    { label: "מידע חסר", value: data.missingInfoCount, icon: FileWarning, href: "/crm/players" },
  ];

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold">דשבורד</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          תמונת מצב מהירה על כל השחקנים בסוכנות
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href} className="card p-4 hover:border-[var(--gold)] transition-colors">
              <div className="flex items-center justify-between mb-2">
                <Icon size={18} style={{ color: "var(--gold)" }} />
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                {s.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-4">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-[var(--danger)]" />
            חוזים שמסתיימים בקרוב (90 יום)
          </h2>
          {data.expiringContracts.length === 0 ? (
            <EmptyRow text="אין חוזים שמסתיימים בקרוב" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>שחקן</th>
                  <th>מועדון</th>
                  <th>תאריך סיום</th>
                  <th>ימים שנותרו</th>
                  <th>פעולה</th>
                </tr>
              </thead>
              <tbody>
                {data.expiringContracts.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/crm/players/${c.playerId}`} className="font-medium hover:underline">
                        {c.player ? `${c.player.firstName} ${c.player.lastName}` : "—"}
                      </Link>
                    </td>
                    <td>{c.club?.name ?? "—"}</td>
                    <td>{formatDate(c.endDate)}</td>
                    <td>
                      <DaysBadge days={daysUntil(c.endDate)} />
                    </td>
                    <td className="text-xs" style={{ color: "var(--muted)" }}>
                      {c.player?.nextAction ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card p-4">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-[var(--danger)]" />
            ייצוג שמסתיים בקרוב (90 יום)
          </h2>
          {data.expiringRepresentation.length === 0 ? (
            <EmptyRow text="אין ייצוגים שמסתיימים בקרוב" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>שחקן</th>
                  <th>תאריך סיום</th>
                  <th>ימים שנותרו</th>
                  <th>סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {data.expiringRepresentation.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/crm/players/${r.playerId}`} className="font-medium hover:underline">
                        {r.player ? `${r.player.firstName} ${r.player.lastName}` : "—"}
                      </Link>
                    </td>
                    <td>{formatDate(r.endDate)}</td>
                    <td>
                      <DaysBadge days={daysUntil(r.endDate)} />
                    </td>
                    <td>
                      <StatusBadge kind="representation" value={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card p-4">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <ListChecks size={16} style={{ color: "var(--gold)" }} />
            משימות קריטיות
          </h2>
          {data.criticalTasks.length === 0 ? (
            <EmptyRow text="אין משימות קריטיות פתוחות" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>משימה</th>
                  <th>שחקן</th>
                  <th>תאריך יעד</th>
                  <th>אחראי</th>
                  <th>סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {data.criticalTasks.slice(0, 8).map((t) => (
                  <tr key={t.id}>
                    <td className="font-medium">{t.title}</td>
                    <td>
                      {t.player ? (
                        <Link href={`/crm/players/${t.playerId}`} className="hover:underline">
                          {t.player.firstName} {t.player.lastName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{formatDate(t.dueDate)}</td>
                    <td>{t.owner ?? "—"}</td>
                    <td>
                      <StatusBadge kind="taskStatus" value={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card p-4">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <FileWarning size={16} className="text-[var(--warn)]" />
            שחקנים עם מידע חסר
          </h2>
          {data.missingInfoPlayers.length === 0 ? (
            <EmptyRow text="לכל השחקנים יש מידע מלא 🎉" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>שחקן</th>
                  <th>חסר</th>
                </tr>
              </thead>
              <tbody>
                {data.missingInfoPlayers.slice(0, 10).map(({ player, missing }) => (
                  <tr key={player.id}>
                    <td>
                      <Link href={`/crm/players/${player.id}`} className="font-medium hover:underline">
                        {player.firstName} {player.lastName}
                      </Link>
                    </td>
                    <td className="flex flex-wrap gap-1 py-1.5">
                      {missing.map((m) => (
                        <span key={m} className="badge badge-warn">
                          {m}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function DaysBadge({ days }: { days: number | null }) {
  if (days === null) return <span>—</span>;
  const tone = days <= 30 ? "badge-danger" : days <= 60 ? "badge-warn" : "badge-neutral";
  return <span className={`badge ${tone}`}>{days} ימים</span>;
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="text-sm py-6 text-center" style={{ color: "var(--muted)" }}>
      {text}
    </div>
  );
}
