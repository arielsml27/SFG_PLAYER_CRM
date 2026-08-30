import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, getSettings, listCustomers } from "@/lib/data";
import DeleteOrder from "@/components/DeleteOrder";
import {
  addPaymentAction,
  addTimelineEventAction,
  createTaskAction,
  deletePaymentAction,
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
  ALL_WORK_ORDER_STATUSES,
  ORDER_TYPES,
  PAYMENT_KINDS,
  PAYMENT_METHODS,
  PRIORITIES,
  TIMELINE_KINDS,
  WORK_ORDER_SCOPES,
  workOrderTone,
} from "@/lib/constants";
import { marginPctFromMultiplier } from "@/lib/pricing";
import { date, dateTime, grams, ils, pct, relativeDays, todayIso, usd } from "@/lib/format";
import { saveItemAsProductAction } from "@/lib/product-actions";
import {
  createWorkOrderAction,
  deleteWorkOrderAction,
  updateWorkOrderAction,
} from "@/lib/factory-actions";
import WorkOrderPhotoUploader from "@/components/WorkOrderPhotoUploader";
import ShareBox from "@/components/ShareBox";
import { shareBase, whatsappLink } from "@/lib/share";
import { getOrderPhotos, getOrderWorkOrders, listSuppliers } from "@/lib/data";
import {
  deleteOrderPhotoAction,
  toggleCustomerLinkAction,
} from "@/lib/customer-actions";
import OrderPhotoUploader from "@/components/OrderPhotoUploader";
import { Badge, Cell, Empty, Field, PageHead, SectionHead, StatusBadge } from "@/components/ui";

