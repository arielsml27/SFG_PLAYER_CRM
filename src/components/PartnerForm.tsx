import Link from "next/link";

type PartnerDefaults = {
  name?: string;
  organization?: string | null;
  role?: string | null;
  country?: string | null;
  city?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  notes?: string | null;
  trusted?: boolean;
};

export default function PartnerForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: PartnerDefaults;
  submitLabel: string;
}) {
  const d = defaultValues;
  return (
    <form action={action} className="card p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label className="field-label">שם *</label>
        <input name="name" required defaultValue={d?.name ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">ארגון</label>
        <input name="organization" defaultValue={d?.organization ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">תפקיד</label>
        <input name="role" defaultValue={d?.role ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">מדינה</label>
        <input name="country" defaultValue={d?.country ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">עיר</label>
        <input name="city" defaultValue={d?.city ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">טלפון</label>
        <input name="phone" dir="ltr" defaultValue={d?.phone ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">וואטסאפ</label>
        <input name="whatsapp" dir="ltr" defaultValue={d?.whatsapp ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">אימייל</label>
        <input name="email" type="email" dir="ltr" defaultValue={d?.email ?? ""} className="input" />
      </div>
      <div className="md:col-span-2">
        <label className="field-label">הערות</label>
        <textarea name="notes" defaultValue={d?.notes ?? ""} className="input" rows={3} />
      </div>
      <div className="md:col-span-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="trusted" defaultChecked={d?.trusted ?? false} />
          אמין
        </label>
      </div>
      <div className="md:col-span-2 flex items-center gap-2">
        <button type="submit" className="btn btn-gold btn-sm">
          {submitLabel}
        </button>
        <Link href="/crm/partners" className="btn btn-outline btn-sm">
          ביטול
        </Link>
      </div>
    </form>
  );
}
