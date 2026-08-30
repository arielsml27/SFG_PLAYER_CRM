import { notFound } from "next/navigation";
import { getProduct, getSettings } from "@/lib/data";
import { updateProductAction } from "@/lib/product-actions";
import ProductForm from "@/components/ProductForm";
import { PageHead } from "@/components/ui";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await getProduct(id);
  if (!found) notFound();
  const settings = await getSettings();

  return (
    <>
      <PageHead title={`עריכת ${found.product.name}`} sub={found.product.sku} />
      <ProductForm
        product={found.product}
        action={updateProductAction}
        submitLabel="שמור שינויים"
        defaultKarat={settings.defaultKarat}
      />
    </>
  );
}
