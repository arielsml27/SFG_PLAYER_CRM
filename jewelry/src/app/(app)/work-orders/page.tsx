import Link from "next/link";
import { listWorkOrders } from "@/lib/data";
import { ALL_WORK_ORDER_STATUSES, workOrderTone } from "@/lib/constants";
import { date, grams, ils, usd } from "@/lib/format";
import { Badge, Cell, Empty, PageHead, SectionHead } from "@/components/ui";

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status ?? "פתוחות";
  const rows = await listWorkOrders({ status: filter });
  const all = await listWorkOrders();
  const open = all.filter((w) => w.isOpen);
  const stuck = open.filter((w) => (w.daysOut ?? 0) >= 10);
  const goldOut = open.reduce((a, w) => a + w.metalSentG, 0);

  return (
    <>
      <PageHead title="הזמנות עבודה" sub={`${open.length} פתוחות מתוך ${all.length}`}>
        <form className="row" style={{ gap: 6 }}>
          <select name="status" defaultValue={filter} style={{ width: 160 }}>
            <option>פתוחות</option>
            <option>הכל</option>
            {ALL_WORK_ORDER_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button className="btn btn-sm" type="submit">
            סינון
          </button>
        </form>
      </PageHead>

      <div className="cell-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <Cell label="פתוחות" value={<span className="num">{open.length}</span>} />
        <Cell
          label="תקועות מעל 10 ימים"
          value={<span className={`num ${stuck.length ? "warn" : ""}`}>{stuck.length}</span>}
        />
        <Cell label="זהב שנמצא בחוץ" value={<span className="num">{grams(goldOut)}</span>} />
      </div>

      <section>
        <SectionHead title={filter === "פתוחות" ? "עבודות פתוחות" : "הזמנות עבודה"} latin="WORK ORDERS" />
        {rows.length === 0 ? (
          <Empty>
            <p>אין הזמנות עבודה שמתאימות לסינון.</p>
            <p className="quiet" style={{ fontSize: 13 }}>
              הזמנת עבודה נפתחת מתוך הזמנה, בטאב ״מפעל״.
            </p>
          </Empty>
        ) : (
          <div className="panel panel-tight table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>מס׳</th>
                  <th>מפעל</th>
                  <th>הזמנה</th>
                  <th>עבודה</th>
                  <th>סטטוס</th>
                  <th>יעד</th>
                  <th>ימים בחוץ</th>
                  <th>זהב</th>
                  <th>עלות</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((w) => (
                  <tr key={w.id} className="link-row">
                    <td className="num">
                      <Link href={`/orders/${w.orderId}?tab=factory`}>{w.woNumber}</Link>
                    </td>
                    <td className="name">
                      <Link href={`/suppliers/${w.supplierId}`}>{w.supplierName}</Link>
                    </td>
                    <td className="num muted">{w.orderNumber}</td>
                    <td className="muted">{w.scope}</td>
                    <td>
                      <Badge tone={workOrderTone(w.status)}>{w.status}</Badge>
                    </td>
                    <td className="num muted">{date(w.dueDate)}</td>
                    <td className={`num ${(w.daysOut ?? 0) >= 10 ? "warn" : "muted"}`}>
                      {w.daysOut === null ? "—" : w.daysOut}
                    </td>
                    <td className="num muted">{w.metalSentG ? grams(w.metalSentG) : "—"}</td>
                    <td className="num">
                      {w.cost ? (w.costCurrency === "USD" ? usd(w.cost) : ils(w.cost)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export const dynamic = "force-dynamic";
