import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CUSTOMER_JOURNEY, getCustomerView } from "@/lib/data";
import { date, ils, usd } from "@/lib/format";
import { shareBase, whatsappLink } from "@/lib/share";
import DesignApproval from "@/components/DesignApproval";
import ShareFrame from "../../share-frame";
import { Badge, SectionHead, SpecRow } from "@/components/ui";

export const metadata: Metadata = { title: "ההזמנה שלך · Samuel", robots: "noindex" };

/**
 * עמוד הלקוח. אין סיסמה — הטוקן שבכתובת הוא האימות.
 * הלקוח רואה את מצב ההזמנה, העיצוב, ומה נשאר לשלם.
 * אין כאן עלות, רווח, ספק או מפעל.
 */
export default async function CustomerOrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const view = await getCustomerView(token);
  if (!view) notFound();
  const { order, customerName, items, photos, settings, totals, balance, stage } = view;

  const money = (u: number, i: number) => (order.isExport ? usd(u) : ils(i));
  const designPhotos = photos.filter((p) => p.kind === "עיצוב");
  const readyPhotos = photos.filter((p) => p.kind === "מוכן");

  const url = `${shareBase(settings.publicBaseUrl)}/order/${token}`;
  const wa = whatsappLink(
    settings.whatsappNumber,
    `היי, לגבי הזמנה ${order.orderNumber}\n${url}`
  );

  // כפתור האישור מופיע רק כשיש מה לאשר ועוד לא אושר
  const awaitingApproval =
    !order.designApprovedAt && designPhotos.length > 0 && stage >= 1 && stage <= 3;

  return (
    <ShareFrame settings={settings}>
      <div className="stack" style={{ alignItems: "center", textAlign: "center" }}>
        <div className="micro">הזמנה {order.orderNumber}</div>
        <h1>{customerName ? `שלום ${customerName}` : "ההזמנה שלך"}</h1>
        {order.promisedDate ? (
          <p className="share-lede">
            תאריך המסירה המשוער: <strong>{date(order.promisedDate)}</strong>
          </p>
        ) : null}
      </div>

      <hr className="hairline" />

      <div className="share-hero">
        <div className="stack">
          <SectionHead title="מה הוזמן" latin="YOUR PIECE" />
          {items.length === 0 ? (
            <p className="quiet">הפרטים בהכנה.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="panel stack-sm">
                <h3 style={{ fontSize: 18 }}>{item.name}</h3>
                <div className="spec">
                  <SpecRow k="מתכת" v={`זהב ${item.karat} ${item.metalColor}`} />
                  {item.centerStoneType ? (
                    <SpecRow k="אבן מרכזית" v={item.centerStoneType} />
                  ) : null}
                  {item.centerCaratTotal ? (
                    <SpecRow
                      k="משקל קראט"
                      v={<span className="num">{item.centerCaratTotal.toFixed(2)} ct</span>}
                    />
                  ) : null}
                  {item.centerDesc ? <SpecRow k="פירוט האבן" v={item.centerDesc} /> : null}
                  {item.sideStonesOn && item.sideCaratTotal ? (
                    <SpecRow
                      k="אבני צד"
                      v={<span className="num">{item.sideCaratTotal.toFixed(2)} ct</span>}
                    />
                  ) : null}
                  {item.size ? <SpecRow k="מידה" v={item.size} /> : null}
                  {item.engraving ? <SpecRow k="חריטה" v={item.engraving} /> : null}
                </div>
              </div>
            ))
          )}

          <SectionHead title="תשלום" latin="PAYMENT" />
          <div className="panel">
            <div className="spec">
              <SpecRow k="סה״כ" v={<span className="num">{money(totals.totalUsd, totals.totalIls)}</span>} />
              <SpecRow
                k="שולם"
                v={
                  <span className="num">
                    {money(balance.netPaidUsd, balance.netPaidUsd * order.fxSnapshot)}
                  </span>
                }
              />
              <SpecRow
                k="נותר"
                v={
                  balance.isSettled ? (
                    <span className="good">שולם במלואו</span>
                  ) : (
                    <span className="num gold">
                      {money(balance.balanceUsd, balance.balanceUsd * order.fxSnapshot)}
                    </span>
                  )
                }
              />
            </div>
          </div>
        </div>

        <div className="stack">
          <SectionHead title="מצב ההזמנה" latin="PROGRESS" />
          <div className="panel">
            <div className="journey">
              {CUSTOMER_JOURNEY.map((s, i) => (
                <div
                  key={s.key}
                  className={`stop${i < stage ? " done" : ""}${i === stage ? " current done" : ""}`}
                >
                  <span className="dot" />
                  <span className="label">{s.label}</span>
                  <span className="when">
                    {s.key === "נמסר" && order.deliveredAt ? date(order.deliveredAt) : ""}
                  </span>
                </div>
              ))}
            </div>
            {order.designApprovedAt ? (
              <>
                <hr className="hairline" style={{ margin: "14px 0 10px" }} />
                <p className="quiet" style={{ fontSize: 12.5 }}>
                  העיצוב אושר על ידך ב-{date(order.designApprovedAt)}.
                </p>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {designPhotos.length > 0 ? (
        <section>
          <SectionHead title="העיצוב" latin="DESIGN" />
          <div className="gallery">
            {designPhotos.map((p, i) => (
              <figure key={p.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/order/${token}/photo/${p.id}`} alt={`עיצוב ${i + 1}`} />
                {p.caption ? <figcaption>{p.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {awaitingApproval ? <DesignApproval token={token} /> : null}

      {readyPhotos.length > 0 ? (
        <section>
          <SectionHead title="הפריט המוגמר" latin="FINISHED" />
          <div className="gallery">
            {readyPhotos.map((p, i) => (
              <figure key={p.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/order/${token}/photo/${p.id}`} alt={`מוגמר ${i + 1}`} />
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <div style={{ display: "grid", placeItems: "center", gap: "var(--space-3)" }}>
        <a href={wa} target="_blank" rel="noreferrer" className="cta">
          שאלה? דברו איתנו
        </a>
        <Badge>הקישור הזה אישי להזמנה שלך</Badge>
      </div>
    </ShareFrame>
  );
}

export const dynamic = "force-dynamic";
