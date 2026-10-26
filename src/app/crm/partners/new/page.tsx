import Link from "next/link";
import { createPartner } from "@/lib/partner-actions";
import PartnerForm from "@/components/PartnerForm";

export default function NewPartnerPage() {
  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <Link href="/crm/partners" className="text-sm hover:underline" style={{ color: "var(--muted)" }}>
          ← שותפים ואנשי קשר
        </Link>
        <h1 className="text-2xl font-bold mt-1">איש קשר חדש</h1>
      </div>
      <PartnerForm action={createPartner} submitLabel="הוסף" />
    </div>
  );
}
