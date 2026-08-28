import Link from "next/link";
import { SUPPLIER_TYPES } from "@/lib/constants";
import { Field, SectionHead } from "@/components/ui";
import type { Supplier } from "@/lib/data";

export default function SupplierForm({
  supplier,
  action,
  submitLabel,
}: {
  supplier?: Supplier;
  action: (fd: FormData) => void;
  submitLabel: string;
}) {
  return (
    <form action={action} className="stack">
      {supplier ? <input type="hidden" name="id" value={supplier.id} /> : null}

      <div className="panel stack">
        <SectionHead title="הספק" latin="SUPPLIER" />
        <div className="form-grid">
          <Field label="שם">
            <input name="name" defaultValue={supplier?.name ?? ""} required autoFocus />
          </Field>
          <Field label="סוג">
            <select name="type" defaultValue={supplier?.type ?? "מפעל ייצור"}>
              {SUPPLIER_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="איש קשר">
            <input name="contactName" defaultValue={supplier?.contactName ?? ""} />
          </Field>
          <Field label="טלפון">
            <input name="phone" defaultValue={supplier?.phone ?? ""} dir="ltr" />
          </Field>
          <Field label="וואטסאפ" hint="לשליחת לינק הזמנת עבודה">
            <input name="whatsapp" defaultValue={supplier?.whatsapp ?? ""} dir="ltr" />
          </Field>
          <Field label="אימייל">
            <input name="email" type="email" defaultValue={supplier?.email ?? ""} dir="ltr" />
          </Field>
          <Field label="עיר">
            <input name="city" defaultValue={supplier?.city ?? ""} />
          </Field>
        </div>
      </div>

      <div className="panel stack">
        <SectionHead title="תנאים" latin="TERMS" />
        <div className="form-grid">
          <Field label="זמן אספקה ממוצע (ימים)" hint="משמש להצעת תאריך יעד">
            <input type="number" name="leadDays" min="0" step="1" defaultValue={supplier?.leadDays ?? 0} />
          </Field>
          <Field label="תנאי תשלום">
            <input name="paymentTerms" defaultValue={supplier?.paymentTerms ?? ""} placeholder="שוטף+30" />
          </Field>
          <Field label="דירוג פנימי" hint="0–5, רק לעיניך">
            <input type="number" name="rating" min="0" max="5" step="1" defaultValue={supplier?.rating ?? 0} />
          </Field>
        </div>
        <label className="switch">
          <input type="checkbox" name="isActive" defaultChecked={supplier?.isActive ?? true} />
          ספק פעיל
        </label>
        <Field label="הערות">
          <textarea name="notes" defaultValue={supplier?.notes ?? ""} />
        </Field>
      </div>

      <div className="row">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
        <Link href="/suppliers" className="btn btn-ghost">
          ביטול
        </Link>
      </div>
    </form>
  );
}
