"use client";

import { useState } from "react";
import {
  PLAYER_STATUSES,
  PLAYER_STATUS_LABELS,
  REPRESENTATION_STATUSES,
  REPRESENTATION_STATUS_LABELS,
  TARGET_LEVELS,
  TARGET_LEVEL_LABELS,
  STRONG_FOOT_OPTIONS,
} from "@/lib/constants";
import { toDateInputValue } from "@/lib/format";

type ClubOption = { id: string; name: string };

export default function PlayerForm({
  player,
  clubs,
  action,
  submitLabel,
}: {
  player?: any;
  clubs: ClubOption[];
  action: (formData: FormData) => void;
  submitLabel: string;
}) {
  const isEdit = Boolean(player);
  const [preview, setPreview] = useState<string | null>(player?.photoPath ?? null);
  const [removePhoto, setRemovePhoto] = useState(false);

  return (
    <form action={action} className="space-y-6">
      <Section title="פרטים בסיסיים (חובה)">
        <Field label="תמונת שחקן" full>
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-full overflow-hidden border shrink-0 flex items-center justify-center"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
            >
              {preview && !removePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px]" style={{ color: "var(--muted)" }}>
                  אין תמונה
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              <input
                type="file"
                name="photo"
                accept="image/*"
                className="input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setRemovePhoto(false);
                    setPreview(URL.createObjectURL(file));
                  }
                }}
              />
              {isEdit && player?.photoPath && (
                <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                  <input
                    type="checkbox"
                    name="removePhoto"
                    checked={removePhoto}
                    onChange={(e) => {
                      setRemovePhoto(e.target.checked);
                      setPreview(e.target.checked ? null : player.photoPath);
                    }}
                  />
                  הסר תמונה
                </label>
              )}
            </div>
          </div>
        </Field>
        <Field label="שם פרטי *">
          <input name="firstName" defaultValue={player?.firstName} required className="input" />
        </Field>
        <Field label="שם משפחה *">
          <input name="lastName" defaultValue={player?.lastName} required className="input" />
        </Field>
        <Field label="שם מלא בעברית">
          <input name="fullNameHebrew" defaultValue={player?.fullNameHebrew ?? ""} className="input" />
        </Field>
        <Field label="שם מלא באנגלית">
          <input name="fullNameEnglish" defaultValue={player?.fullNameEnglish ?? ""} className="input" />
        </Field>
        <Field label="תאריך לידה *">
          <input
            type="date"
            name="dateOfBirth"
            defaultValue={toDateInputValue(player?.dateOfBirth)}
            required
            className="input"
          />
        </Field>
        <Field label="עמדה ראשית *">
          <input name="mainPosition" defaultValue={player?.mainPosition ?? ""} required className="input" />
        </Field>
        <Field label="עמדות משניות">
          <input name="secondaryPositions" defaultValue={player?.secondaryPositions ?? ""} className="input" />
        </Field>
        <Field label="רגל חזקה">
          <select name="strongFoot" defaultValue={player?.strongFoot ?? ""} className="input">
            <option value="">בחר</option>
            {STRONG_FOOT_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </Field>
        <Field label="לאום">
          <input name="nationality" defaultValue={player?.nationality ?? ""} className="input" />
        </Field>
        <Field label="אזרחות נוספת">
          <input name="secondNationality" defaultValue={player?.secondNationality ?? ""} className="input" />
        </Field>
        <Field label="מספר דרכון">
          <input name="passportNumber" defaultValue={player?.passportNumber ?? ""} className="input" />
        </Field>
        <Field label="גובה (ס״מ)">
          <input type="number" step="0.1" name="height" defaultValue={player?.height ?? ""} className="input" />
        </Field>
        <Field label="משקל (ק״ג)">
          <input type="number" step="0.1" name="weight" defaultValue={player?.weight ?? ""} className="input" />
        </Field>
      </Section>

      <Section title="מועדון וסטטוס (חובה)">
        <Field label="מועדון נוכחי">
          <select name="currentClubId" defaultValue={player?.currentClubId ?? ""} className="input">
            <option value="">סוכן חופשי / ללא מועדון</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="או הוסף מועדון חדש">
          <input name="newClubName" placeholder="שם מועדון חדש" className="input" />
        </Field>
        <Field label="ליגה נוכחית">
          <input name="currentLeague" defaultValue={player?.currentLeague ?? ""} className="input" />
        </Field>
        <Field label="מדינה נוכחית">
          <input name="currentCountry" defaultValue={player?.currentCountry ?? ""} className="input" />
        </Field>
        <Field label="סטטוס שחקן *">
          <select name="status" defaultValue={player?.status ?? "PROSPECT"} required className="input">
            {PLAYER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PLAYER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="סטטוס ייצוג *">
          <select name="representationStatus" defaultValue={player?.representationStatus ?? "UNKNOWN"} required className="input">
            {REPRESENTATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {REPRESENTATION_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="דירוג פנימי (1-10)">
          <input type="number" min={1} max={10} name="internalRating" defaultValue={player?.internalRating ?? ""} className="input" />
        </Field>
        <Field label="פוטנציאל (1-10)">
          <input type="number" min={1} max={10} name="potentialRating" defaultValue={player?.potentialRating ?? ""} className="input" />
        </Field>
        <Field label="רמת דחיפות (0-5)">
          <input type="number" min={0} max={5} name="priorityLevel" defaultValue={player?.priorityLevel ?? 0} className="input" />
        </Field>
      </Section>

      {isEdit && (
        <Section title="מקצועי">
          <Field label="תיאור קצר" full>
            <textarea name="shortDescription" defaultValue={player?.shortDescription ?? ""} className="input" rows={2} />
          </Field>
          <Field label="חוזקות">
            <textarea name="strengths" defaultValue={player?.strengths ?? ""} className="input" rows={2} />
          </Field>
          <Field label="חולשות">
            <textarea name="weaknesses" defaultValue={player?.weaknesses ?? ""} className="input" rows={2} />
          </Field>
          <Field label="סגנון משחק">
            <input name="playingStyle" defaultValue={player?.playingStyle ?? ""} className="input" />
          </Field>
          <Field label="תפקיד אידיאלי">
            <input name="idealRole" defaultValue={player?.idealRole ?? ""} className="input" />
          </Field>
          <Field label="רמת יעד">
            <select name="targetLevel" defaultValue={player?.targetLevel ?? ""} className="input">
              <option value="">בחר</option>
              {TARGET_LEVELS.map((t) => (
                <option key={t} value={t}>
                  {TARGET_LEVEL_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="מועדונים רלוונטיים">
            <input name="relevantClubs" defaultValue={player?.relevantClubs ?? ""} className="input" />
          </Field>
          <Field label="הערכת שווי פנימית">
            <input name="internalValuation" defaultValue={player?.internalValuation ?? ""} className="input" />
          </Field>
        </Section>
      )}

      <Section title="משפחה וסוכן">
        <Field label="סוכן אחראי">
          <input name="agentInCharge" defaultValue={player?.agentInCharge ?? ""} className="input" />
        </Field>
        <Field label="איש קשר משפחתי">
          <input name="familyContactName" defaultValue={player?.familyContactName ?? ""} className="input" />
        </Field>
        <Field label="טלפון">
          <input name="familyContactPhone" defaultValue={player?.familyContactPhone ?? ""} className="input" />
        </Field>
        <Field label="אימייל">
          <input type="email" name="familyContactEmail" defaultValue={player?.familyContactEmail ?? ""} className="input" />
        </Field>
        <Field label="כתובת">
          <input name="address" defaultValue={player?.address ?? ""} className="input" />
        </Field>
        <Field label="תגיות (מופרד בפסיקים)">
          <input name="tags" defaultValue={player?.tags ?? ""} className="input" />
        </Field>
      </Section>

      <Section title="פעולה הבאה">
        <Field label="מה הפעולה הבאה?">
          <input name="nextAction" defaultValue={player?.nextAction ?? ""} className="input" />
        </Field>
        <Field label="תאריך יעד לפעולה">
          <input type="date" name="nextActionDate" defaultValue={toDateInputValue(player?.nextActionDate)} className="input" />
        </Field>
        <Field label="הערות כלליות" full>
          <textarea name="notes" defaultValue={player?.notes ?? ""} className="input" rows={3} />
        </Field>
      </Section>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-gold">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h3 className="font-bold mb-3 text-sm" style={{ color: "var(--navy)" }}>
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2 lg:col-span-3" : ""}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}
