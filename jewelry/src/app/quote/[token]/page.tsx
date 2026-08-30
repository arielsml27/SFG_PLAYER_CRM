import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getQuoteView } from "@/lib/data";
import { date, ils, usd } from "@/lib/format";
import { shareBase, whatsappLink } from "@/lib/share";
import { Cell, SectionHead, SpecRow } from "@/components/ui";

export const metadata: Metadata = { title: "הצעת מחיר · Samuel", robots: "noindex" };

/**
 * הצעת מחיר — המסמך שנשלח ללקוח לפני שההזמנה נפתחת בפועל.
 * אין סיסמה: הטוקן שבכתובת הוא האימות, כמו בשאר עמודי השיתוף.
 *
 * העמוד בנוי גם להדפסה ולשמירה כ-PDF (Ctrl+P), ולכן הצבעים נהפכים
 * לנייר לבן בהדפסה והמסגרות נשארות — הצעה מודפסת על רקע שחור מבזבזת
 * טונר ונראית זול.
 */
export default async function QuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const view = await getQuoteView(token);
  if (!view) notFound();

  const { order, customer, items, lines, photos, settings, totals, issuedAt, validUntil, expired } =
    view;

  const money = (u: number, i: number) => (order.isExport ? usd(u) : ils(i));
  const total = money(totals.totalUsd, totals.totalIls);
  const deposit = money(totals.depositUsd, totals.depositIls);
  const rest = money(totals.totalUsd - totals.depositUsd, totals.totalIls - totals.depositIls);

  const vatNote = order.isExport
    ? "עסקת ייצוא — פטורה ממע״מ"
    : totals.vatPct > 0
      ? `המחיר כולל מע״מ ${totals.vatPct}%`
      : "המחיר אינו כולל מע״מ";

  const terms = settings.quoteTerms.split("\n").map((t) => t.trim()).filter(Boolean);
  const half = Math.ceil(terms.length / 2);

  const url = `${shareBase(settings.publicBaseUrl)}/quote/${token}`;
  const wa = whatsappLink(
    settings.whatsappNumber,
    `היי, לגבי הצעת מחיר ${order.orderNumber}\n${url}`
  );

  return (
    <div className="share quote">
      <header className="quote-head">
        <span className="num quiet">הצעה מס׳ {order.orderNumber}</span>
        <Image
          src="/brand/samuel-logo.png"
          alt={settings.businessName}
          width={336}
          height={106}
          className="logo"
          priority
        />
        <span className="num quiet">{date(issuedAt)}</span>
      </header>

      <div className="quote-sub">
        <h1>הצעת מחיר</h1>
        <div className="stack-sm" style={{ textAlign: "start" }}>
          <span className={expired ? "danger" : "quiet"}>
            {expired ? "פג תוקף " : "בתוקף עד "}
            <span className="num">{date(validUntil)}</span>
          </span>
          <span className="quiet" style={{ fontSize: 12 }}>
            {items.length} {items.length === 1 ? "פריט" : "פריטים"}
          </span>
        </div>
      </div>

      <div className="cell-grid quote-customer">
        <Cell label="שם לקוח" value={customer?.name ?? "—"} />
        <Cell label="טלפון" value={customer?.phone ?? "—"} dir="ltr" />
        <Cell label="EMAIL" value={customer?.email ?? "—"} dir="ltr" />
      </div>

      {items.map((item, idx) => {
        const line = lines[idx];
        const spec: [string, string | null][] = [
          ["זהב", [item.karat, item.metalColor].filter(Boolean).join(" ")],
          ["משקל", item.weightG ? `${item.weightG} גרם` : null],
          ["סוג אבן", item.centerStoneType],
          ["משקל קראט", item.centerCaratTotal ? `${item.centerCaratTotal} ct` : null],
          ["חיתוך", item.centerCut],
          ["צבע", item.centerColor],
          ["ניקיון", item.centerClarity],
          ["אבני צד", item.sideStonesOn ? item.sideStoneType : null],
          ["פירוט", item.centerDesc],
          ["מידה", item.size],
          ["חריטה", item.engraving],
          ["זמן אספקה", order.promisedDate ? date(order.promisedDate) : settings.quoteLeadTime],
        ];

        return (
          <section key={item.id}>
            <SectionHead title={items.length > 1 ? item.name : "הפריט"} latin="ITEM DETAILS" />
            <div className="quote-item">
              <div className="quote-shots">
                {photos.slice(0, 2).map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.id} src={`/quote/${token}/photo/${p.id}`} alt={item.name} />
                ))}
                {/* תמיד שני ריבועים: תמונה אחת לבדה משאירה חור בפריסה */}
                {Array.from({ length: Math.max(0, 2 - photos.length) }, (_, i) => (
                  <div key={`slot-${i}`} className="slot" />
                ))}
              </div>

              <div className="stack-sm">
                {items.length > 1 ? null : <h2 className="quote-item-name">{item.name}</h2>}
                <div className="spec">
                  {spec
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <SpecRow key={k} k={k} v={v} />
                    ))}
                  {item.quantity > 1 ? <SpecRow k="כמות" v={`${item.quantity}`} /> : null}
                  {items.length > 1 ? (
                    <SpecRow
                      k="מחיר"
                      v={money(line.linePriceUsd, line.linePriceUsd * order.fxSnapshot)}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <div className="quote-totals">
        <div className="panel panel-accent quote-sum">
          <span className="micro">סה״כ לתשלום</span>
          <div className="amount num">{total}</div>
          <span className="quiet" style={{ fontSize: 12 }}>
            {vatNote}
          </span>
        </div>

        <div className="panel stack-sm quote-terms-pay">
          <SpecRow k={`מקדמה ${order.depositPct}%`} v={`${deposit} · בעת אישור ההזמנה`} />
          <SpecRow k="יתרה" v={`${rest} · לפני מסירת הפריט`} />
          <div className="hairline" />
          <span className="quiet" style={{ fontSize: 12.5 }}>
            אמצעי תשלום: {settings.quotePaymentMethods}
          </span>
        </div>
      </div>

      {terms.length ? (
        <section>
          <SectionHead title="תנאים כלליים" latin="TERMS" />
          <div className="quote-terms">
            <ul>
              {terms.slice(0, half).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <ul>
              {terms.slice(half).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <div className="quote-sign">
        <div>
          <div className="line" />
          <span className="micro">תאריך</span>
        </div>
        <div>
          <div className="line" />
          <span className="micro">חתימת הלקוח</span>
        </div>
      </div>

      {wa ? (
        <div className="row no-print" style={{ justifyContent: "center" }}>
          <a className="cta" href={wa} target="_blank" rel="noreferrer">
            יש לי שאלה על ההצעה
          </a>
        </div>
      ) : null}

      <footer className="share-foot">
        <span>{settings.businessName}</span>
        {settings.instagramHandle ? <span dir="ltr">{settings.instagramHandle}</span> : null}
        {settings.whatsappNumber ? <span dir="ltr">{settings.whatsappNumber}</span> : null}
      </footer>
    </div>
  );
}
