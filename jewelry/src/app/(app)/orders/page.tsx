import Link from "next/link";
import { listOrders } from "@/lib/data";
import { ALL_ORDER_STATUSES } from "@/lib/constants";
import { date, ils, relativeDays, usd } from "@/lib/format";
import { Badge, Empty, PageHead, StatusBadge } from "@/components/ui";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const orders = await listOrders({ status, query: q });

  return (
    <>
      <PageHead title="הזמנות" sub={`${orders.length} הזמנות`}>
        <form className="row" style={{ gap: 6 }}>
          <input name="q" defaultValue={q ?? ""} placeholder="מס׳ הזמנה או לקוח…" style={{ width: 190 }} />
          <select name="status" defaultValue={status ?? "הכל"} style={{ width: 150 }}>
            <option>הכל</option>
            {ALL_ORDER_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button className="btn btn-sm" type="submit">
            סינון
          </button>
        </form>
        <Link href="/orders/new" className="btn btn-primary">
          הזמנה חדשה
        </Link>
      </PageHead>

      {orders.length === 0 ? (
        <Empty>
          <p>אין הזמנות שמתאימות לסינון.</p>
          <Link href="/orders/new" className="btn btn-primary btn-sm">
            פתח הזמנה
          </Link>
        </Empty>
      ) : (
        <div className="panel panel-tight table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>מס׳</th>
                <th>לקוח</th>
                <th>סטטוס</th>
                <th>פריטים</th>
                <th>מסירה</th>
                <th>סה״כ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const rel = relativeDays(o.promisedDate);
                const overdue = rel.startsWith("עבר");
                return (
                  <tr key={o.id} className="link-row">
                    <td className="num">
                      <Link href={`/orders/${o.id}`}>{o.orderNumber}</Link>
                    </td>
                    <td className="name">
                      <Link href={`/orders/${o.id}`}>{o.customerName}</Link>
                      {o.isExport ? (
                        <span className="badge badge-accent" style={{ marginInlineStart: 8 }}>
                          ייצוא
                        </span>
                      ) : null}
                      {o.priority !== "רגיל" ? (
                        <span className="badge badge-warn" style={{ marginInlineStart: 6 }}>
                          {o.priority}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="num muted">{o.itemCount}</td>
                    <td className="num">
                      <span className={overdue ? "danger" : "muted"}>{date(o.promisedDate)}</span>
                    </td>
                    <td className="num">{o.isExport ? usd(o.totalUsd) : ils(o.totalIls)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="quiet" style={{ fontSize: 12 }}>
        <Badge tone="accent">ייצוא</Badge> — הזמנה ללא מע״מ, מוצגת בדולר.
      </p>
    </>
  );
}