const TABS = [
  { key: "details", label: "פרטים" },
  { key: "items", label: "פריטים ותמחור" },
  { key: "design", label: "עיצוב ולקוח" },
  { key: "factory", label: "מפעל" },
  { key: "payments", label: "תשלומים" },
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
  const { order, customer, items, lines, totals, history, timeline, tasks, payments, balance } =
    full;
  const [settings, customers, suppliers, workOrders, designPhotos] = await Promise.all([
    getSettings(),
    listCustomers(),
    listSuppliers(),
    getOrderWorkOrders(id),
    getOrderPhotos(id),
  ]);
  const customerUrl = order.accessToken
    ? `${shareBase(settings.publicBaseUrl)}/order/${order.accessToken}`
    : null;
  const openWorkOrders = workOrders.filter((w) => w.isOpen).length;

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
          label="שולם"
          value={
            <span className="num">{money(balance.netPaidUsd, balance.netPaidUsd * order.fxSnapshot)}</span>
          }
        />
        <Cell
          label="יתרה לגבייה"
          value={
            <span className={`num ${balance.isSettled ? "good" : "warn"}`}>
              {balance.isSettled
                ? "שולם במלואו"
                : money(balance.balanceUsd, balance.balanceUsd * order.fxSnapshot)}
            </span>
          }
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
            {t.key === "factory" && openWorkOrders ? ` (${openWorkOrders})` : ""}
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

      {/* ============================ עיצוב ולקוח ============================ */}
      {tab === "design" ? (
        <>
          <section>
            <SectionHead title="עמוד הלקוח" latin="CUSTOMER PAGE" />
            <div className="panel stack">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="row" style={{ gap: 8 }}>
                  {order.customerLinkEnabled ? (
                    <Badge tone="good">הקישור פעיל</Badge>
                  ) : (
                    <Badge>הקישור כבוי</Badge>
                  )}
                  {order.designApprovedAt ? (
                    <Badge tone="good">העיצוב אושר {date(order.designApprovedAt)}</Badge>
                  ) : null}
                </div>
                <form action={toggleCustomerLinkAction}>
                  <input type="hidden" name="id" value={order.id} />
                  <button
                    className={order.customerLinkEnabled ? "btn btn-sm" : "btn btn-sm btn-primary"}
                    type="submit"
                  >
                    {order.customerLinkEnabled ? "כבה קישור" : "הפעל קישור ללקוח"}
                  </button>
                </form>
              </div>

              {order.customerLinkEnabled && customerUrl ? (
                <ShareBox
                  url={customerUrl}
                  whatsappHref={whatsappLink(
                    customer?.whatsapp ?? customer?.phone,
                    `הזמנה ${order.orderNumber} — מעקב וצפייה בעיצוב\n${customerUrl}`
                  )}
                  hint="הלקוח רואה מצב, עיצוב ויתרה לתשלום. לא רואה עלות, רווח, ספק או מפעל."
                />
              ) : (
                <p className="quiet" style={{ fontSize: 13 }}>
                  הפעלת הקישור יוצרת כתובת קבועה שאפשר לשלוח ללקוח. כיבוי מחזיר 404 מיידית.
                </p>
              )}

              {order.designApprovalNote ? (
                <div className="panel-accent" style={{ padding: "12px 14px" }}>
                  <span className="micro">הערת הלקוח באישור</span>
                  <p style={{ fontSize: 13.5, marginTop: 4 }}>{order.designApprovalNote}</p>
                </div>
              ) : null}
            </div>
          </section>

          <section>
            <SectionHead title="תמונות עיצוב" latin="DESIGN" />
            <div className="panel stack">
              {designPhotos.length === 0 ? (
                <p className="quiet" style={{ fontSize: 13 }}>
                  עוד לא הועלו תמונות. כפתור אישור העיצוב מופיע ללקוח רק כשיש מה לאשר.
                </p>
              ) : (
                <div className="gallery">
                  {designPhotos.map((p) => (
                    <figure key={p.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={order.accessToken ? `/order/${order.accessToken}/photo/${p.id}` : ""}
                        alt={p.kind}
                      />
                      <figcaption>
                        <span>{p.kind}</span>
                        <form action={deleteOrderPhotoAction}>
                          <input type="hidden" name="photoId" value={p.id} />
                          <input type="hidden" name="orderId" value={order.id} />
                          <button
                            className="btn btn-sm btn-ghost btn-danger"
                            style={{ padding: "1px 7px", fontSize: 11 }}
                          >
                            מחק
                          </button>
                        </form>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}

              <hr className="hairline" style={{ margin: "4px 0" }} />
              <OrderPhotoUploader orderId={order.id} />
              <p className="quiet" style={{ fontSize: 12 }}>
                ״עיצוב״ — סקיצות ורנדרים לאישור. ״מוכן״ — הפריט המוגמר, אחרי הייצור.
                התמונות נראות רק דרך הקישור של ההזמנה.
              </p>
            </div>
          </section>
        </>
      ) : null}

      {/* ============================ מפעל ============================ */}
      {tab === "factory" ? (
        <>
          {suppliers.length === 0 ? (
            <Empty>
              <p>אין עדיין ספקים במערכת.</p>
              <p className="quiet" style={{ fontSize: 13 }}>
                כל המפעלים חיצוניים — צריך להוסיף אחד לפני שפותחים לו עבודה.
              </p>
              <Link href="/suppliers/new" className="btn btn-primary btn-sm">
                הוסף מפעל
              </Link>
            </Empty>
          ) : (
            <section>
              <SectionHead title="הזמנת עבודה חדשה" latin="NEW JOB" />
              <form action={createWorkOrderAction} className="panel stack">
                <input type="hidden" name="orderId" value={order.id} />
                <div className="form-grid">
                  <Field label="מפעל">
                    <select name="supplierId" required defaultValue="">
                      <option value="" disabled>
                        בחר
                      </option>
                      {suppliers
                        .filter((s) => s.isActive)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                            {s.leadDays ? ` · ${s.leadDays} ימים` : ""}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label="מה מבקשים">
                    <select name="scope" defaultValue="ייצור מלא">
                      {WORK_ORDER_SCOPES.map((sc) => (
                        <option key={sc}>{sc}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="פריט">
                    <select name="orderItemId" defaultValue={items[0]?.id ?? ""}>
                      <option value="">— כללי —</option>
                      {items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="תאריך שליחה">
                    <input type="date" name="sentAt" defaultValue={todayIso()} />
                  </Field>
                  <Field label="תאריך יעד">
                    <input type="date" name="dueDate" defaultValue={order.internalDueDate ?? ""} />
                  </Field>
                  <Field label="זהב שנשלח (גרם)">
                    <input type="number" name="metalSentG" step="0.01" min="0" defaultValue={0} />
                  </Field>
                  <Field label="עלות מוסכמת">
                    <input type="number" name="cost" step="1" min="0" defaultValue={0} />
                  </Field>
                  <Field label="מטבע">
                    <select name="costCurrency" defaultValue="ILS">
                      <option value="ILS">₪</option>
                      <option value="USD">$</option>
                    </select>
                  </Field>
                </div>
                <Field label="הוראות למפעל" hint="מה שיופיע בעמוד שהמפעל פותח">
                  <textarea name="instructions" placeholder="יציקה לפי הסקיצה, שיבוץ ארבע ציפורניים, ליטוש מלא." />
                </Field>
                <div>
                  <button className="btn btn-primary" type="submit">
                    פתח הזמנת עבודה
                  </button>
                </div>
              </form>
            </section>
          )}

          {workOrders.length > 0 ? (
            <section>
              <SectionHead title="עבודות בהזמנה הזו" latin="WORK ORDERS" />
              <div className="stack">
                {workOrders.map((w) => {
                  const factoryUrl = `${shareBase(settings.publicBaseUrl)}/factory/${w.accessToken}`;
                  const supplier = suppliers.find((s) => s.id === w.supplierId);
                  const lastFactoryUpdate = w.updates.find((u) => u.author === "מפעל");
                  return (
                    <div key={w.id} className="panel stack">
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <div>
                          <h3 style={{ fontSize: 18 }}>
                            {w.woNumber} · {w.supplierName}
                          </h3>
                          <div className="row" style={{ gap: 6, marginTop: 6 }}>
                            <Badge tone={workOrderTone(w.status)}>{w.status}</Badge>
                            <Badge>{w.scope}</Badge>
                            {w.itemName ? <Badge>{w.itemName}</Badge> : null}
                            {(w.daysOut ?? 0) >= 10 ? (
                              <Badge tone="warn">{w.daysOut} ימים בחוץ</Badge>
                            ) : null}
                          </div>
                        </div>
                        <form action={deleteWorkOrderAction}>
                          <input type="hidden" name="id" value={w.id} />
                          <input type="hidden" name="orderId" value={order.id} />
                          <button className="btn btn-sm btn-ghost btn-danger" type="submit">
                            מחק
                          </button>
                        </form>
                      </div>

                      <ShareBox
                        url={factoryUrl}
                        whatsappHref={whatsappLink(
                          supplier?.whatsapp ?? supplier?.phone,
                          `הזמנת עבודה ${w.woNumber}\n${factoryUrl}`
                        )}
                        hint="המפעל רואה מפרט טכני בלבד — בלי שם לקוח, מחיר או רווח."
                      />

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                          gap: "var(--space-5)",
                        }}
                      >
                        <div className="spec">
                          <SpecLine k="נשלח" v={date(w.sentAt)} />
                          <SpecLine k="תאריך יעד" v={date(w.dueDate)} />
                          <SpecLine
                            k="ההתחייבות של המפעל"
                            v={w.factoryEta ? date(w.factoryEta) : "טרם נמסרה"}
                          />
                        </div>
                        <div className="spec">
                          <SpecLine k="זהב שנשלח" v={w.metalSentG ? grams(w.metalSentG) : "—"} />
                          <SpecLine
                            k="זהב שחזר"
                            v={w.metalReturnedG ? grams(w.metalReturnedG) : "—"}
                          />
                          <SpecLine
                            k="פחת"
                            v={
                              w.metalReturnedG ? (
                                <span className={w.wasteG > 0 ? "warn" : ""}>{grams(w.wasteG)}</span>
                              ) : (
                                "—"
                              )
                            }
                          />
                          <SpecLine
                            k="עלות"
                            v={w.cost ? (w.costCurrency === "USD" ? usd(w.cost) : ils(w.cost)) : "—"}
                          />
                        </div>
                      </div>

                      {lastFactoryUpdate ? (
                        <div className="panel-accent" style={{ padding: "12px 14px" }}>
                          <span className="micro">העדכון האחרון מהמפעל</span>
                          <p style={{ fontSize: 13.5, marginTop: 4 }}>
                            {lastFactoryUpdate.status ? (
                              <strong>{lastFactoryUpdate.status}</strong>
                            ) : null}
                            {lastFactoryUpdate.body ? ` · ${lastFactoryUpdate.body}` : ""}
                            <span className="quiet"> · {dateTime(lastFactoryUpdate.createdAt)}</span>
                          </p>
                        </div>
                      ) : null}

                      {w.photos.length > 0 ? (
                        <div className="stack-sm">
                          <span className="micro">
                            תמונות · {w.photos.filter((p) => p.author === "מפעל").length} מהמפעל
                          </span>
                          <div className="photo-strip">
                            {w.photos.map((p) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={p.id}
                                src={`/factory/${w.accessToken}/photo/${p.id}`}
                                alt={p.author}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <WorkOrderPhotoUploader workOrderId={w.id} />

                      <details>
                        <summary className="micro" style={{ cursor: "pointer" }}>
                          עדכון פרטים וסגירה
                        </summary>
                        <form action={updateWorkOrderAction} className="stack" style={{ marginTop: 12 }}>
                          <input type="hidden" name="id" value={w.id} />
                          <div className="form-grid">
                            <Field label="סטטוס">
                              <select name="status" defaultValue={w.status}>
                                {ALL_WORK_ORDER_STATUSES.map((st) => (
                                  <option key={st}>{st}</option>
                                ))}
                              </select>
                            </Field>
                            <Field label="עבודה">
                              <select name="scope" defaultValue={w.scope}>
                                {WORK_ORDER_SCOPES.map((sc) => (
                                  <option key={sc}>{sc}</option>
                                ))}
                              </select>
                            </Field>
                            <Field label="נשלח">
                              <input type="date" name="sentAt" defaultValue={w.sentAt ?? ""} />
                            </Field>
                            <Field label="תאריך יעד">
                              <input type="date" name="dueDate" defaultValue={w.dueDate ?? ""} />
                            </Field>
                            <Field label="זהב שנשלח (גרם)">
                              <input type="number" name="metalSentG" step="0.01" min="0" defaultValue={w.metalSentG} />
                            </Field>
                            <Field label="זהב שחזר (גרם)" hint="כולל הפריט המוגמר">
                              <input type="number" name="metalReturnedG" step="0.01" min="0" defaultValue={w.metalReturnedG} />
                            </Field>
                            <Field label="עלות">
                              <input type="number" name="cost" step="1" min="0" defaultValue={w.cost} />
                            </Field>
                            <Field label="מטבע">
                              <select name="costCurrency" defaultValue={w.costCurrency}>
                                <option value="ILS">₪</option>
                                <option value="USD">$</option>
                              </select>
                            </Field>
                          </div>
                          <Field label="הוראות למפעל">
                            <textarea name="instructions" defaultValue={w.instructions ?? ""} />
                          </Field>
                          <Field label="הערות פנימיות">
                            <textarea name="notes" defaultValue={w.notes ?? ""} />
                          </Field>
                          <div>
                            <button className="btn btn-primary btn-sm" type="submit">
                              שמור
                            </button>
                          </div>
                        </form>
                      </details>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {/* ============================ תשלומים ============================ */}
      {tab === "payments" ? (
        <>
          <section>
            <SectionHead title="מצב התשלום" latin="BALANCE" />
            <div className="panel panel-accent">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "var(--space-5)",
                }}
              >
                <div className="spec">
                  <SpecLine k="סה״כ ההזמנה" v={money(totals.totalUsd, totals.totalIls)} />
                  <SpecLine
                    k={`מקדמה נדרשת ${order.depositPct}%`}
                    v={
                      <span className={balance.depositPaid ? "good" : undefined}>
                        {money(totals.depositUsd, totals.depositIls)}
                        {balance.depositPaid ? " · התקבלה" : ""}
                      </span>
                    }
                  />
                  <SpecLine
                    k="שולם"
                    v={money(balance.paidUsd, balance.paidUsd * order.fxSnapshot)}
                  />
                  {balance.refundedUsd > 0 ? (
                    <SpecLine
                      k="הוחזר"
                      v={
                        <span className="danger">
                          {money(balance.refundedUsd, balance.refundedUsd * order.fxSnapshot)}
                        </span>
                      }
                    />
                  ) : null}
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="micro">{balance.isSettled ? "סטטוס" : "יתרה לגבייה"}</div>
                  <div className={`figure ${balance.isSettled ? "good" : ""}`}>
                    {balance.isSettled
                      ? "שולם"
                      : money(balance.balanceUsd, balance.balanceUsd * order.fxSnapshot)}
                  </div>
                  {!balance.isSettled && !balance.depositPaid && totals.depositUsd > 0 ? (
                    <div className="warn" style={{ fontSize: 12, marginTop: 6 }}>
                      המקדמה עוד לא התקבלה
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section>
            <SectionHead title="רישום תשלום" latin="RECORD" />
            <form action={addPaymentAction} className="panel stack">
              <input type="hidden" name="orderId" value={order.id} />
              <div className="form-grid">
                <Field label="סוג">
                  <select
                    name="kind"
                    defaultValue={balance.depositPaid ? "סופי" : "מקדמה"}
                  >
                    {PAYMENT_KINDS.map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="סכום"
                  hint={balance.isSettled ? undefined : "מולא מראש ביתרה המדויקת"}
                >
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={
                      balance.isSettled
                        ? ""
                        : (order.isExport
                            ? balance.balanceUsd
                            : balance.balanceUsd * order.fxSnapshot
                          ).toFixed(2)
                    }
                  />
                </Field>
                <Field label="מטבע">
                  <select name="currency" defaultValue={order.isExport ? "USD" : "ILS"}>
                    <option value="ILS">₪</option>
                    <option value="USD">$</option>
                  </select>
                </Field>
                <Field label="תאריך">
                  <input type="date" name="paidAt" defaultValue={todayIso()} />
                </Field>
                <Field label="אמצעי">
                  <select name="method" defaultValue="העברה">
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Field>
                <Field label="אסמכתא">
                  <input name="reference" dir="ltr" />
                </Field>
                <Field label="מס׳ חשבונית ירוקה">
                  <input name="greenInvoiceNumber" dir="ltr" />
                </Field>
              </div>
              <div>
                <button className="btn btn-primary" type="submit">
                  רשום תשלום
                </button>
              </div>
            </form>
          </section>

          <section>
            <SectionHead title="תשלומים שהתקבלו" latin="PAYMENTS" />
            {payments.length === 0 ? (
              <Empty>
                <p>עוד לא נרשמו תשלומים להזמנה הזו.</p>
              </Empty>
            ) : (
              <div className="panel panel-tight table-scroll">
                <table className="data">
                  <thead>
                    <tr>
                      <th>תאריך</th>
                      <th>סוג</th>
                      <th>סכום</th>
                      <th>אמצעי</th>
                      <th>אסמכתא</th>
                      <th>חשבונית</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="num muted">{date(p.paidAt)}</td>
                        <td>
                          <Badge tone={p.kind === "החזר" ? "danger" : "accent"}>{p.kind}</Badge>
                        </td>
                        <td className={`num ${p.kind === "החזר" ? "danger" : ""}`}>
                          {p.kind === "החזר" ? "−" : ""}
                          {p.currency === "USD" ? usd(p.amount) : ils(p.amount)}
                        </td>
                        <td className="muted">{p.method}</td>
                        <td className="num muted">{p.reference ?? "—"}</td>
                        <td className="num muted">{p.greenInvoiceNumber ?? "—"}</td>
                        <td style={{ width: 60 }}>
                          <form action={deletePaymentAction}>
                            <input type="hidden" name="paymentId" value={p.id} />
                            <input type="hidden" name="orderId" value={order.id} />
                            <button className="btn btn-sm btn-ghost btn-danger" type="submit">
                              מחק
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="quiet" style={{ fontSize: 12 }}>
              כל תשלום נשמר במטבע שבו התקבל, עם השער של אותו יום. חשבוניות מופקות
              בחשבונית ירוקה — כאן נשמר רק מספר האסמכתא.
            </p>
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

      <hr className="hairline" />
      <DeleteOrder
        id={order.id}
        orderNumber={order.orderNumber}
        itemCount={items.length}
        paymentCount={payments.length}
      />
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
