import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { getCustomer, getCustomerOrders } from "@/lib/data";
import { addTimelineEventAction } from "@/lib/actions";
import DeleteCustomer from "@/components/DeleteCustomer";
import { TIMELINE_KINDS } from "@/lib/constants";
import { date, dateTime, ils, usd } from "@/lib/format";
import { orderTotals, priceItem } from "@/lib/pricing";
import { Badge, Cell, Empty, Field, PageHead, SectionHead, StatusBadge } from "@/components/ui";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const [orders, timeline] = await Promise.all([
    getCustomerOrders(id),
    db
      .select()
      .from(schema.timelineEvents)
      .where(eq(schema.timelineEvents.customerId, id))
      .orderBy(desc(schema.timelineEvents.createdAt)),
  ]);

  const allItems = await db.select().from(schema.orderItems);
  const withTotals = orders.map((o) => {
    const lines = allItems
      .filter((i) => i.orderId === o.id)
      .map((i) => priceItem(i, o.goldSpotSnapshot));
    return {
      order: o,
      totals: orderTotals(lines, {
        isExport: o.isExport,
        vatPct: o.vatSnapshot,
        fx: o.fxSnapshot,
        depositPct: o.depositPct,
      }),
    };
  });
  const lifetimeIls = withTotals.reduce((a, r) => a + r.totals.totalIls, 0);

  const waHref = customer.whatsapp || customer.phone
    ? `https://wa.me/${(customer.whatsapp || customer.phone || "").replace(/[^\d]/g, "")}`
    : null;

  return (
    <>
      <PageHead title={customer.name} sub={`${customer.type} · ${orders.length} הזמנות`}>
        {waHref ? (
          <a href={waHref} target="_blank" rel="noreferrer" className="btn btn-sm">
            וואטסאפ
          </a>
        ) : null}
        <Link href={`/orders/new?customerId=${customer.id}`} className="btn btn-sm">
          הזמנה חדשה
        </Link>
        <Link href={`/customers/${customer.id}/edit`} className="btn btn-primary btn-sm">
          עריכה
        </Link>
      </PageHead>

      <div className="cell-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <Cell label="טלפון" value={customer.phone ?? "—"} dir="ltr" />
        <Cell label="אימייל" value={customer.email ?? "—"} dir="ltr" />
        <Cell label="אינסטגרם" value={customer.instagram ?? "—"} dir="ltr" />
        <Cell label="מיקום" value={[customer.city, customer.country].filter(Boolean).join(", ") || "—"} />
        <Cell label="מקור" value={customer.source ?? "—"} />
        <Cell
          label="סה״כ הזמנות"
          value={<span className="num">{ils(lifetimeIls)}</span>}
        />
      </div>

      {customer.defaultExport ? (
        <div className="panel panel-accent">
          <span className="micro">לקוח ייצוא</span>
          <p style={{ marginTop: 4, fontSize: 13.5 }}>
            הזמנה חדשה תיפתח אוטומטית ללא מע״מ.
          </p>
        </div>
      ) : null}

      {customer.notes ? (
        <section>
          <SectionHead title="הערות" latin="NOTES" />
          <div className="panel" style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>
            {customer.notes}
          </div>
        </section>
      ) : null}

      <section>
        <SectionHead title="הזמנות" latin="ORDERS" />
        {orders.length === 0 ? (
          <Empty>
            <p>אין עדיין הזמנות ללקוח הזה.</p>
            <Link href={`/orders/new?customerId=${customer.id}`} className="btn btn-primary btn-sm">
              פתח הזמנה
            </Link>
          </Empty>
        ) : (
          <div className="panel panel-tight table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>מס׳</th>
                  <th>סוג</th>
                  <th>סטטוס</th>
                  <th>מסירה</th>
                  <th>סה״כ</th>
                </tr>
              </thead>
              <tbody>
                {withTotals.map(({ order, totals }) => (
                  <tr key={order.id} className="link-row">
                    <td className="num">
                      <Link href={`/orders/${order.id}`}>{order.orderNumber}</Link>
                    </td>
                    <td>
                      <Badge>{order.type}</Badge>
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="num muted">{date(order.promisedDate)}</td>
                    <td className="num">
                      {order.isExport ? usd(totals.totalUsd) : ils(totals.totalIls)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <SectionHead title="יומן" latin="JOURNAL" />
        <div className="panel stack">
          <form action={addTimelineEventAction} className="stack-sm">
            <input type="hidden" name="customerId" value={customer.id} />
            <div className="form-grid">
              <Field label="סוג">
                <select name="kind" defaultValue="שיחה">
                  {TIMELINE_KINDS.filter((k) => k !== "מערכת").map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </Field>
              <Field label="מה קרה">
                <input name="title" placeholder="למשל: שלחתי מבחר טבעות" required />
              </Field>
            </div>
            <button className="btn btn-sm" type="submit">
              הוסף ליומן
            </button>
          </form>

          {timeline.length === 0 ? (
            <p className="quiet" style={{ fontSize: 13 }}>
              עוד לא נרשם כלום.
            </p>
          ) : (
            <div className="spec">
              {timeline.map((e) => (
                <div key={e.id} className="spec-row">
                  <span className="k">
                    <Badge>{e.kind}</Badge> {e.title}
                  </span>
                  <span className="v num quiet">{dateTime(e.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <hr className="hairline" />
      <DeleteCustomer id={customer.id} name={customer.name} orderCount={orders.length} />
    </>
  );
}
