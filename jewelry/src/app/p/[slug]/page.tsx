import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedProductBySlug, getSettings } from "@/lib/data";
import { costBreakdown } from "@/lib/pricing";
import { ils, usd } from "@/lib/format";
import { shareBase, productShareUrl, whatsappLink } from "@/lib/share";
import Gallery from "@/components/Gallery";
import { SpecRow } from "@/components/ui";
import ShareFrame from "../../share-frame";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = await getPublishedProductBySlug(slug);
  if (!found) return { title: "לא נמצא" };
  return {
    title: `${found.product.name} · Samuel`,
    description: found.product.description ?? undefined,
  };
}

export default async function PublicProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = await getPublishedProductBySlug(slug);
  if (!found) notFound();
  const { product, photoIds } = found;
  const settings = await getSettings();

  const cost = costBreakdown({ ...product, modelOn: false, modelPrice: 0 }, settings.goldSpotUsdOz);
  const priceUsd = product.priceRetailUsd ?? cost.totalUsd * product.multiplier;
  const fx = settings.fxUsdIls;
  const showPrice = product.sharePriceMode === "מחיר";

  const base = shareBase(settings.publicBaseUrl);
  const url = productShareUrl(base, slug);
  const wa = whatsappLink(
    settings.whatsappNumber,
    `היי, מעניין אותי ${product.name} (${product.sku})\n${url}`
  );

  return (
    <ShareFrame settings={settings}>
      <div className="share-hero">
        <Gallery photoIds={photoIds} alt={product.name} />

        <div className="stack">
          <div>
            <div className="micro">{product.category}</div>
            <h1 style={{ marginTop: 6 }}>{product.name}</h1>
          </div>

          {product.description ? (
            <p className="share-lede" style={{ whiteSpace: "pre-wrap" }}>
              {product.description}
            </p>
          ) : null}

          <div className="price-block">
            {showPrice ? (
              <>
                <span className="micro">מחיר</span>
                <span className="amount">{fx ? ils(priceUsd * fx) : usd(priceUsd)}</span>
                <span className="quiet" style={{ fontSize: 11.5 }}>
                  המחיר אינו כולל מע״מ
                </span>
              </>
            ) : (
              <>
                <span className="micro">מחיר</span>
                <span className="ask">לפנייה</span>
              </>
            )}
          </div>

          <div className="spec">
            <SpecRow k="מתכת" v={`זהב ${product.karat} ${product.metalColor}`} />
            {product.centerStoneType ? (
              <SpecRow k="אבן מרכזית" v={product.centerStoneType} />
            ) : null}
            {product.centerCaratTotal ? (
              <SpecRow
                k="משקל קראט"
                v={<span className="num">{product.centerCaratTotal.toFixed(2)} ct</span>}
              />
            ) : null}
            {product.centerDesc ? <SpecRow k="פירוט האבן" v={product.centerDesc} /> : null}
            {product.sideStonesOn && product.sideCaratTotal ? (
              <SpecRow
                k="אבני צד"
                v={<span className="num">{product.sideCaratTotal.toFixed(2)} ct</span>}
              />
            ) : null}
            <SpecRow k="זמינות" v={product.isAvailable ? "בהזמנה" : "לא זמין כרגע"} />
          </div>

          <a href={wa} target="_blank" rel="noreferrer" className="cta">
            לפרטים בוואטסאפ
          </a>
        </div>
      </div>
    </ShareFrame>
  );
}

export const dynamic = "force-dynamic";
