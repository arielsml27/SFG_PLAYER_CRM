import { notFound } from "next/navigation";
import { getOrder, getSettings } from "@/lib/data";
import { saveOrderItemAction } from "@/lib/actions";
import ItemForm from "@/components/ItemForm";
import { PageHead } from "@/components/ui";

/** itemId === "new" פותח פריט חדש; אחרת עורכים פריט קיים. */
export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = await params;
  const full = await getOrder(id);
  if (!full) notFound();

  const settings = await getSettings();
  const isNew = itemId === "new";
  const item = isNew ? undefined : full.items.find((i) => i.id === itemId);
  if (!isNew && !item) notFound();

  return (
    <>
      <PageHead
        title={isNew ? "פריט חדש" : `עריכת ${item!.name}`}
        sub={`הזמנה ${full.order.orderNumber} · ${full.customer?.name ?? ""}`}
      />
      <ItemForm
        orderId={id}
        item={item}
        goldSpotUsdOz={full.order.goldSpotSnapshot}
        fx={full.order.fxSnapshot}
        defaultMultiplier={settings.defaultMultiplier}
        action={saveOrderItemAction}
      />
    </>
  );
}
