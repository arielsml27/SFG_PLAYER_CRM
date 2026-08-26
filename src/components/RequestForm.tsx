"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { REQUEST_STATUSES, REQUEST_STATUS_LABELS } from "@/lib/constants";

type CrmUserOption = { id: string; name: string | null; email: string };
type ClubOption = { id: string; name: string; country: string | null; league: string | null };

type RequestDefaults = {
  clubId?: string | null;
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
  clubOptions,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  users: CrmUserOption[];
  clubOptions: ClubOption[];
  defaultValues?: RequestDefaults;
  submitLabel: string;
}) {
  const initialClub = clubOptions.find((c) => c.id === defaultValues?.clubId);
  const [country, setCountry] = useState(initialClub?.country ?? "");
  const [league, setLeague] = useState(initialClub?.league ?? "");
  const [clubId, setClubId] = useState(defaultValues?.clubId ?? "");

  const countries = useMemo(
    () => Array.from(new Set(clubOptions.map((c) => c.country).filter((v): v is string => !!v))).sort(),
    [clubOptions]
  );
  const leagues = useMemo(
    () =>
      Array.from(
        new Set(clubOptions.filter((c) => !country || c.country === country).map((c) => c.league).filter((v): v is string => !!v))
      ).sort(),
    [clubOptions, country]
  );
  const filteredClubs = useMemo(
    () => clubOptions.filter((c) => (!country || c.country === country) && (!league || c.league === league)),
    [clubOptions, country, league]
  );

  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label className="field-label">מדינה</label>
        <select
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setLeague("");
            setClubId("");
          }}
          className="input"
        >
          <option value="">הכל</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">ליגה</label>
        <select
          value={league}
          onChange={(e) => {
            setLeague(e.target.value);
            setClubId("");
          }}
          className="input"
        >
          <option value="">הכל</option>
          {leagues.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="field-label">קבוצה</label>
        <select name="clubId" value={clubId} onChange={(e) => setClubId(e.target.value)} className="input">
          <option value="">בחר קבוצה</option>
          {filteredClubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          הקבוצה לא ברשימה?{" "}
          <Link href="/crm/clubs" className="hover:underline" style={{ color: "var(--gold)" }}>
            הוסיפו אותה דרך לשונית מועדונים
          </Link>
          .
        </p>
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
