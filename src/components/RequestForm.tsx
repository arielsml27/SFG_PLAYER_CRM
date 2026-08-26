"use client";

import { REQUEST_STATUSES, REQUEST_STATUS_LABELS } from "@/lib/constants";

type CrmUserOption = { id: string; name: string | null; email: string };

type RequestDefaults = {
  country?: string | null;
  league?: string | null;
  club?: string | null;
  positionSought?: string | null;
  transferBudget?: string | null;
  salaryBudget?: string | null;
  notes?: string | null;
  handledByUserId?: string | null;
  dealPartner?: string | null;
  status?: string;
};

export default function RequestForm({
  action,
  users,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  users: CrmUserOption[];
  defaultValues?: RequestDefaults;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label className="field-label">מדינה</label>
        <input name="country" defaultValue={defaultValues?.country ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">ליגה</label>
        <input name="league" defaultValue={defaultValues?.league ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">קבוצה</label>
        <input name="club" defaultValue={defaultValues?.club ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">תפקיד שמחפשים</label>
        <input name="positionSought" defaultValue={defaultValues?.positionSought ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">תקציב להעברה</label>
        <input name="transferBudget" defaultValue={defaultValues?.transferBudget ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">תקציב שכר לשחקן</label>
        <input name="salaryBudget" defaultValue={defaultValues?.salaryBudget ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">מי מטפל</label>
        <select name="handledByUserId" defaultValue={defaultValues?.handledByUserId ?? ""} className="input">
          <option value="">בחר</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || u.email}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">שותף לעסקה (אם יש)</label>
        <input name="dealPartner" defaultValue={defaultValues?.dealPartner ?? ""} className="input" />
      </div>
      <div className="md:col-span-2">
        <label className="field-label">הערות נוספות</label>
        <textarea name="notes" defaultValue={defaultValues?.notes ?? ""} className="input" rows={3} />
      </div>
      <div className="md:col-span-2">
        <label className="field-label">סטטוס בקשה</label>
        <select name="status" defaultValue={defaultValues?.status ?? "OPEN"} className="input">
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {REQUEST_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <button type="submit" className="btn btn-gold btn-sm">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
