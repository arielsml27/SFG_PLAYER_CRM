import Link from "next/link";
import { getPlayersList } from "@/lib/data";
import { getCurrentCrmUser } from "@/lib/current-user";
import { getVisiblePlayerIds } from "@/lib/permissions";
import { PLAYER_STATUS_LABELS, PLAYER_STATUSES } from "@/lib/constants";
import { formatDate, daysUntil, calcAge } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import { Search, Download, Plus } from "lucide-react";

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; position?: string }>;
}) {
  const sp = await searchParams;
  const currentUser = await getCurrentCrmUser();
  const visiblePlayerIds = currentUser ? await getVisiblePlayerIds(currentUser) : [];
  const players = await getPlayersList({ q: sp.q, status: sp.status, position: sp.position }, visiblePlayerIds);

  const positions = Array.from(new Set(players.map((p) => p.mainPosition))).sort();

  const qs = new URLSearchParams();
  if (sp.q) qs.set("q", sp.q);
  if (sp.status) qs.set("status", sp.status);
  if (sp.position) qs.set("position", sp.position);

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">שחקנים</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {players.length} שחקנים
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/export/players?${qs.toString()}`} className="btn btn-outline">
            <Download size={15} />
            ייצוא CSV
          </a>
          <Link href="/crm/players/new" className="btn btn-gold">
            <Plus size={15} />
            שחקן חדש
          </Link>
        </div>
      </div>

      <form className="card p-4 flex flex-wrap gap-3 items-end" method="get">
        <div className="flex-1 min-w-[220px]">
          <label className="field-label">חיפוש</label>
          <div className="relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
            <input
              type="text"
              name="q"
              defaultValue={sp.q}
              placeholder="שם, מועדון, מדינה..."
              className="input pr-9"
            />
          </div>
        </div>
        <div className="min-w-[180px]">
          <label className="field-label">סטטוס</label>
          <select name="status" defaultValue={sp.status ?? ""} className="input">
            <option value="">הכל</option>
            {PLAYER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PLAYER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="field-label">עמדה</label>
          <select name="position" defaultValue={sp.position ?? ""} className="input">
            <option value="">הכל</option>
            {positions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          סנן
        </button>
        {(sp.q || sp.status || sp.position) && (
          <Link href="/crm/players" className="btn btn-outline">
            נקה
          </Link>
        )}
      </form>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>שם</th>
              <th>שנתון / גיל</th>
              <th>עמדה</th>
              <th>רגל</th>
              <th>מועדון</th>
              <th>מדינה</th>
              <th>סטטוס שחקן</th>
              <th>סטטוס ייצוג</th>
              <th>סיום חוזה</th>
              <th>סיום ייצוג</th>
              <th>פעולה הבאה</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const contractDays = p.latestContract ? daysUntil(p.latestContract.endDate) : null;
              const repDays = p.latestRepresentation ? daysUntil(p.latestRepresentation.endDate) : null;
              return (
                <tr key={p.id}>
                  <td>
                    <Link href={`/crm/players/${p.id}`} className="flex items-center gap-2.5">
                      <span
                        className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center border"
                        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                      >
                        {p.photoPath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.photoPath} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-semibold" style={{ color: "var(--muted)" }}>
                            {p.firstName?.[0]}
                            {p.lastName?.[0]}
                          </span>
                        )}
                      </span>
                      <span>
                        <span className="font-semibold hover:underline">
                          {p.firstName} {p.lastName}
                        </span>
                        {p.fullNameHebrew && (
                          <div className="text-xs" style={{ color: "var(--muted)" }}>
                            {p.fullNameHebrew}
                          </div>
                        )}
                      </span>
                    </Link>
                  </td>
                  <td>{calcAge(p.dateOfBirth) ?? "—"}</td>
                  <td>{p.mainPosition}</td>
                  <td>{p.strongFoot ?? "—"}</td>
                  <td>{p.club?.name ?? "—"}</td>
                  <td>{p.currentCountry ?? "—"}</td>
                  <td>
                    <StatusBadge kind="player" value={p.status} />
                  </td>
                  <td>
                    <StatusBadge kind="representation" value={p.representationStatus} />
                  </td>
                  <td className={contractDays !== null && contractDays <= 90 ? "font-semibold text-[var(--danger)]" : ""}>
                    {p.latestContract ? formatDate(p.latestContract.endDate) : "—"}
                  </td>
                  <td className={repDays !== null && repDays <= 90 ? "font-semibold text-[var(--danger)]" : ""}>
                    {p.latestRepresentation ? formatDate(p.latestRepresentation.endDate) : "—"}
                  </td>
                  <td className="text-xs" style={{ color: "var(--muted)" }}>
                    {p.nextAction ?? "—"}
                  </td>
                </tr>
              );
            })}
            {players.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center py-8" style={{ color: "var(--muted)" }}>
                  לא נמצאו שחקנים
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
