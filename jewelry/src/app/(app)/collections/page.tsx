import Link from "next/link";
import { listCollections } from "@/lib/data";
import { date } from "@/lib/format";
import { Badge, Empty, PageHead } from "@/components/ui";

export default async function CollectionsPage() {
  const collections = await listCollections();

  return (
    <>
      <PageHead title="קולקציות" sub="מבחר דגמים שנשלח בלינק אחד">
        <Link href="/collections/new" className="btn btn-primary">
          קולקציה חדשה
        </Link>
      </PageHead>

      {collections.length === 0 ? (
        <Empty>
          <p>אין עדיין קולקציות.</p>
          <p className="quiet" style={{ fontSize: 13, maxWidth: 460 }}>
            קולקציה היא מבחר שאתה מכין ללקוחה מסוימת — ״טבעות אירוסין עד 12,000״,
            ״מבחר לנועה״ — ושולח בלינק אחד במקום שבע תמונות.
          </p>
          <Link href="/collections/new" className="btn btn-primary btn-sm">
            צור קולקציה
          </Link>
        </Empty>
      ) : (
        <div className="panel panel-tight table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>שם</th>
                <th>ללקוח</th>
                <th>דגמים</th>
                <th>מחירים</th>
                <th>מצב</th>
                <th>עודכן</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((c) => (
                <tr key={c.id} className="link-row">
                  <td className="name">
                    <Link href={`/collections/${c.id}`}>{c.title}</Link>
                  </td>
                  <td className="muted">{c.customerName ?? "—"}</td>
                  <td className="num">{c.itemCount}</td>
                  <td>
                    <Badge>{c.priceMode}</Badge>
                  </td>
                  <td>
                    {c.isPublished ? <Badge tone="good">מפורסמת</Badge> : <Badge>טיוטה</Badge>}
                  </td>
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
