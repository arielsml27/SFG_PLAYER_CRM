import Link from "next/link";
import { getProductPerformance, getProfitReport, getSettings } from "@/lib/data";
import ProfitChart from "@/components/ProfitChart";
import { ils, pct } from "@/lib/format";
import { Cell, Empty, PageHead, SectionHead } from "@/components/ui";

export default async function ReportsPage() {
  const [report, products, settings] = await Promise.all([
    getProfitReport(12),
    getProductPerformance(),
    getSettings(),
  ]);
  const fx = settings.fxUsdIls;
  const m = (usd: number) => ils(usd * fx);

  const now = report.thisMonth;
  const prev = report.lastMonth;
  const delta = prev && prev.netUsd !== 0 ? ((now.netUsd - prev.netUsd) / Math.abs(prev.netUsd)) * 100 : null;
  const hasData = report.totalOrders > 0;

  return (
    <>
      <PageHead title="דוחות" sub="12 החודשים האחרונים" />

      {!hasData ? (
        <Empty>
          <p>עוד אין הזמנות שנמסרו.</p>
          <p className="quiet" style={{ fontSize: 13, maxWidth: 460 }}>
            הדוח סופר הזמנות לפי <strong>חודש המסירה</strong>. הזמנה נכנסת אליו
            כשהסטטוס שלה עובר ל״נמסר״.
          </p>
        </Empty>
      ) : (
        <>
          {/* --- המספר של החודש --- */}
          <section>
            <SectionHead title={`רווח נקי · ${now.label}`} latin="THIS MONTH" />
            <div className="panel panel-accent">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: "var(--space-5)",
                  alignItems: "center",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div className="micro">רווח נקי החודש</div>
                  <div className={`figure ${now.netUsd >= 0 ? "" : "danger"}`}>{m(now.netUsd)}</div>
                  {delta !== null ? (
                    <div
                      className={`num ${delta >= 0 ? "good" : "danger"}`}
                      style={{ fontSize: 12.5, marginTop: 4 }}
                    >
                      {delta >= 0 ? "▲" : "▼"} {pct(Math.abs(delta), 0)} מול {prev!.label}
                    </div>
                  ) : null}
                </div>
                <div className="spec">
                  <Row k="הכנסה (לפני מע״מ)" v={m(now.revenueUsd)} />
                  <Row k="עלות הפריטים" v={m(now.cogsUsd)} />
                  <Row k="רווח גולמי" v={m(now.grossUsd)} />
                  <Row k="הוצאות" v={m(now.expensesUsd)} />
                  <Row k="הזמנות שנמסרו" v={String(now.orders)} />
                </div>
              </div>
            </div>
          </section>

          {/* --- הגרף --- */}
          <section>
            <SectionHead title="רווח נקי לפי חודש" latin="NET PROFIT" />
            <div className="panel">
              <ProfitChart rows={report.rows} fx={fx} />
              <p className="quiet" style={{ fontSize: 12, marginTop: 10 }}>
                ריחוף על עמודה מציג את הסכום המדויק. הטבלה למטה מכילה את אותם
                נתונים במספרים.
              </p>
            </div>
          </section>

          {/* --- סיכום שנתי --- */}
          <section>
            <SectionHead title="שנה אחורה" latin="12 MONTHS" />
            <div
              className="cell-grid"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
            >
              <Cell label="הכנסה" value={<span className="num">{m(report.totalRevenue)}</span>} />
              <Cell label="רווח גולמי" value={<span className="num">{m(report.totalGross)}</span>} />
              <Cell label="הוצאות" value={<span className="num">{m(report.totalExpenses)}</span>} />
              <Cell
                label="רווח נקי"
                value={
                  <span className={`num ${report.totalNet >= 0 ? "good" : "danger"}`}>
                    {m(report.totalNet)}
                  </span>
                }
              />
              <Cell label="הזמנה ממוצעת" value={<span className="num">{m(report.avgOrderUsd)}</span>} />
              <Cell label="רווח גולמי ממוצע" value={<span className="num">{pct(report.avgMarginPct)}</span>} />
            </div>
          </section>

          {/* --- הטבלה --- */}
          <section>
            <SectionHead title="פירוט חודשי" latin="BY MONTH" />
            <div className="panel panel-tight table-scroll">
              <table className="data">
                <thead>
                  <tr>
                    <th>חודש</th>
                    <th>הזמנות</th>
                    <th>הכנסה</th>
                    <th>עלות</th>
                    <th>רווח גולמי</th>
                    <th>הוצאות</th>
                    <th>רווח נקי</th>
                  </tr>
                </thead>
                <tbody>
                  {[...report.rows].reverse().map((r) => (
                    <tr key={r.month}>
                      <td>{r.label}</td>
                      <td className="num muted">{r.orders || "—"}</td>
                      <td className="num muted">{r.revenueUsd ? m(r.revenueUsd) : "—"}</td>
                      <td className="num muted">{r.cogsUsd ? m(r.cogsUsd) : "—"}</td>
                      <td className="num">{r.grossUsd ? m(r.grossUsd) : "—"}</td>
                      <td className="num muted">{r.expensesUsd ? m(r.expensesUsd) : "—"}</td>
                      <td className={`num ${r.netUsd >= 0 ? "" : "danger"}`}>
                        {r.revenueUsd || r.expensesUsd ? m(r.netUsd) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* --- דגמים --- */}
          <section>
            <SectionHead title="מה באמת מרוויח" latin="BY MODEL" />
            {products.length === 0 ? (
              <p className="quiet" style={{ fontSize: 13 }}>
                אין עדיין דגמים שנמכרו. פריט נספר כאן רק אם נטען מהקטלוג —{" "}
                <Link href="/catalog" className="gold" style={{ textDecoration: "underline" }}>
                  הקטלוג
                </Link>
                .
              </p>
            ) : (
              <div className="panel panel-tight table-scroll">
                <table className="data">
                  <thead>
                    <tr>
                      <th>דגם</th>
                      <th>מק״ט</th>
                      <th>יחידות</th>
                      <th>הכנסה</th>
                      <th>רווח</th>
                      <th>שיעור</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="link-row">
                        <td className="name">
                          <Link href={`/catalog/${p.id}`}>{p.name}</Link>
                        </td>
                        <td className="num muted">{p.sku}</td>
                        <td className="num">{p.units}</td>
                        <td className="num muted">{m(p.revenueUsd)}</td>
                        <td className="num">{m(p.profitUsd)}</td>
                        <td className="num gold">{pct(p.marginPct, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      <div className="panel-accent" style={{ padding: "14px 16px" }}>
        <span className="micro">איך נספרים המספרים</span>
        <ul className="tight" style={{ marginTop: 8 }}>
          <li>
            <strong>הכנסה ועלות</strong> נרשמות בחודש שבו ההזמנה נמסרה — לא בחודש
            שבו נפתחה ולא בחודש שבו התקבל התשלום.
          </li>
          <li>
            <strong>ההכנסה היא לפני מע״מ.</strong> המע״מ אינו שלך.
          </li>
          <li>
            <strong>הוצאות</strong> נרשמות בחודש שבו יצא הכסף.
          </li>
          {report.undeliveredOpen > 0 ? (
            <li>
              <strong>{report.undeliveredOpen} הזמנות פתוחות</strong> עדיין לא נספרות,
              כי טרם סומנו כנמסרו.
            </li>
          ) : null}
        </ul>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="spec-row">
      <span className="k">{k}</span>
      <span className="v num">{v}</span>
    </div>
  );
}

export const dynamic = "force-dynamic";
