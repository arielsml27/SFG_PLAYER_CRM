"use client";

import { useState } from "react";
import { PROSPECT_STATUSES, PROSPECT_STATUS_LABELS } from "@/lib/constants";

type CrmUserOption = { id: string; name: string | null; email: string };

type ProspectDefaults = {
  name?: string;
  club?: string | null;
  position?: string | null;
  age?: number | null;
  parentPhone?: string | null;
  contactedByUserId?: string | null;
  status?: string;
  meetingDate?: string | null;
  meetingTime?: string | null;
  meetingLocation?: string | null;
};

export default function ProspectForm({
  action,
  users,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  users: CrmUserOption[];
  defaultValues?: ProspectDefaults;
  submitLabel: string;
}) {
  const [status, setStatus] = useState(defaultValues?.status ?? "NOT_CONTACTED");

  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label className="field-label">שם השחקן *</label>
        <input name="name" required defaultValue={defaultValues?.name ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">מועדון</label>
        <input name="club" defaultValue={defaultValues?.club ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">עמדה</label>
        <input name="position" defaultValue={defaultValues?.position ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">גיל</label>
        <input type="number" name="age" defaultValue={defaultValues?.age ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">טלפון הורה</label>
        <input name="parentPhone" defaultValue={defaultValues?.parentPhone ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">מי פנה</label>
        <select name="contactedByUserId" defaultValue={defaultValues?.contactedByUserId ?? ""} className="input">
          <option value="">בחר</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || u.email}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="field-label">סטטוס</label>
        <select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input"
        >
          {PROSPECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PROSPECT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {status === "MEETING_SCHEDULED" && (
        <>
          <div>
            <label className="field-label">תאריך פגישה</label>
            <input type="date" name="meetingDate" defaultValue={defaultValues?.meetingDate ?? ""} className="input" />
          </div>
          <div>
            <label className="field-label">שעה</label>
            <input type="time" name="meetingTime" defaultValue={defaultValues?.meetingTime ?? ""} className="input" />
          </div>
          <div className="md:col-span-2">
            <label className="field-label">מיקום</label>
            <input name="meetingLocation" defaultValue={defaultValues?.meetingLocation ?? ""} className="input" />
          </div>
        </>
      )}

      <div className="md:col-span-2">
        <button type="submit" className="btn btn-gold btn-sm">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
