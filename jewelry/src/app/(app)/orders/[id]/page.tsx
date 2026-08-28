import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, getSettings, listCustomers } from "@/lib/data";
import {
  addTimelineEventAction,
  createTaskAction,
  deleteOrderAction,
  deleteOrderItemAction,
  refreshOrderRatesAction,
  setOrderStatusAction,
  toggleTaskAction,
  updateOrderAction,
} from "@/lib/actions";
import {
  ALL_ORDER_STATUSES,
  GATE_STATUSES,
  ORDER_CHANNELS,
  ORDER_STATUSES,
  ORDER_TYPES,
  PRIORITIES,
  TIMELINE_KINDS,
} from "@/lib/constants";
import { marginPctFromMultiplier } from "@/lib/pricing";
import { date, dateTime, ils, pct, relativeDays, usd } from "@/lib/format";
import { saveItemAsProductAction } from "@/lib/product-actions";
import { Badge, Cell, Empty, Field, PageHead, SectionHead, StatusBadge } from "@/components/ui";

const TABS = [
  { key: "details", label: "פרטים" },
  { key: "items", label: "פריטים ותמחור" },
  { key: "journal", label: "יומן" },
  { key: "tasks", label: "משימות" },
] as const;

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const tab = TABS.some((t) => t.key === rawTab) ? rawTab! : "details";

  const full = await getOrder(id);
  if (!full) notFound();
  const { order, customer, items, lines, totals, history, timeline, tasks } = full;
  const [settings, customers] = await Promise.all([getSettings(), listCustomers()]);

  const money = (u: number, i: number) => (order.isExport ? usd(u) : ils(i));
  const ratesStale =
    order.goldSpotSnapshot !== settings.goldSpotUsdOz || order.fxSnapshot !== settings.fxUsdIls;
  const nextStatus =
    ORDER_STATUSES[ORDER_STATUSES.indexOf(order.status as never) + 1] ?? null;

  return (
    <>
      <PageHead
        title={`${order.orderNumber} · ${customer?.name ?? "—"}`}
        sub={`${order.type} · ${order.channel}${order.isExport ? " · עסקת ייצוא" : ""}`}
      >
        <StatusBadge status={order.status} />
        {nextStatus ? (
          <form action={setOrderStatusAction}>
            <input type="hidden" name="id" value={order.id} />
            <input type="hidden" name="status" value={nextStatus} />
            <button className="btn btn-primary btn-sm" type="submit">
              קדם ל״{nextStatus}״
            </button>
          </form>
        ) : null}
      </PageHead>

      {/* --- סרגל סיכום --- */}
      <div className="cell-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
        <Cell label="סה״כ" value={<span className="num">{money(totals.totalUsd, totals.totalIls)}</span>} />
        <Cell
          label={order.isExport ? "מע״מ (ייצוא)" : `מע״מ ${totals.vatPct}%`}
          value={<span className="num">{money(totals.vatUsd, totals.vatIls)}</span>}
        />
        <Cell
          label={`מקדמה ${order.depositPct}%`}
          value={<span className="num">{money(totals.depositUsd, totals.depositIls)}</span>}
        />
        <Cell
          label="רווח"
          value={
            <span className={`num ${totals.profitUsd >= 0 ? "good" : "danger"}`}>
              {money(totals.profitUsd, totals.profitUsd * order.fxSnapshot)} · {pct(totals.marginPct)}
            </span>
          }
        />
        <Cell label="מסירה" value={<span className="num">{date(order.promisedDate)}</span>} />
      </div>

      {order.promisedDate && relativeDays(order.promisedDate).startsWith("עבר") ? (
        <div className="panel panel-accent">
          <span className="micro danger">באיחור</span>
          <p style={{ marginTop: 4, fontSize: 14 }}>
            התאריך שהובטח ללקוח {relativeDays(order.promisedDate)}.
          </p>
        </div>
      ) : null}

      <nav className="tabs">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/orders/${order.id}?tab=${t.key}`}
            className={tab === t.key ? "active" : undefined}
          >
            {t.label}
            {t.key === "items" && items.length ? ` (${items.length})` : ""}
            {t.key === "tasks" && tasks.filter((x) => x.status === "פתוח").length
              ? ` (${tasks.filter((x) => x.status === "פתוח").length})`
              : ""}
          </Link>
        ))}
      </nav>

      {/* ============================ פרטים ============================ */}
      {tab === "details" ? (
        <>
          <section>
            <SectionHead title="שערים שנשמרו על ההזמנה" latin="LOCKED RATES" />
            <div className="panel stack">
              <div
                className="cell-grid"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}
              >
                <Cell label="זהב / אונקיה" value={<span className="num">{usd(order.goldSpotSnapshot)}</span>} />
                <Cell label="שער יציג" value={<span className="num">{order.fxSnapshot.toFixed(4)}</span>} />
                <Cell label="מע״מ" value={<span className="num">{order.vatSnapshot}%</span>} />
              </div>
              <p className="quiet" style={{ fontSize: 12.5 }}>
                השערים ננעלו כשההזמנה נפתחה, כדי שהרווחיות תישאר מדידה גם אם הזהב יזוז.
              </p>
              {ratesStale ? (
                <form action={refreshOrderRatesAction} className="row">
                  <input type="hidden" name="id" value={order.id} />
                  <span className="warn" style={{ fontSize: 13 }}>
                    שערי היום שונים ({usd(settings.goldSpotUsdOz)} / {settings.fxUsdIls.toFixed(4)}).
                  </span>
                  <button className="btn btn-sm" type="submit">
                    עדכן לשערי היום
                  </button>
                </form>
              ) : null}
            </div>
          </section>

          <section>
            <SectionHead title="עריכת ההזמנה" latin="EDIT" />
            <form action={updateOrderAction} className="panel stack">
              <input type="hidden" name="id" value={order.id} />
              <div className="form-grid">
                <Field label="לקוח">
                  <select name="customerId" defaultValue={order.customerId}>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="סוג">
                  <select name="type" defaultValue={order.type}>
                    {ORDER_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="ערוץ">
                  <select name="channel" defaultValue={order.channel}>
                    {ORDER_CHANNELS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="דחיפות">
                  <select name="priority" defaultValue={order.priority}>
                    {PRIORITIES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="תאריך האירוע">
                  <input type="date" name="eventDate" defaultValue={order.eventDate ?? ""} />
                </Field>
                <Field label="תאריך מובטח">
                  <input type="date" name="promisedDate" defaultValue={order.promisedDate ?? ""} />
                </Field>
                <Field label="יעד פנימי">
                  <input type="date" name="internalDueDate" defaultValue={order.internalDueDate ?? ""} />
                </Field>
                <Field label="מקדמה (%)">
                  <input type="number" name="depositPct" defaultValue={order.depositPct} min="0" max="100" />
                </Field>
                <Field label="מס׳ חשבונית ירוקה">
                  <input name="greenInvoiceNumber" defaultValue={order.greenInvoiceNumber ?? ""} dir="ltr" />
                </Field>
              </div>
              <label className="switch">
                <input type="checkbox" name="isExport" defaultChecked={order.isExport} />
                עסקת ייצוא — מע״מ 0%
              </label>
              <Field label="הערות">
                <textarea name="notes" defaultValue={order.notes ?? ""} />
              </Field>
              <div>
                <button className="btn btn-primary" type="submit">
                  שמור
                </button>
              </div>
            </form>
          </section>

          <section>
            <SectionHead title="שינוי סטטוס" latin="STATUS" />
            <form action={setOrderStatusAction} className="panel row" style={{ alignItems: "flex-end" }}>
              <input type="hidden" name="id" value={order.id} />
              <div style={{ flex: "1 1 180px" }}>
                <Field label="סטטוס">
                  <select name="status" defaultValue={order.status}>
                    {ALL_ORDER_STATUSES.map((s) => (
                      <option key={s}>
                        {s}
                        {GATE_STATUSES.has(s) ? " ·" : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div style={{ flex: "2 1 220px" }}>
                <Field label="הערה">
                  <input name="note" placeholder="למשל: המפעל אישר קבלה" />
                </Field>
              </div>
              <button className="btn" type="submit">
                עדכן
              </button>
            </form>
          </section>

          <section>
            <SectionHead title="היסטוריית סטטוסים" latin="HISTORY" />
            <div className="panel">
              {history.length === 0 ? (
                <p className="quiet" style={{ fontSize: 13 }}>
                  אין עדיין היסטוריה.
                </p>
              ) : (
                <div className="spec">
                  {history.map((h) => (
                    <div key={h.id} className="spec-row">
                      <span className="k" style={{ whiteSpace: "normal" }}>
                        {h.fromStatus ? `${h.fromStatus} ← ` : ""}
                        <strong style={{ color: "var(--ink-1)" }}>{h.toStatus}</strong>
                        {h.note ? <span className="quiet"> · {h.note}</span> : null}
                      </span>
                      <span className="v num quiet">{dateTime(h.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <hr className="hairline" />
          <form action={deleteOrderAction}>
            <input type="hidden" name="id" value={order.id} />
            <button className="btn btn-ghost btn-sm btn-danger" type="submit">
              מחיקת ההזמנה
            </button>
          </form>
        </>
      ) : null}

      {/* ============================ פריטים ============================ */}
      {tab === "items" ? (
        <>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <Link href={`/orders/${order.id}/items/new`} className="btn btn-primary btn-sm">
              הוסף פריט
            </Link>
          </div>

          {items.length === 0 ? (
            <Empty>
              <p>אין עדיין פריטים בהזמנה.</p>
              <Link href={`/orders/${order.id}/items/new`} className="btn btn-primary btn-sm">
                הוסף פריט ראשון
              </Link>
            </Empty>
          ) : (
            <div className="stack">
              {items.map((item, idx) => {
                const line = lines[idx];
                return (
                  <div key={item.id} className="panel stack">
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <div>
                        <h3 style={{ fontSize: 20 }}>{item.name}</h3>
                        <div className="row" style={{ gap: 6, marginTop: 6 }}>
                          <Badge>{item.category}</Badge>
                          <Badge tone="accent">
                            {item.karat} {item.metalColor}
                          </Badge>
                          {item.quantity > 1 ? <Badge>×{item.quantity}</Badge> : null}
                        </div>
                      </div>
                      <div className="row" style={{ gap: 6 }}>
                        {item.productId ? (
                          <Link href={`/catalog/${item.productId}`} className="btn btn-sm">
                            הדגם בקטלוג
                          </Link>
                        ) : (
                          <form action={saveItemAsProductAction}>
                            <input type="hidden" name="itemId" value={item.id} />
                            <button className="btn btn-sm" type="submit">
                              שמור כדגם
                            </button>
                          </form>
                        )}
                        <Link href={`/orders/${order.id}/items/${item.id}`} className="btn btn-sm">
                          עריכה
                        </Link>
                        <form action={deleteOrderItemAction}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <input type="hidden" name="orderId" value={order.id} />
                          <button className="btn btn-sm btn-ghost btn-danger" type="submit">
                            הסר
                          </button>
                        </form>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: "var(--space-5)",
                      }}
                    >
                      <div className="spec">
                        <SpecLine k="משקל זהב" v={`${item.weightG.toFixed(2)} גר׳`} />
                        {item.centerCaratTotal ? (
                          <SpecLine
                            k="אבן מרכזית"
                            v={`${item.centerCaratTotal} ct · ${item.centerStoneType ?? "—"}`}
                          />
                        ) : null}
                        {item.sideStonesOn ? (
                          <SpecLine k="אבני צד" v={`${item.sideCaratTotal} ct`} />
                        ) : null}
                        {item.size ? <SpecLine k="מידה" v={item.size} /> : null}
                        {item.engraving ? <SpecLine k="חריטה" v={item.engraving} /> : null}
                      </div>
                      <div className="spec">
                        <SpecLine
                          k="עלות ליחידה"
                          v={money(line.cost.totalUsd, line.cost.totalUsd * order.fxSnapshot)}
                        />
                        <SpecLine
                          k="מכפיל"
                          v={`×${item.multiplier} · רווח ${pct(marginPctFromMultiplier(item.multiplier), 0)}`}
                        />
                        <SpecLine
                          k="מחיר ליחידה"
                          v={money(line.unitPriceUsd, line.unitPriceUsd * order.fxSnapshot)}
                        />
                        <SpecLine
                          k="סה״כ שורה"
                          v={money(line.linePriceUsd, line.linePriceUsd * order.fxSnapshot)}
                        />
                        <SpecLine
                          k="רווח"
                          v={
                            <span className={line.profitUsd >= 0 ? "good" : "danger"}>
                              {money(line.profitUsd, line.profitUsd * order.fxSnapshot)} ·{" "}
                              {pct(line.marginPct)}
                            </span>
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <section>
            <SectionHead title="סיכום ההזמנה" latin="TOTALS" />
            <div className="panel panel-accent">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "var(--space-5)",
                }}
              >
                <div className="spec">
                  <SpecLine k="סה״כ לפני מע״מ" v={money(totals.subtotalUsd, totals.subtotalIls)} />
                  <SpecLine
                    k={order.isExport ? "מע״מ — עסקת ייצוא" : `מע״מ ${totals.vatPct}%`}
                    v={money(totals.vatUsd, totals.vatIls)}
                  />
                  <SpecLine
                    k="עלות כוללת"
                    v={money(totals.costUsd, totals.costUsd * order.fxSnapshot)}
                  />
                  <SpecLine
                    k="רווח"
                    v={
                      <span className={totals.profitUsd >= 0 ? "good" : "danger"}>
                        {money(totals.profitUsd, totals.profitUsd * order.fxSnapshot)} ·{" "}
                        {pct(totals.marginPct)}
                      </span>
                    }
                  />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="micro">סה״כ לתשלום</div>
                  <div className="figure">{money(totals.totalUsd, totals.totalIls)}</div>
                  <div className="quiet" style={{ fontSize: 12, marginTop: 6 }}>
                    מקדמה {order.depositPct}% · {money(totals.depositUsd, totals.depositIls)}
                  </div>
                  {order.isExport ? (
                    <div className="gold" style={{ fontSize: 11.5, marginTop: 4 }}>
                      עסקת ייצוא — ללא מע״מ
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}

      {/* ============================ יומן ============================ */}
      {tab === "journal" ? (
        <section>
          <SectionHead title="יומן" latin="JOURNAL" />
          <div className="panel stack">
            <form action={addTimelineEventAction} className="stack-sm">
              <input type="hidden" name="orderId" value={order.id} />
              <div className="form-grid">
                <Field label="סוג">
                  <select name="kind" defaultValue="הערה">
                    {TIMELINE_KINDS.filter((k) => k !== "מערכת").map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </Field>
                <Field label="מה קרה">
                  <input name="title" required placeholder="למשל: הלקוח אישר את הסקיצה" />
                </Field>
              </div>
              <Field label="פירוט">
                <textarea name="body" />
              </Field>
              <div>
                <button className="btn btn-sm" type="submit">
                  הוסף
                </button>
              </div>
            </form>

            {timeline.length === 0 ? (
              <p className="quiet" style={{ fontSize: 13 }}>
                עוד לא נרשם כלום.
              </p>
            ) : (
              <div className="stack-sm">
                {timeline.map((e) => (
                  <div key={e.id} className="cell">
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <span>
                        <Badge tone={e.kind === "מערכת" ? "quiet" : "accent"}>{e.kind}</Badge>{" "}
                        {e.title}
                      </span>
                      <span className="num quiet" style={{ fontSize: 12 }}>
                        {dateTime(e.createdAt)}
                      </span>
                    </div>
                    {e.body ? (
                      <p className="muted" style={{ fontSize: 13.5, marginTop: 6, whiteSpace: "pre-wrap" }}>
                        {e.body}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* ============================ משימות ============================ */}
      {tab === "tasks" ? (
        <section>
          <SectionHead title="משימות להזמנה" latin="TASKS" />
          <div className="panel stack">
            <form action={createTaskAction} className="row" style={{ alignItems: "flex-end" }}>
              <input type="hidden" name="orderId" value={order.id} />
              <div style={{ flex: "2 1 220px" }}>
                <Field label="משימה">
                  <input name="title" required placeholder="למשל: לשלוח סקיצה ללקוח" />
                </Field>
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <Field label="עד מתי">
                  <input type="date" name="dueDate" />
                </Field>
              </div>
              <button className="btn btn-sm" type="submit">
                הוסף
              </button>
            </form>

            {tasks.length === 0 ? (
              <p className="quiet" style={{ fontSize: 13 }}>
                אין משימות פתוחות להזמנה הזו.
              </p>
            ) : (
              <div className="spec">
                {tasks.map((t) => (
                  <div key={t.id} className="spec-row">
                    <span className="k" style={{ whiteSpace: "normal" }}>
                      <form action={toggleTaskAction} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={t.id} />
                        <button
                          type="submit"
                          className="btn btn-sm btn-ghost"
                          style={{ padding: "2px 8px", marginInlineEnd: 8 }}
                        >
                          {t.status === "הושלם" ? "✓" : "○"}
                        </button>
                      </form>
                      <span
                        style={{
                          textDecoration: t.status === "הושלם" ? "line-through" : undefined,
                          color: t.status === "הושלם" ? "var(--ink-3)" : undefined,
                        }}
                      >
                        {t.title}
                      </span>
                    </span>
                    <span className="v num quiet">{t.dueDate ? relativeDays(t.dueDate) : "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}
    </>
  );
}

function SpecLine({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="spec-row">
      <span className="k">{k}</span>
      <span className="v num">{v}</span>
    </div>
  );
}
