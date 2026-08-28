import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollection, getSettings, listCustomers, listProducts } from "@/lib/data";
import {
  addToCollectionAction,
  deleteCollectionAction,
  removeFromCollectionAction,
  toggleCollectionPublishAction,
  updateCollectionAction,
} from "@/lib/product-actions";
import ShareBox from "@/components/ShareBox";
import { collectionShareUrl, shareBase, whatsappLink } from "@/lib/share";
import { costBreakdown } from "@/lib/pricing";
import { ils, usd } from "@/lib/format";
import { Badge, Empty, Field, PageHead, SectionHead } from "@/components/ui";

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await getCollection(id);
  if (!found) notFound();
  const { collection, products } = found;

  const [settings, customers, catalog] = await Promise.all([
    getSettings(),
    listCustomers(),
    listProducts(),
  ]);
  const fx = settings.fxUsdIls;
  const shareUrl = collectionShareUrl(shareBase(settings.publicBaseUrl), collection.slug);
  const inCollection = new Set(products.map((p) => p.id));
  const addable = catalog.filter((p) => !inCollection.has(p.id));

  return (
    <>
      <PageHead
        title={collection.title}
        sub={`${products.length} דגמים · מחירים: ${collection.priceMode}`}
      >
        {collection.isPublished ? <Badge tone="good">מפורסמת</Badge> : <Badge>טיוטה</Badge>}
        <form action={toggleCollectionPublishAction}>
          <input type="hidden" name="id" value={collection.id} />
          <button
            className={collection.isPublished ? "btn btn-sm" : "btn btn-sm btn-primary"}
            type="submit"
          >
            {collection.isPublished ? "בטל פרסום" : "פרסם"}
          </button>
        </form>
      </PageHead>

      <section>
        <SectionHead title="שיתוף" latin="SHARE" />
        <div className="panel">
          {collection.isPublished ? (
            <ShareBox
              url={shareUrl}
              whatsappHref={whatsappLink(
                settings.whatsappNumber,
                `${collection.title}\n${shareUrl}`
              )}
              hint={
                settings.publicBaseUrl
                  ? undefined
                  : "לא הוגדרה כתובת בסיס בהגדרות — הלינק מצביע על המחשב הזה בלבד."
              }
            />
          ) : (
            <p className="quiet" style={{ fontSize: 13 }}>
              הקולקציה בטיוטה. פרסם אותה כדי לקבל לינק לשליחה.
            </p>
          )}
        </div>
      </section>

      <section>
        <SectionHead title="הדגמים במבחר" latin="ITEMS" />
        {products.length === 0 ? (
          <Empty>
            <p>המבחר ריק. הוסף דגמים מהרשימה למטה.</p>
          </Empty>
        ) : (
          <div className="product-grid">
            {products.map((p) => {
              const cost = costBreakdown(
                { ...p, modelOn: false, modelPrice: 0 },
                settings.goldSpotUsdOz
              );
              const price = p.priceRetailUsd ?? cost.totalUsd * p.multiplier;
              return (
                <div key={p.itemId} className="product-card">
                  <Link href={`/catalog/${p.id}`} className="shot">
                    {p.photoIds[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/photos/${p.photoIds[0]}`} alt={p.name} loading="lazy" />
                    ) : (
                      <span className="none">אין תמונה</span>
                    )}
                  </Link>
                  <div className="body">
                    <span className="nm">{p.name}</span>
                    <span className="num quiet" style={{ fontSize: 11 }}>
                      {p.sku}
                    </span>
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <span className="num" style={{ fontSize: 13.5 }}>
                        {fx ? ils(price * fx) : usd(price)}
                      </span>
                      <form action={removeFromCollectionAction}>
                        <input type="hidden" name="itemId" value={p.itemId} />
                        <input type="hidden" name="collectionId" value={collection.id} />
                        <button
                          className="btn btn-sm btn-ghost btn-danger"
                          style={{ padding: "2px 8px", fontSize: 11.5 }}
                        >
                          הסר
                        </button>
                      </form>
                    </div>
                    {!p.photoIds.length ? <Badge tone="warn">בלי תמונה</Badge> : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionHead title="הוסף למבחר" latin="ADD" />
        {addable.length === 0 ? (
          <p className="quiet" style={{ fontSize: 13 }}>
            כל הדגמים בקטלוג כבר במבחר.
          </p>
        ) : (
          <div className="panel row" style={{ gap: 8 }}>
            {addable.map((p) => (
              <form key={p.id} action={addToCollectionAction}>
                <input type="hidden" name="collectionId" value={collection.id} />
                <input type="hidden" name="productId" value={p.id} />
                <button className="btn btn-sm" type="submit">
                  {p.name}
                  {p.photoIds.length ? "" : " (בלי תמונה)"}
                </button>
              </form>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHead title="עריכה" latin="EDIT" />
        <form action={updateCollectionAction} className="panel stack">
          <input type="hidden" name="id" value={collection.id} />
          <div className="form-grid">
            <Field label="שם">
              <input name="title" defaultValue={collection.title} required />
            </Field>
            <Field label="כותרת משנה">
              <input name="subtitle" defaultValue={collection.subtitle ?? ""} />
            </Field>
            <Field label="ללקוח">
              <select name="customerId" defaultValue={collection.customerId ?? ""}>
                <option value="">—</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="מחירים">
              <select name="priceMode" defaultValue={collection.priceMode}>
                <option>מחיר</option>
                <option>סיטונאי</option>
                <option>לפנייה</option>
              </select>
            </Field>
          </div>
          <Field label="פתיח">
            <textarea name="intro" defaultValue={collection.intro ?? ""} />
          </Field>
          <div>
            <button className="btn btn-primary" type="submit">
              שמור
            </button>
          </div>
        </form>
      </section>

      <hr className="hairline" />
      <form action={deleteCollectionAction}>
        <input type="hidden" name="id" value={collection.id} />
        <button className="btn btn-ghost btn-sm btn-danger" type="submit">
          מחיקת הקולקציה
        </button>
      </form>
    </>
  );
}

export const dynamic = "force-dynamic";
