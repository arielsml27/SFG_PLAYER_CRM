import { getAllClubs } from "@/lib/data";
import { createClub } from "@/lib/actions";

export default async function ClubsPage() {
  const clubs = await getAllClubs();

  return (
    <div className="max-w-4xl space-y-5">
      <h1 className="text-2xl font-bold">מועדונים</h1>

      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-sm" style={{ color: "var(--navy)" }}>
          + מועדון חדש
        </summary>
        <form action={createClub} className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div>
            <label className="field-label">שם *</label>
            <input name="name" required className="input" />
          </div>
          <div>
            <label className="field-label">מדינה</label>
            <input name="country" className="input" />
          </div>
          <div>
            <label className="field-label">ליגה</label>
            <input name="league" className="input" />
          </div>
          <div>
            <label className="field-label">עיר</label>
            <input name="city" className="input" />
          </div>
          <div>
            <label className="field-label">אתר</label>
            <input name="website" className="input" />
          </div>
          <div className="md:col-span-2">
            <label className="field-label">הערות</label>
            <textarea name="notes" className="input" rows={2} />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="btn btn-gold btn-sm">
              הוסף מועדון
            </button>
          </div>
        </form>
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
                <td className="font-medium">{c.name}</td>
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
