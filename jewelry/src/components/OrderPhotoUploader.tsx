"use client";

import { useActionState, useRef, useState } from "react";
import { uploadOrderPhotosAction } from "@/lib/customer-actions";
import { shrinkAll, type ShrunkPhoto } from "@/lib/shrink-image";

/** העלאת סקיצות ותמונות של הפריט המוגמר, שהלקוח יראה בעמוד שלו. */
export default function OrderPhotoUploader({ orderId }: { orderId: string }) {
  const [pending, setPending] = useState<ShrunkPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, formAction, sending] = useActionState(async (_: null, fd: FormData) => {
    await uploadOrderPhotosAction(fd);
    setPending([]);
    return null;
  }, null);

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const out = await shrinkAll(files);
      setPending((p) => [...p, ...out]);
    } catch (e) {
      // קובץ פגום או פורמט שהדפדפן לא מפענח. בלי ההודעה הזו הבחירה
      // פשוט לא עושה כלום, וזה נראה כאילו ההעלאה לא קיימת.
      setError(e instanceof Error ? e.message : "לא הצלחתי לקרוא את התמונה");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <form action={formAction} className="stack-sm">
      <input type="hidden" name="orderId" value={orderId} />
      {pending.map((p, i) => (
        <input key={i} type="hidden" name="photo" value={p.dataUrl} />
      ))}
      <div className="row">
        <label className="btn btn-sm" style={{ cursor: "pointer" }}>
          בחר תמונות
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => onPick(e.target.files)}
          />
        </label>
        <select name="kind" defaultValue="עיצוב" style={{ width: 140 }}>
          <option>עיצוב</option>
          <option>מוכן</option>
        </select>
        {pending.length ? (
          <button className="btn btn-sm btn-primary" type="submit" disabled={busy || sending}>
            {sending ? "מעלה…" : `העלה ${pending.length}`}
          </button>
        ) : null}
        {busy ? <span className="quiet">מעבד…</span> : null}
      </div>
      {error ? (
        <p className="danger" style={{ fontSize: 13 }}>
          {error}
        </p>
      ) : null}
      {pending.length ? (
        <div className="photo-strip">
          {pending.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={p.dataUrl} alt={p.name} />
          ))}
        </div>
      ) : null}
    </form>
  );
}
