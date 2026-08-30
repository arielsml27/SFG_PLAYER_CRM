import Link from "next/link";
import { getSettings, listProducts } from "@/lib/data";
import { ITEM_CATEGORIES } from "@/lib/constants";
import { costBreakdown } from "@/lib/pricing";
import { ils, usd } from "@/lib/format";
import { Badge, Empty, PageHead, SectionHead } from "@/components/ui";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const [products, settings] = await Promise.all([listProducts({ q, category }), getSettings()]);
  const withPhotos = products.filter((p) => p.photoIds.length > 0).length;

  // הקטלוג מוצג לפי נושאים, בסדר הקבוע של הקטגוריות. קטגוריה שאין בה
  // דגמים לא מוצגת, וקטגוריה שאינה ברשימה נופלת לסוף במקום להיעלם.
  const order = new Map(ITEM_CATEGORIES.map((c, i) => [c as string, i]));
  const byCategory = new Map<string, typeof products>();
  for (const p of products) {
    const list = byCategory.get(p.category);
    if (list) list.push(p);
    else byCategory.set(p.category, [p]);
  }
  const groups = [...byCategory.entries()].sort(
    (a, b) => (order.get(a[0]) ?? ITEM_CATEGORIES.length) - (order.get(b[0]) ?? ITEM_CATEGORIES.length)
  );

  return (
    <>
      <PageHead
        title="קטלוג"
        sub={`${products.length} דגמים · ${withPhotos} עם תמונות`}
      >
        <form className="row" style={{ gap: 6 }}>
          <input name="q" defaultValue={q ?? ""} placeholder="שם או מק״ט…" style={{ width: 170 }} />
          <select name="category" defaultValue={category ?? "הכל"} style={{ width: 130 }}>
            <option>הכל</option>
            {ITEM_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button className="btn btn-sm" type="submit">
            סינון
          </button>
        </form>
        <Link href="/catalog/new" className="btn btn-primary">
          דגם חדש
        </Link>
      </PageHead>

      {products.length === 0 ? (
        <>
          <Empty>
            <p>{q || category ? "אין דגמים שמתאימים לסינון." : "הקטלוג ריק — וזו נקודת ההתחלה."}</p>
            <Link href="/catalog/new" className="btn btn-primary btn-sm">
              הוסף דגם ראשון
            </Link>
          </Empty>

          {!q && !category ? (
            <section>
              <SectionHead title="שתי דרכים למלא אותו" latin="HOW TO FILL IT" />
              <div className="grid-cards">
                <div className="panel panel-tight stack-sm">
                  <span className="micro">הדרך המהירה</span>
                  <p style={{ fontSize: 13.5 }}>
                    כל פריט שאתה מתמחר בהזמנה אפשר לשמור כדגם בלחיצה — כפתור{" "}
                    <strong>״שמור כדגם״</strong> בעמוד ההזמנה. המפרט והתמחור עוברים כמו שהם,
                    ואתה רק מוסיף תמונות אחרי המסירה.
                  </p>
                </div>
                <div className="panel panel-tight stack-sm">
                  <span className="micro">הדרך הישירה</span>
                  <p style={{ fontSize: 13.5 }}>
                    פותחים דגם חדש, ממלאים מפרט, ומעלים תמונות מהטלפון. התמונות מוקטנות
                    בדפדפן ונשמרות בתוך <code>jewelry.db</code> — הגיבוי נשאר קובץ אחד.
                  </p>
                </div>
              </div>
            </section>
          ) : null}
        </>
      ) : (
        groups.map(([groupName, groupProducts]) => (
          <section key={groupName}>
            <SectionHead
              title={groupName}
              latin={`${groupProducts.length} ${groupProducts.length === 1 ? "דגם" : "דגמים"}`}
            />
            <div className="product-grid">
              {groupProducts.map((p) => {
                const cost = costBreakdown(
                  { ...p, modelOn: false, modelPrice: 0 },
                  settings.goldSpotUsdOz
                );
                const price = p.priceRetailUsd ?? cost.totalUsd * p.multiplier;
                return (
                  <Link key={p.id} href={`/catalog/${p.id}`} className="product-card">
                    <div className="shot">
                      {p.photoIds[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/photos/${p.photoIds[0]}`} alt={p.name} loading="lazy" />
                      ) : (
                        <span className="none">אין תמונה</span>
                      )}
                    </div>
                    <div className="body">
                      <span className="nm">{p.name}</span>
                      <span className="num quiet" style={{ fontSize: 11 }}>
                        {p.sku}
                      </span>
                      <div className="row" style={{ gap: 5 }}>
                        <Badge tone="accent">{p.karat}</Badge>
                        {p.photoIds.length > 1 ? <Badge>{p.photoIds.length} תמונות</Badge> : null}
                        {!p.isAvailable ? <Badge tone="warn">לא זמין</Badge> : null}
                      </div>
                      <div className="row" style={{ justifyContent: "space-between", marginTop: 2 }}>
                        <span className="num" style={{ fontSize: 14 }}>
                          {settings.fxUsdIls ? ils(price * settings.fxUsdIls) : usd(price)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))
      )}
    </>
  );
}
