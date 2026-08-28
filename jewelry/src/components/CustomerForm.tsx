import { CUSTOMER_SOURCES, CUSTOMER_STATUSES, CUSTOMER_TYPES } from "@/lib/constants";
import { Field, SectionHead } from "@/components/ui";
import type { Customer } from "@/lib/data";

export default function CustomerForm({
  customer,
  action,
  submitLabel,
}: {
  customer?: Customer;
  action: (fd: FormData) => void;
  submitLabel: string;
}) {
  return (
    <form action={action} className="stack">
      {customer ? <input type="hidden" name="id" value={customer.id} /> : null}

      <div className="panel stack">
        <SectionHead title="פרטי הלקוח" latin="CUSTOMER" />
        <div className="form-grid">
          <Field label="שם">
            <input name="name" defaultValue={customer?.name ?? ""} required autoFocus />
          </Field>
          <Field label="סוג">
            <select name="type" defaultValue={customer?.type ?? "פרטי"}>
              {CUSTOMER_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="סטטוס">
            <select name="status" defaultValue={customer?.status ?? "פעיל"}>
              {CUSTOMER_STATUSES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="panel stack">
        <SectionHead title="דרכי קשר" latin="CONTACT" />
        <div className="form-grid">
          <Field label="טלפון">
            <input name="phone" defaultValue={customer?.phone ?? ""} dir="ltr" />
          </Field>
          <Field label="וואטסאפ" hint="אם שונה מהטלפון">
            <input name="whatsapp" defaultValue={customer?.whatsapp ?? ""} dir="ltr" />
          </Field>
          <Field label="אימייל">
            <input name="email" type="email" defaultValue={customer?.email ?? ""} dir="ltr" />
          </Field>
          <Field label="אינסטגרם">
            <input name="instagram" defaultValue={customer?.instagram ?? ""} dir="ltr" />
          </Field>
          <Field label="מדינה">
            <input name="country" defaultValue={customer?.country ?? "ישראל"} />
          </Field>
          <Field label="עיר">
            <input name="city" defaultValue={customer?.city ?? ""} />
          </Field>
          <Field label="כתובת">
            <input name="address" defaultValue={customer?.address ?? ""} />
          </Field>
        </div>
      </div>

      <div className="panel stack">
        <SectionHead title="מקור והערות" latin="SOURCE" />
        <div className="form-grid">
          <Field label="מקור הגעה">
            <select name="source" defaultValue={customer?.source ?? ""}>
              <option value="">—</option>
              {CUSTOMER_SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="מי המליץ">
            <input name="referredBy" defaultValue={customer?.referredBy ?? ""} />
          </Field>
        </div>
        <label className="switch">
          <input type="checkbox" name="defaultExport" defaultChecked={customer?.defaultExport ?? false} />
          לקוח ייצוא — הזמנה חדשה שלו תיפתח ללא מע״מ
        </label>
        <Field label="הערות">
          <textarea name="notes" defaultValue={customer?.notes ?? ""} />
        </Field>
      </div>

      <div className="row">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
