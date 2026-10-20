import Link from "next/link";
import { getClubMap } from "@/lib/data";
import { RELATIONSHIP_LEVEL_LABELS } from "@/lib/constants";
import { Map as MapIcon } from "lucide-react";

export const dynamic = "force-dynamic";

// 2 (אח שלי) is the strongest tie, 3 (לא מכיר) the weakest.
function relationshipTone(level: number | null): string {
  if (level === 2) return "badge-ok";
  if (level === 1) return "badge-gold";
  if (level === 4) return "badge-warn";
  return "badge-neutral";
}

export default async function ClubMapPage() {
  const rows = await getClubMap();
  const withRelationship = rows.filter((r) => r.strongestRelationshipLevel !== null).length;

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/crm/clubs" className="text-sm hover:underline" style={{ color: "var(--muted)" }}>
            ← כל המדינות
          </Link>
          <h1 className="text-2xl font-bold mt-1 flex items-center gap-2">
            <MapIcon size={22} style={{ color: "var(--gold)" }} />
            מפת מועדונים
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {rows.length} מועדונים · ב-{withRelationship} מהם יש איש קשר עם רמת קשר מוגדרת. מסודר לפי עוצמת הקשר (אח שלי, בסדר, מכיר מישהו חזק, לא מכיר).
          </p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>מועדון</th>
              <th>ליגה / מדינה</th>
              <th>אנשי קשר</th>
              <th>הקשר החזק ביותר</th>
              <th>איש הקשר המקצועי שלנו</th>
              <th>הצעות שנשלחו</th>
              <th>בקשות פתוחות</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-medium">
                  <Link href={`/crm/clubs/${r.id}`} className="hover:underline" style={{ color: "var(--gold)" }}>
                    {r.name}
                  </Link>
                </td>
                <td>{[r.league, r.country].filter(Boolean).join(" · ") || "—"}</td>
                <td>{r.contactsCount}</td>
                <td>
                  {r.strongestRelationshipLevel !== null ? (
                    <span className={`badge ${relationshipTone(r.strongestRelationshipLevel)}`}>
                      {RELATIONSHIP_LEVEL_LABELS[r.strongestRelationshipLevel] ?? r.strongestRelationshipLevel}
                    </span>
                  ) : (
                    <span style={{ color: "var(--muted)" }}>—</span>
                  )}
                </td>
                <td>{r.primaryContactName ?? <span style={{ color: "var(--muted)" }}>—</span>}</td>
                <td>{r.proposalsCount}</td>
                <td>
                  {r.openRequestsCount > 0 ? <span className="badge badge-ok">{r.openRequestsCount}</span> : 0}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8" style={{ color: "var(--muted)" }}>
                  אין מועדונים עדיין
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
