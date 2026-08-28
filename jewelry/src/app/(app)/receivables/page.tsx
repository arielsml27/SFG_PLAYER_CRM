import Link from "next/link";
import { getReceivables, getSettings } from "@/lib/data";
import { date, ils, usd } from "@/lib/format";
import { Cell, Empty, PageHead, SectionHead, StatusBadge } from "@/components/ui";

export default async function ReceivablesPage() {
  const [r, settings] = await Promise.all([getReceivables(), getSettings()]);

  return (
    <>
      <PageHead
        title="גבייה"
        sub={r.rows.length ? `${r.rows.length} הזמנות עם יתרה פתוחה` : "אין יתרות פתוחות"}
      />

      <div className="cell-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <Cell
          label="סה״כ לגבייה"
          value={<span className="num">{ils(r.totalIls)}</span>}
        />
        <Cell label="בדולר" value={<span className="num">{usd(r.totalUsd)}</span>} />
        <Cell
          label="פתוח מעל 30 יום"
          value={
            <span className={`num ${r.overdueCount ? "warn" : ""}`}>
              {ils(r.overdueUsd * settings.fxUsdIls)}
            </span>
          }
        />
        <Cell
          label="הזמנות שדורשות טלפון"
          value={<span className={`num ${r.overdueCount ? "warn" : ""}`}>{r.overdueCount}</span>}
        />
      </div>

      <section>
        <SectionHead title="יתרות פתוחות" latin="OUTSTANDING" />
        {r.rows.length === 0 ? (
          <Empty>
            <p>כל ההזמנות שולמו במלואן.</p>
          </Empty>
        ) : (
          <div className="panel panel-tight table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>מס׳</th>
                  <th>לקוח</th>
                  <th>סטטוס</th>
                  <th>סה״כ</th>
                  <th>יתרה</th>
                  <th>פתוח</th>
                  <th>נפתחה</th>
                </tr>
              </thead>
              <tbody>
                {r.rows.map((o) => (
                  <tr key={o.id} className="link-row">
                    <td className="num">
                      <Link href={`/orders/${o.id}?tab=payments`}>{o.orderNumber}</Link>
                    </td>
                    <td className="name">
                      <Link href={`/orders/${o.id}?tab=payments`}>{o.customerName}</Link>
                    </td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="num muted">
                      {o.isExport ? usd(o.totalUsd) : ils(o.totalIls)}
                    </td>
                    <td className="num">
                      <strong>{o.isExport ? usd(o.balanceUsd) : ils(o.balanceIls)}</strong>
                    </td>
                    <td className={`num ${o.ageDays > 30 ? "warn" : "muted"}`}>
                      {o.ageDays} ימים
                    </td>
                    <td className="num quiet">{date(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="quiet" style={{ fontSize: 12.5 }}>
        היתרה היא סה״כ ההזמנה פחות כל התשלומים שנרשמו עליה. הזמנות מבוטלות
        אינן נספרות.
      </p>
    </>
  );
}

export const dynamic = "force-dynamic";
