import { createCustomerAction } from "@/lib/actions";
import CustomerForm from "@/components/CustomerForm";
import { PageHead } from "@/components/ui";

export default function NewCustomerPage() {
  return (
    <>
      <PageHead title="לקוח חדש" />
      <CustomerForm action={createCustomerAction} submitLabel="שמור לקוח" />
    </>
  );
}
