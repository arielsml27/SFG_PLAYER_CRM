import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFactoryView } from "@/lib/data";
import { date, dateTime, grams } from "@/lib/format";
import FactoryUpdateForm from "@/components/FactoryUpdateForm";
import ShareFrame from "../../share-frame";
import { Badge, SectionHead, SpecRow } from "@/components/ui";
import { workOrderTone } from "@/lib/constants";

export const metadata: Metadata = { title: "הזמנת עבודה · Samuel", robots: "noindex" };

/**
 * פורטל המפעל. אין סיסמה — הטוקן שבכתובת הוא האימות.
 * המפעל רואה מפרט טכני בלבד: אין כאן שם לקוח, מחיר או רווח.
 */
export default async function FactoryPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const view = await getFactoryView(token);
  if (!view) notFound();
  const { workOrder: wo, supplier, item, updates, photos, settings } = view;

  const mine = photos.filter((p) => p.author === "אני");
  const theirs = photos.filter((p) => p.author === "מפעל");

  return (
    <ShareFrame settings={settings}>
      <div className="stack" style={{ alignItems: "center", textAlign: "center" }}>
        <div className="micro">הזמנת עבודה</div>
        <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.1rem)" }}>{wo.woNumber}</h1>
        <div className="row" style={{ justifyContent: "center" }}>
          <Badge tone={workOrderTone(wo.status)}>{wo.status}</Badge>
          <Badge>{wo.scope}</Badge>
          {supplier ? <Badge>{supplier.name}</Badge> : null}
        </div>
      </div>

      <hr className="hairline" />

      <section>
        <SectionHead title="מה מבקשים" latin="THE JOB" />
        <div className="panel">
          <div className="spec">
            <SpecRow k="עבודה" v={wo.scope} />
            <SpecRow k="תאריך יעד" v={date(wo.dueDate)} />
            {wo.factoryEta ? <SpecRow k="ההתחייבות שלכם" v={date(wo.factoryEta)} /> : null}
            <SpecRow
              k="זהב שנשלח"
              v={wo.metalSentG ? <span className="num">{grams(wo.metalSentG)}</span> : "—"}
            />
          </div>
          {wo.instructions ? (
            <>
              <hr className="hairline" style={{ margin: "14px 0" }} />
              <p style={{ whiteSpace: "pre-wrap", fontSize: 14.5, lineHeight: 1.75 }}>
                {wo.instructions}
              </p>
            </>
          ) : null}
        </div>
      </section>

      {item ? (
        <section>
          <SectionHead title="מפרט הפריט" latin="SPEC" />
          <div className="panel">
            <div className="spec">
              <SpecRow k="פריט" v={item.name} />
              <SpecRow k="סוג" v={item.category} />
              <SpecRow k="מתכת" v={`זהב ${item.karat} ${item.metalColor}`} />
              {item.weightG ? (
                <SpecRow k="משקל מתוכנן" v={<span className="num">{grams(item.weightG)}</span>} />
              ) : null}
              {item.size ? <SpecRow k="מידה" v={item.size} /> : null}
              {item.centerStoneType ? (
                <SpecRow k="אבן מרכזית" v={item.centerStoneType} />
              ) : null}
              {item.centerCaratTotal ? (
                <SpecRow
                  k="קראט מרכזית"
                  v={<span className="num">{item.centerCaratTotal.toFixed(2)} ct</span>}
                />
              ) : null}
              {item.centerDesc ? <SpecRow k="פירוט האבן" v={item.centerDesc} /> : null}
              {item.sideStonesOn ? (
                <SpecRow
                  k="אבני צד"
                  v={
                    <span className="num">
                      {item.sideCaratTotal.toFixed(2)} ct
                      {item.sideSettingQty ? ` · ${item.sideSettingQty} אבנים` : ""}
                    </span>
                  }
                />
              ) : null}
              {item.engraving ? <SpecRow k="חריטה" v={item.engraving} /> : null}
            </div>
          </div>
        </section>
      ) : null}

      {mine.length > 0 ? (
        <section>
          <SectionHead title="סקיצות ותמונות ייחוס" latin="REFERENCE" />
          <div className="gallery">
            {mine.map((p, i) => (
              <figure key={p.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/factory/${token}/photo/${p.id}`} alt={`ייחוס ${i + 1}`} />
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <SectionHead title="עדכון התקדמות" latin="UPDATE" />
        <div className="panel">
          <FactoryUpdateForm
            token={token}
            currentStatus={wo.status}
            currentEta={wo.factoryEta}
          />
        </div>
      </section>

      {theirs.length > 0 ? (
        <section>
          <SectionHead title="תמונות שהעליתם" latin="PROGRESS" />
          <div className="gallery">
            {theirs.map((p, i) => (
              <figure key={p.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/factory/${token}/photo/${p.id}`} alt={`התקדמות ${i + 1}`} />
                <figcaption>
                  <span>{date(p.createdAt)}</span>
                  <span>{i + 1}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <SectionHead title="יומן" latin="HISTORY" />
        <div className="panel">
          {updates.length === 0 ? (
            <p className="quiet" style={{ fontSize: 13 }}>
              עוד אין עדכונים.
            </p>
          ) : (
            <div className="spec">
              {updates.map((u) => (
                <div key={u.id} className="spec-row">
                  <span className="k" style={{ whiteSpace: "normal" }}>
                    <Badge tone={u.author === "מפעל" ? "accent" : "quiet"}>{u.author}</Badge>{" "}
                    {u.status ? <strong style={{ color: "var(--ink-1)" }}>{u.status}</strong> : null}
                    {u.eta ? <span className="quiet"> · יעד {date(u.eta)}</span> : null}
                    {u.body ? <span className="quiet"> · {u.body}</span> : null}
                  </span>
                  <span className="v num quiet">{dateTime(u.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <p className="quiet" style={{ fontSize: 12, textAlign: "center" }}>
        הקישור הזה אישי להזמנת העבודה הזו. אין צורך בסיסמה.
      </p>
    </ShareFrame>
  );
}

export const dynamic = "force-dynamic";
