import Link from "next/link";
import { getDashboard } from "@/lib/data";
import { ORDER_STATUSES } from "@/lib/constants";
import { date, ils, relativeDays, usd } from "@/lib/format";
import { Cell, Empty, PageHead, SectionHead, StatusBadge } from "@/components/ui";

export default async function DashboardPage() {
  const d = await getDashboard();
  const ratesMissing = !d.settings.goldSpotUsdOz || !d.settings.fxUsdIls;

  return (
    <>
      <PageHead title="דשבורד" sub={`${d.openCount} הזמנות פתוחות · ${d.customerCount} לקוחות`}>
        <Link href="/orders/new" className="btn btn-primary">
          הזמנה חדשה
        </Link>
      </PageHead>

      {ratesMissing ? (
        <div className="panel panel-accent">
          <div className="micro">לפני שמתמחרים</div>
          <p style={{ marginTop: 6 }}>
            עדיין לא הוזנו שער זהב ושער דולר.{" "}
            <Link href="/settings" className="gold" style={{ textDecoration: "underline" }}>
              עדכן אותם בהגדרות
            </Link>{" "}
            — בלעדיהם כל חישוב עלות יוצא אפס.
          </p>
        </div>
      ) : null}

      {/* --- שערי היום --- */}
      <section>
        <SectionHead title="שערי היום" latin="TODAY'S RATES" />
        <div className="cell-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          <Cell label="זהב 24K / אונקיה" value={<span className="num">{usd(d.settings.goldSpotUsdOz)}</span>} />
          <Cell label="שער יציג $/₪" value={<span className="num">{d.settings.fxUsdIls.toFixed(4)}</span>} />
          <Cell label="מע״מ" value={<span className="num">{d.settings.vatPct}%</span>} />
          <Cell label="שווי צנרת פתוחה" value={<span className="num">{ils(d.pipelineValueIls)}</span>} />
          <Cell
            label="יתרות לגבייה"
            value={
              <Link href="/receivables">
                <span className={`num ${d.outstandingCount ? "warn" : ""}`}>
                  {ils(d.outstandingIls)}
                </span>
              </Link>
            }
          />
        </div>
      </section>

      {/* --- דורש טיפול --- */}
      <section>
        <SectionHead title="דורש טיפול" latin="NEEDS ATTENTION" />
        <div className="grid-cards">
          <AttentionCard
            title="עברו את התאריך"
            count={d.late.length}
            tone="danger"
            rows={d.late.slice(0, 5).map((o) => ({
              href: `/orders/${o.id}`,
              main: `${o.orderNumber} · ${o.customerName}`,
              side: relativeDays(o.promisedDate),
            }))}
            emptyText="שום דבר לא באיחור"
          />
          <AttentionCard
            title="מסירות השבוע"
            count={d.thisWeek.length}
            tone="warn"
            rows={d.thisWeek.slice(0, 5).map((o) => ({
              href: `/orders/${o.id}`,
              main: `${o.orderNumber} · ${o.customerName}`,
              side: date(o.promisedDate),
            }))}
            emptyText="אין מסירות בשבוע הקרוב"
          />
          <AttentionCard
            title="תקוע במפעל"
            count={d.stuckAtFactory.length}
            tone="warn"
            rows={d.stuckAtFactory.slice(0, 5).map((w) => ({
              href: `/orders/${w.orderId}?tab=factory`,
              main: `${w.woNumber} · ${w.supplierName}`,
              side: `${w.daysOut} ימים`,
            }))}
            emptyText="שום עבודה לא תקועה"
          />
          <AttentionCard
            title="משימות קרובות"
            count={d.dueTasks.length}
            tone="accent"
            rows={d.dueTasks.slice(0, 5).map((t) => ({
              href: "/tasks",
              main: t.title,
              side: relativeDays(t.dueDate),
            }))}
            emptyText="אין משימות דחופות"
          />
        </div>
      </section>

      {/* --- צנרת --- */}
      <section>
        <SectionHead title="צנרת ההזמנות" latin="PIPELINE" />
        <div className="tile-grid">
          {ORDER_STATUSES.map((s) => {
            const n = d.byStatus.get(s) ?? 0;
            return (
              <Link key={s} href={`/orders?status=${encodeURIComponent(s)}`} className="tile">
                <div className="micro">{s}</div>
                <div className={`n${n ? "" : " zero"}`}>{n}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* --- הזמנות אחרונות --- */}
      <section>
        <SectionHead title="הזמנות אחרונות" latin="RECENT" />
        {d.recent.length === 0 ? (
          <Empty>
            <p>עדיין אין הזמנות.</p>
            <Link href="/orders/new" className="btn btn-primary btn-sm">
              פתח הזמנה ראשונה
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
                  <th>מסירה</th>
                  <th>סה״כ</th>
                </tr>
              </thead>
              <tbody>
                {d.recent.map((o) => (
                  <tr key={o.id} className="link-row">
                    <td className="num">
                      <Link href={`/orders/${o.id}`}>{o.orderNumber}</Link>
                    </td>
                    <td className="name">
                      <Link href={`/orders/${o.id}`}>{o.customerName}</Link>
                    </td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="num muted">{date(o.promisedDate)}</td>
                    <td className="num">{o.isExport ? usd(o.totalUsd) : ils(o.totalIls)}</td>
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

function AttentionCard({
  title,
  count,
  tone,
  rows,
  emptyText,
}: {
  title: string;
  count: number;
  tone: "danger" | "warn" | "accent";
  rows: { href: string; main: string; side: string }[];
  emptyText: string;
}) {
  return (
    <div className="panel panel-tight stack-sm">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="micro">{title}</span>
        <span className={`figure-sm ${count ? tone : "quiet"}`}>{count}</span>
      </div>
      {rows.length === 0 ? (
        <p className="quiet" style={{ fontSize: 13 }}>
          {emptyText}
        </p>
      ) : (
        <div className="spec">
          {rows.map((r, i) => (
            <Link key={i} href={r.href} className="spec-row">
              <span className="k" style={{ whiteSpace: "normal" }}>
                {r.main}
              </span>
              <span className="v num">{r.side}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
