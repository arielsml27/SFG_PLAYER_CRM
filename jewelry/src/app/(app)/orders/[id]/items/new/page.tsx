import ItemPage from "../[itemId]/page";

/** "פריט חדש" הוא אותו מסך בדיוק, עם itemId = "new". */
export default function NewItemPage({ params }: { params: Promise<{ id: string }> }) {
  return <ItemPage params={params.then((p) => ({ ...p, itemId: "new" }))} />;
}
