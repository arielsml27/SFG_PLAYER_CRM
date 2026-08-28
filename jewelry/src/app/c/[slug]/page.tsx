import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedCollectionBySlug, getSettings } from "@/lib/data";
import { costBreakdown } from "@/lib/pricing";
import { ils, usd } from "@/lib/format";
import { shareBase, collectionShareUrl, whatsappLink } from "@/lib/share";
import ShareFrame from "../../share-frame";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = await getPublishedCollectionBySlug(slug);
  if (!found) return { title: "לא נמצא" };
  return { title: `${found.collection.title} · Samuel` };
}

export default async function PublicCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = await getPublishedCollectionBySlug(slug);
  if (!found) notFound();
  const { collection, products } = found;
  const settings = await getSettings();
  const fx = settings.fxUsdIls;

  const base = shareBase(settings.publicBaseUrl);
  const url = collectionShareUrl(base, slug);
  const wa = whatsappLink(settings.whatsappNumber, `היי, ראיתי את ${collection.title}\n${url}`);

  function priceFor(p: (typeof products)[number]) {
    if (collection.priceMode === "לפנייה") return null;
    const cost = costBreakdown({ ...p, modelOn: false, modelPrice: 0 }, settings.goldSpotUsdOz);
    if (collection.priceMode === "סיטונאי") {
      return p.priceWholesaleUsd ?? p.priceRetailUsd ?? cost.totalUsd * p.multiplier;
    }
    return p.priceRetailUsd ?? cost.totalUsd * p.multiplier;
  }

  return (
    <ShareFrame settings={settings}>
      <div className="stack" style={{ alignItems: "center", textAlign: "center" }}>
        {collection.subtitle ? <div className="micro">{collection.subtitle}</div> : null}
        <h1>{collection.title}</h1>
        {collection.intro ? (
          <p className="share-lede" style={{ whiteSpace: "pre-wrap" }}>
            {collection.intro}
          </p>
        ) : null}
      </div>

      <hr className="hairline" />

      {products.length === 0 ? (
        <p className="quiet" style={{ textAlign: "center" }}>
          המבחר בהכנה.
        </p>
      ) : (
        <div className="share-grid">
          {products.map((p) => {
            const price = priceFor(p);
            const card = (
              <>
                <div className="shot">
                  {p.photoIds[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/photos/${p.photoIds[0]}`} alt={p.name} loading="lazy" />
                  ) : (
                    <span>אין תמונה</span>
                  )}
                </div>
                <div className="body">
                  <span className="nm">{p.name}</span>
                  <span className="quiet" style={{ fontSize: 12 }}>
                    זהב {p.karat} {p.metalColor}
                  </span>
                  <span className="pr">
                    {price === null ? "לפנייה" : fx ? ils(price * fx) : usd(price)}
                  </span>
                  {p.note ? (
                    <span className="quiet" style={{ fontSize: 12 }}>
                      {p.note}
                    </span>
                  ) : null}
                </div>
              </>
            );
            return p.isPublished && p.shareSlug ? (
              <Link key={p.id} href={`/p/${p.shareSlug}`} className="share-card">
                {card}
              </Link>
            ) : (
              <div key={p.id} className="share-card">
                {card}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "grid", placeItems: "center" }}>
        <a href={wa} target="_blank" rel="noreferrer" className="cta">
          לפרטים בוואטסאפ
        </a>
      </div>
    </ShareFrame>
  );
}

export const dynamic = "force-dynamic";
