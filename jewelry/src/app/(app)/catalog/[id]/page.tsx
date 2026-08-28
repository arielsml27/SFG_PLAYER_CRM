import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProductUsage, getSettings, listOrders } from "@/lib/data";
import {
  deletePhotoAction,
  deleteProductAction,
  makePrimaryPhotoAction,
  setProductPriceModeAction,
  toggleProductPublishAction,
} from "@/lib/product-actions";
import ShareBox from "@/components/ShareBox";
import { shareBase, productShareUrl, whatsappLink } from "@/lib/share";
import PhotoUploader from "@/components/PhotoUploader";
import { costBreakdown, marginPctFromMultiplier } from "@/lib/pricing";
import { date, ils, pct, usd } from "@/lib/format";
import { Badge, Cell, Empty, Field, PageHead, SectionHead, StatusBadge } from "@/components/ui";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await getProduct(id);
  if (!found) notFound();
  const { product, photos } = found;

  const [settings, usage, openOrders] = await Promise.all([
    getSettings(),
    getProductUsage(id),
    listOrders(),
  ]);

  const cost = costBreakdown({ ...product, modelOn: false, modelPrice: 0 }, settings.goldSpotUsdOz);
  const price = product.priceRetailUsd ?? cost.totalUsd * product.multiplier;
  const margin = price ? ((price - cost.totalUsd) / price) * 100 : 0;
  const fx = settings.fxUsdIls;
  const shareUrl = productShareUrl(shareBase(settings.publicBaseUrl), product.shareSlug ?? "");
  const totalKb = Math.round(photos.reduce((a, p) => a + p.bytes, 0) / 1024);

  // הזמנות פתוחות, כדי להוסיף את הדגם לאחת מהן ישירות מכאן
  const addable = openOrders.filter((o) => o.status !== "סגור" && o.status !== "בוטל").slice(0, 12);

  return (
    <>
      <PageHead title={product.name} sub={`${product.sku} · ${product.category}`}>
        {product.isPublished ? <Badge tone="good">מפורסם</Badge> : <Badge>לא מפורסם</Badge>}
        <Link href={`/catalog/${product.id}/edit`} className="btn btn-primary btn-sm">
          עריכה
        </Link>
      </PageHead>

      <div className="cell-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
        <Cell label="מתכת" value={`${product.karat} ${product.metalColor}`} />
        <Cell label="משקל" value={<span className="num">{product.weightG.toFixed(2)} גר׳</span>} />
        <Cell label="עלות" value={<span className="num">{fx ? ils(cost.totalUsd * fx) : usd(cost.totalUsd)}</span>} />
        <Cell label="מחיר" value={<span className="num">{fx ? ils(price * fx) : usd(price)}</span>} />
        <Cell label="רווח" value={<span className="num good">{pct(margin)}</span>} />
        <Cell label="נמכר" value={<span className="num">{usage.length}</span>} />
      </div>

      {product.description ? (
        <div className="panel" style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>
          {product.description}
        </div>
      ) : null}

      {/* ---------- תמונות ---------- */}
      <section>
        <SectionHead title="תמונות" latin="PHOTOS" />
        <div className="panel stack">
          {photos.length === 0 ? (
            <p className="quiet" style={{ fontSize: 13 }}>
              עוד אין תמונות לדגם הזה. התמונה הראשונה היא זו שתופיע בקטלוג.
            </p>
          ) : (
            <>
              <div className="gallery">
                {photos.map((photo, i) => (
                  <figure key={photo.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/photos/${photo.id}`} alt={`${product.name} ${i + 1}`} />
                    <figcaption>
                      <span>{i === 0 ? "ראשית" : `${Math.round(photo.bytes / 1024)}KB`}</span>
                      <span className="row" style={{ gap: 4 }}>
                        {i > 0 ? (
                          <form action={makePrimaryPhotoAction}>
                            <input type="hidden" name="photoId" value={photo.id} />
                            <input type="hidden" name="productId" value={product.id} />
                            <button className="btn btn-sm btn-ghost" style={{ padding: "1px 7px", fontSize: 11 }}>
                              ראשית
                            </button>
                          </form>
                        ) : null}
                        <form action={deletePhotoAction}>
                          <input type="hidden" name="photoId" value={photo.id} />
                          <input type="hidden" name="productId" value={product.id} />
                          <button className="btn btn-sm btn-ghost btn-danger" style={{ padding: "1px 7px", fontSize: 11 }}>
                            מחק
                          </button>
                        </form>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <p className="quiet" style={{ fontSize: 12 }}>
                {photos.length} תמונות · {totalKb}KB בתוך קובץ המערכת
              </p>
            </>
          )}

          <hr className="hairline" style={{ margin: "4px 0" }} />
          <PhotoUploader productId={product.id} />
        </div>
      </section>

      {/* ---------- שיתוף ---------- */}
      <section>
        <SectionHead title="שיתוף" latin="SHARE" />
        <div className="panel stack">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <form action={toggleProductPublishAction}>
              <input type="hidden" name="id" value={product.id} />
              <button
                className={product.isPublished ? "btn btn-sm" : "btn btn-sm btn-primary"}
                type="submit"
              >
                {product.isPublished ? "בטל פרסום" : "פרסם דגם"}
              </button>
            </form>

            <form action={setProductPriceModeAction} className="row" style={{ gap: 6 }}>
              <input type="hidden" name="id" value={product.id} />
              <div style={{ minWidth: 150 }}>
                <Field label="מה הלקוח רואה">
                  <select name="sharePriceMode" defaultValue={product.sharePriceMode}>
                    <option>מחיר</option>
                    <option>לפנייה</option>
                  </select>
                </Field>
              </div>
              <button className="btn btn-sm" type="submit">
                עדכן
              </button>
            </form>
          </div>

          {product.isPublished && product.shareSlug ? (
            <ShareBox
              url={shareUrl}
              whatsappHref={whatsappLink(
                settings.whatsappNumber,
                `${product.name}\n${shareUrl}`
              )}
              hint={
                settings.publicBaseUrl
                  ? undefined
                  : "לא הוגדרה כתובת בסיס בהגדרות — הלינק מצביע על המחשב הזה בלבד."
              }
            />
          ) : (
            <p className="quiet" style={{ fontSize: 13 }}>
              הדגם עוד לא מפורסם. אחרי פרסום יתקבל לינק קבוע שאפשר לשלוח בוואטסאפ.
            </p>
          )}
        </div>
      </section>

      {/* ---------- פירוק עלות ---------- */}
      <section>
        <SectionHead title="תמחור לפי שערי היום" latin="PRICING" />
        <div className="panel panel-accent">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "var(--space-5)",
            }}
          >
            <div className="spec">
              <Line k="זהב" v={cost.gold} fx={fx} />
              <Line k="אבן מרכזית" v={cost.centerStone} fx={fx} />
              {product.sideStonesOn ? <Line k="אבני צד" v={cost.sideStone} fx={fx} /> : null}
              <Line k="עבודת צורף" v={cost.goldsmith} fx={fx} />
              <Line k="שיבוץ" v={cost.centerSetting + cost.sideSetting} fx={fx} />
              <Line k="גימור ואריזה" v={cost.finishing} fx={fx} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="micro">מחיר לפני מע״מ</div>
              <div className="figure">{fx ? ils(price * fx) : usd(price)}</div>
              <div className="quiet" style={{ fontSize: 12, marginTop: 6 }}>
                {product.priceRetailUsd
                  ? "מחיר קבוע"
                  : `×${product.multiplier} · רווח ${pct(marginPctFromMultiplier(product.multiplier), 0)}`}
              </div>
              {product.priceWholesaleUsd ? (
                <div className="gold" style={{ fontSize: 12, marginTop: 4 }}>
                  סיטונאי {fx ? ils(product.priceWholesaleUsd * fx) : usd(product.priceWholesaleUsd)}
                </div>
              ) : null}
            </div>
          </div>
          <p className="quiet" style={{ fontSize: 12, marginTop: 12 }}>
            המחיר מחושב לפי שערי היום. בהזמנה בפועל ייעשה חישוב לפי השערים שננעלו עליה.
          </p>
        </div>
      </section>

      {/* ---------- הוספה להזמנה ---------- */}
      <section>
        <SectionHead title="הוסף להזמנה" latin="ADD TO ORDER" />
        {addable.length === 0 ? (
          <Empty>
            <p>אין הזמנות פתוחות.</p>
            <Link href="/orders/new" className="btn btn-primary btn-sm">
              פתח הזמנה
            </Link>
          </Empty>
        ) : (
          <div className="panel row" style={{ gap: 8 }}>
            {addable.map((o) => (
              <Link
                key={o.id}
                href={`/orders/${o.id}/items/new?productId=${product.id}`}
                className="btn btn-sm"
              >
                {o.orderNumber} · {o.customerName}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ---------- היכן שימש ---------- */}
      {usage.length > 0 ? (
        <section>
          <SectionHead title="הזמנות עם הדגם" latin="USED IN" />
          <div className="panel panel-tight table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>מס׳</th>
                  <th>לקוח</th>
                  <th>סטטוס</th>
                  <th>נפתחה</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((u) => (
                  <tr key={u.orderId} className="link-row">
                    <td className="num">
                      <Link href={`/orders/${u.orderId}`}>{u.orderNumber}</Link>
                    </td>
                    <td className="name">{u.customerName}</td>
                    <td>
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="num quiet">{date(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {product.notes ? (
        <section>
          <SectionHead title="הערות" latin="NOTES" />
          <div className="panel" style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>
            {product.notes}
          </div>
        </section>
      ) : null}

      <hr className="hairline" />
      <form action={deleteProductAction} className="row">
        <input type="hidden" name="id" value={product.id} />
        <button className="btn btn-ghost btn-sm btn-danger" type="submit">
          מחיקת הדגם
        </button>
        <span className="quiet" style={{ fontSize: 12 }}>
          התמונות יימחקו איתו. הזמנות קיימות לא ייפגעו.
        </span>
      </form>
    </>
  );
}

function Line({ k, v, fx }: { k: string; v: number; fx: number }) {
  return (
    <div className="spec-row">
      <span className="k">{k}</span>
      <span className="v num">{fx ? ils(v * fx) : usd(v)}</span>
    </div>
  );
}

export const dynamic = "force-dynamic";
