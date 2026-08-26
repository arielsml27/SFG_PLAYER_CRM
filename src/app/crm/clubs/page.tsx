import Link from "next/link";
import { getAllClubs } from "@/lib/data";
import { createClub } from "@/lib/club-actions";
import ClubForm from "@/components/ClubForm";

export const dynamic = "force-dynamic";

export default async function ClubsPage() {
  const clubs = await getAllClubs();

  return (
    <div className="max-w-4xl space-y-5">
      <h1 className="text-2xl font-bold">מועדונים</h1>

      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-sm" style={{ color: "var(--navy)" }}>
          + מועדון חדש
        </summary>
        <div className="mt-4">
          <ClubForm action={createClub} submitLabel="הוסף מועדון" />
        </div>
      </details>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>שם</th>
              <th>מדינה</th>
              <th>ליגה</th>
              <th>עיר</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">
                  <Link href={`/crm/clubs/${c.id}`} className="hover:underline" style={{ color: "var(--gold)" }}>
                    {c.name}
                  </Link>
                </td>
                <td>{c.country ?? "—"}</td>
                <td>{c.league ?? "—"}</td>
                <td>{c.city ?? "—"}</td>
              </tr>
            ))}
            {clubs.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8" style={{ color: "var(--muted)" }}>
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
