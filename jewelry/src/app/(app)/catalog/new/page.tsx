import { getSettings } from "@/lib/data";
import { createProductAction } from "@/lib/product-actions";
import ProductForm from "@/components/ProductForm";
import { PageHead } from "@/components/ui";

export default async function NewProductPage() {
  const settings = await getSettings();
  return (
    <>
      <PageHead title="דגם חדש" sub="מפרט ותמונות נשמרים יחד" />
      <ProductForm
        action={createProductAction}
        submitLabel="שמור דגם"
        defaultKarat={settings.defaultKarat}
      />
    </>
  );
}
