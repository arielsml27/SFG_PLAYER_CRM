import Link from "next/link";
import { getAllClubs, getCountriesWithClubCounts } from "@/lib/data";
import { createClub } from "@/lib/club-actions";
import ClubForm from "@/components/ClubForm";
import { Globe2, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClubsPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const { country } = await searchParams;

  if (!country) {
    const countries = await getCountriesWithClubCounts();
    return (
      <div className="max-w-4xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold">מדינות</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            בחר מדינה כדי לראות את המועדונים שלה
          </p>
        </div>

        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>מדינה</th>
                <th>מספר מועדונים</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {countries.map((c) => (
                <tr key={c.country}>
                  <td className="font-medium flex items-center gap-2">
                    <Globe2 size={15} style={{ color: "var(--gold)" }} />
                    {c.country}
                  </td>
                  <td>{c.count}</td>
                  <td>
                    <Link
                      href={`/crm/clubs?country=${encodeURIComponent(c.country)}`}
                      className="inline-flex items-center gap-1 text-sm hover:underline"
                      style={{ color: "var(--navy)" }}
                    >
                      הצג מועדונים
                      <ChevronLeft size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
              {countries.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-8" style={{ color: "var(--muted)" }}>
                    אין מועדונים עדיין
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <details className="card p-4">
          <summary className="cursor-pointer font-semibold text-sm" style={{ color: "var(--navy)" }}>
            + מועדון חדש
          </summary>
          <div className="mt-4">
            <ClubForm action={createClub} submitLabel="הוסף מועדון" />
          </div>
        </details>
      </div>
    );
  }

  const clubs = await getAllClubs(country);

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <Link href="/crm/clubs" className="text-sm hover:underline" style={{ color: "var(--muted)" }}>
          ← כל המדינות
        </Link>
        <h1 className="text-2xl font-bold mt-1">מועדונים ב{country}</h1>
      </div>

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
                <td>{c.league ?? "—"}</td>
                <td>{c.city ?? "—"}</td>
              </tr>
            ))}
            {clubs.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-8" style={{ color: "var(--muted)" }}>
                  אין מועדונים ב{country} המועדונין הזו
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
