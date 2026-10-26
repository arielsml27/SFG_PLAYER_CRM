import Link from "next/link";
import { notFound } from "next/navigation";
import { getPartner } from "@/lib/data";
import { updatePartner } from "@/lib/partner-actions";
import PartnerForm from "@/components/PartnerForm";

export const dynamic = "force-dynamic";

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const partner = await getPartner(id);
  if (!partner) notFound();

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <Link href="/crm/partners" className="text-sm hover:underline" style={{ color: "var(--muted)" }}>
          ← שותפים ואנשי קשר
        </Link>
        <h1 className="text-2xl font-bold mt-1">עריכת {partner.name}</h1>
      </div>
      <PartnerForm action={updatePartner.bind(null, partner.id)} defaultValues={partner} submitLabel="שמור שינויים" />
    </div>
  );
}
