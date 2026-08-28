import ItemPage from "../[itemId]/page";

/** "פריט חדש" הוא אותו מסך בדיוק, עם itemId = "new". */
export default function NewItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ productId?: string }>;
}) {
  return (
    <ItemPage
      params={params.then((p) => ({ ...p, itemId: "new" }))}
      searchParams={searchParams}
    />
  );
}
