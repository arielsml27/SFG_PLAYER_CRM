import Link from "next/link";
import { listSuppliers } from "@/lib/data";
import { Badge, Empty, PageHead } from "@/components/ui";

export default async function SuppliersPage() {
  const suppliers = await listSuppliers();

  return (
    <>
      <PageHead title="ספקים ומפעלים" sub={`${suppliers.length} ספקים`}>
        <Link href="/suppliers/new" className="btn btn-primary">
          ספק חדש
        </Link>
      </PageHead>

      {suppliers.length === 0 ? (
        <Empty>
          <p>עדיין לא הוזנו ספקים.</p>
          <p className="quiet" style={{ fontSize: 13, maxWidth: 440 }}>
            כל המפעלים שלך חיצוניים, ולכן זו נקודת ההתחלה: מוסיפים מפעל, ואז אפשר
            לפתוח לו הזמנת עבודה מתוך הזמנה ולשלוח לו לינק.
          </p>
          <Link href="/suppliers/new" className="btn btn-primary btn-sm">
            הוסף מפעל
          </Link>
        </Empty>
      ) : (
        <div className="panel panel-tight table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>שם</th>
                <th>סוג</th>
                <th>איש קשר</th>
                <th>זמן אספקה</th>
                <th>עבודות פתוחות</th>
                <th>סה״כ</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="link-row">
                  <td className="name">
                    <Link href={`/suppliers/${s.id}`}>{s.name}</Link>
                    {!s.isActive ? (
                      <span className="badge badge-quiet" style={{ marginInlineStart: 8 }}>
                        לא פעיל
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <Badge tone="accent">{s.type}</Badge>
                  </td>
                  <td className="muted">{s.contactName ?? "—"}</td>
                  <td className="num muted">{s.leadDays ? `${s.leadDays} ימים` : "—"}</td>
                  <td className="num">
                    <span className={s.openCount ? "warn" : "quiet"}>{s.openCount}</span>
                  </td>
                  <td className="num quiet">{s.workOrderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
