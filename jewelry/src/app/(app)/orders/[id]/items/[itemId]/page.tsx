import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, getProduct, getSettings, listProducts } from "@/lib/data";
import { saveOrderItemAction } from "@/lib/actions";
import ItemForm, { type ItemSeed } from "@/components/ItemForm";
import { Field, PageHead } from "@/components/ui";

/** itemId === "new" פותח פריט חדש; אחרת עורכים פריט קיים. */
export default async function ItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; itemId: string }>;
  searchParams?: Promise<{ productId?: string }>;
}) {
  const { id, itemId } = await params;
  const { productId } = (await searchParams) ?? {};
  const full = await getOrder(id);
  if (!full) notFound();

  const settings = await getSettings();
  const isNew = itemId === "new";
  const item = isNew ? undefined : full.items.find((i) => i.id === itemId);
  if (!isNew && !item) notFound();

  // טעינת מפרט מדגם בקטלוג
  let seed: ItemSeed | undefined;
  let seedName: string | undefined;
  if (isNew && productId) {
    const found = await getProduct(productId);
    if (found) {
      const p = found.product;
      seedName = `${p.name} · ${p.sku}`;
      seed = {
        productId: p.id,
        name: p.name,
        category: p.category,
        karat: p.karat,
        metalColor: p.metalColor,
        weightG: p.weightG,
        centerStoneType: p.centerStoneType,
        centerDesc: p.centerDesc,
        centerPricePerCt: p.centerPricePerCt,
        centerCaratTotal: p.centerCaratTotal,
        sideStonesOn: p.sideStonesOn,
        sideStoneType: p.sideStoneType,
        sidePricePerCt: p.sidePricePerCt,
        sideCaratTotal: p.sideCaratTotal,
        goldsmithCost: p.goldsmithCost,
        centerSettingPrice: p.centerSettingPrice,
        centerSettingQty: p.centerSettingQty,
        sideSettingPrice: p.sideSettingPrice,
        sideSettingQty: p.sideSettingQty,
        rhodiumCost: p.rhodiumCost,
        boxCost: p.boxCost,
        bagCost: p.bagCost,
        packagingCost: p.packagingCost,
        multiplier: p.multiplier,
      };
    }
  }

  const catalog = isNew ? await listProducts() : [];

  return (
    <>
      <PageHead
        title={isNew ? "פריט חדש" : `עריכת ${item!.name}`}
        sub={`הזמנה ${full.order.orderNumber} · ${full.customer?.name ?? ""}`}
      />

      {isNew && catalog.length > 0 ? (
        <form className="panel row" style={{ alignItems: "flex-end" }}>
          <div style={{ flex: "2 1 240px" }}>
            <Field label="טען מפרט מדגם בקטלוג" hint="ממלא את כל השדות; אפשר לשנות אחר כך">
              <select name="productId" defaultValue={productId ?? ""}>
                <option value="">— מפרט ריק —</option>
                {catalog.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.sku}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <button className="btn btn-sm" type="submit">
            טען
          </button>
          {seedName ? (
            <span className="gold" style={{ fontSize: 13 }}>
              נטען: {seedName}
            </span>
          ) : null}
        </form>
      ) : null}

      {isNew && catalog.length === 0 ? (
        <p className="quiet" style={{ fontSize: 12.5 }}>
          הקטלוג עדיין ריק. אחרי שתשמור את הפריט תוכל לשמור אותו כדגם ולהשתמש בו שוב —{" "}
          <Link href="/catalog" className="gold" style={{ textDecoration: "underline" }}>
            הקטלוג
          </Link>
          .
        </p>
      ) : null}

      <ItemForm
        orderId={id}
        item={item}
        seed={seed}
        goldSpotUsdOz={full.order.goldSpotSnapshot}
        fx={full.order.fxSnapshot}
        defaultMultiplier={settings.defaultMultiplier}
        defaultKarat={settings.defaultKarat}
        action={saveOrderItemAction}
      />
    </>
  );
}
