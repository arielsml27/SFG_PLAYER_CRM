import Link from "next/link";
import { listCustomers } from "@/lib/data";
import { Badge, Empty, PageHead } from "@/components/ui";
import { date } from "@/lib/format";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const customers = await listCustomers(q);

  return (
    <>
      <PageHead title="לקוחות" sub={`${customers.length} רשומות`}>
        <form className="row" style={{ gap: 6 }}>
          <input name="q" defaultValue={q ?? ""} placeholder="חיפוש שם, טלפון, מייל…" style={{ width: 220 }} />
          <button className="btn btn-sm" type="submit">
            חיפוש
          </button>
        </form>
        <Link href="/customers/new" className="btn btn-primary">
          לקוח חדש
        </Link>
      </PageHead>

      {customers.length === 0 ? (
        <Empty>
          <p>{q ? "לא נמצאו לקוחות שמתאימים לחיפוש." : "עדיין אין לקוחות."}</p>
          <Link href="/customers/new" className="btn btn-primary btn-sm">
            הוסף לקוח
          </Link>
        </Empty>
      ) : (
        <div className="panel panel-tight table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>שם</th>
                <th>סוג</th>
                <th>טלפון</th>
                <th>מקור</th>
                <th>הזמנות</th>
                <th>עודכן</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="link-row">
                  <td className="name">
                    <Link href={`/customers/${c.id}`}>
                      {c.name}
                      {c.defaultExport ? (
                        <span className="badge badge-accent" style={{ marginInlineStart: 8 }}>
                          ייצוא
                        </span>
                      ) : null}
                    </Link>
                  </td>
                  <td>
                    <Badge tone={c.type === "פרטי" ? "quiet" : "accent"}>{c.type}</Badge>
                  </td>
                  <td className="num muted">{c.phone ?? "—"}</td>
                  <td className="muted">{c.source ?? "—"}</td>
                  <td className="num">{c.orderCount}</td>
                  <td className="num quiet">{date(c.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
