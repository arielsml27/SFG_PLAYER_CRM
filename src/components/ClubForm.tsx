"use client";

import { useState } from "react";

type ClubDefaults = {
  name?: string;
  country?: string | null;
  league?: string | null;
  city?: string | null;
  website?: string | null;
  transfermarktLink?: string | null;
  logoPath?: string | null;
  notes?: string | null;
};

export default function ClubForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaultValues?: ClubDefaults;
  submitLabel: string;
}) {
  const isEdit = Boolean(defaultValues);
  const [preview, setPreview] = useState<string | null>(defaultValues?.logoPath ?? null);
  const [removeLogo, setRemoveLogo] = useState(false);

  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="md:col-span-2">
        <label className="field-label">לוגו מועדון</label>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-lg overflow-hidden border shrink-0 flex items-center justify-center"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            {preview && !removeLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="w-full h-full object-contain" />
            ) : (
              <span className="text-[10px] text-center" style={{ color: "var(--muted)" }}>
                אין לוגו
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            <input
              type="file"
              name="logo"
              accept="image/*"
              className="input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setRemoveLogo(false);
                  setPreview(URL.createObjectURL(file));
                }
              }}
            />
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              שמרו את תמונת הלוגו מדף המועדון ב-Transfermarkt והעלו כאן.
            </p>
            {isEdit && preview && !removeLogo && (
              <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                <input
                  type="checkbox"
                  name="removeLogo"
                  onChange={(e) => {
                    setRemoveLogo(e.target.checked);
                    if (e.target.checked) setPreview(null);
                  }}
                />
                הסר לוגו
              </label>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="field-label">שם *</label>
        <input name="name" required defaultValue={defaultValues?.name ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">מדינה</label>
        <input name="country" defaultValue={defaultValues?.country ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">ליגה</label>
        <input name="league" defaultValue={defaultValues?.league ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">עיר</label>
        <input name="city" defaultValue={defaultValues?.city ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">אתר</label>
        <input name="website" defaultValue={defaultValues?.website ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">לינק לטרנספרמרקט</label>
        <input name="transfermarktLink" defaultValue={defaultValues?.transfermarktLink ?? ""} className="input" />
      </div>
      <div className="md:col-span-2">
        <label className="field-label">הערות</label>
        <textarea name="notes" defaultValue={defaultValues?.notes ?? ""} className="input" rows={2} />
      </div>
      <div className="md:col-span-2">
        <button type="submit" className="btn btn-gold btn-sm">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
