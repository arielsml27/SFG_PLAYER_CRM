import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/data";
import { updateCustomerAction } from "@/lib/actions";
import CustomerForm from "@/components/CustomerForm";
import { PageHead } from "@/components/ui";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  return (
    <>
      <PageHead title={`עריכת ${customer.name}`} />
      <CustomerForm customer={customer} action={updateCustomerAction} submitLabel="שמור שינויים" />
    </>
  );
}
