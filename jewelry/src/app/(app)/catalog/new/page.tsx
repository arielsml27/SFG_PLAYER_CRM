import { createProductAction } from "@/lib/product-actions";
import ProductForm from "@/components/ProductForm";
import { PageHead } from "@/components/ui";

export default function NewProductPage() {
  return (
    <>
      <PageHead title="דגם חדש" sub="אחרי השמירה אפשר להעלות תמונות" />
      <ProductForm action={createProductAction} submitLabel="שמור דגם" />
    </>
  );
}
