import { createSupplierAction } from "@/lib/factory-actions";
import SupplierForm from "@/components/SupplierForm";
import { PageHead } from "@/components/ui";

export default function NewSupplierPage() {
  return (
    <>
      <PageHead title="ספק חדש" />
      <SupplierForm action={createSupplierAction} submitLabel="שמור ספק" />
    </>
  );
}
