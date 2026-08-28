"use client";

import { useActionState, useRef, useState } from "react";
import { factoryUpdateAction } from "@/lib/factory-actions";
import type { FactoryUpdateResult } from "@/lib/factory-types";
import { FACTORY_SELECTABLE_STATUSES } from "@/lib/constants";
import { Field } from "@/components/ui";

const MAX_EDGE = 1600;
const QUALITY = 0.85;
type Pending = { name: string; dataUrl: string };

async function shrink(file: File): Promise<Pending> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("הדפדפן לא תומך בעיבוד תמונה");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return { name: file.name, dataUrl: canvas.toDataURL("image/jpeg", QUALITY) };
}

/** הטופס שהמפעל ממלא. מאומת בטוקן שבכתובת, בלי סיסמה. */
export default function FactoryUpdateForm({
  token,
  currentStatus,
  currentEta,
}: {
  token: string;
  currentStatus: string;
  currentEta: string | null;
}) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, formAction, sending] = useActionState<FactoryUpdateResult, FormData>(
    factoryUpdateAction,
    null
  );
  const [consumed, setConsumed] = useState<number | null>(null);
  if (result?.ok && result.at !== consumed) {
    setConsumed(result.at);
    setPending([]);
  }

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const out: Pending[] = [];
      for (const f of Array.from(files)) {
        if (f.type.startsWith("image/")) out.push(await shrink(f));
      }
      setPending((p) => [...p, ...out]);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <form action={formAction} className="stack">
      <input type="hidden" name="token" value={token} />
      {pending.map((p, i) => (
        <input key={i} type="hidden" name="photo" value={p.dataUrl} />
      ))}

      <div className="form-grid">
        <Field label="סטטוס העבודה">
          <select name="status" defaultValue={currentStatus}>
            <option value="">— בלי שינוי —</option>
            {FACTORY_SELECTABLE_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="מתי זה יהיה מוכן" hint="תאריך משוער">
          <input type="date" name="eta" defaultValue={currentEta ?? ""} />
        </Field>
      </div>

      <Field label="הערה">
        <textarea name="body" placeholder="למשל: היציקה יצאה, מחר שיבוץ" />
      </Field>

      <div className="stack-sm">
        <div className="row">
          <label className="btn btn-sm" style={{ cursor: "pointer" }}>
            צרף תמונות
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => onPick(e.target.files)}
            />
          </label>
          {busy ? <span className="quiet">מעבד…</span> : null}
          {pending.length ? (
            <span className="quiet" style={{ fontSize: 12.5 }}>
              {pending.length} תמונות מצורפות
            </span>
          ) : null}
        </div>
        {pending.length ? (
          <div className="photo-strip">
            {pending.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={p.dataUrl} alt={p.name} />
            ))}
          </div>
        ) : null}
      </div>

      {result ? (
        <p className={result.ok ? "good" : "danger"} style={{ fontSize: 13.5 }}>
          {result.message}
        </p>
      ) : null}

      <div>
        <button className="cta" type="submit" disabled={busy || sending}>
          {sending ? "שולח…" : "שלח עדכון"}
        </button>
      </div>
    </form>
  );
}
