"use client";

import { useActionState, useRef, useState } from "react";
import { uploadPhotosAction, type UploadResult } from "@/lib/product-actions";
import { shrinkAll, type ShrunkPhoto } from "@/lib/shrink-image";

export default function PhotoUploader({ productId }: { productId: string }) {
  const [pending, setPending] = useState<ShrunkPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, formAction, uploading] = useActionState<UploadResult, FormData>(
    uploadPhotosAction,
    null
  );

  // אחרי העלאה מוצלחת מנקים את הרשימה, אחרת שליחה נוספת תכפיל תמונות.
  // התאמה בזמן רינדור, ולא ב-effect, כדי לא לגרור רינדור נוסף.
  const [consumed, setConsumed] = useState<number | null>(null);
  if (result && result.at !== consumed) {
    setConsumed(result.at);
    setPending([]);
  }

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const shrunk = await shrinkAll(files);
      setPending((p) => [...p, ...shrunk]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "לא הצלחתי לקרוא את התמונה");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <form action={formAction} className="stack-sm">
      <input type="hidden" name="productId" value={productId} />
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
        {busy ? <span className="quiet">מקטין…</span> : null}
        {pending.length ? (
          <span className="quiet" style={{ fontSize: 12.5 }}>
            {pending.length} מוכנות · {pending.reduce((a, p) => a + p.kb, 0)}KB
          </span>
        ) : null}
        {result && !pending.length ? (
          <span className="good" style={{ fontSize: 12.5 }}>
            הועלו {result.uploaded} תמונות
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="danger" style={{ fontSize: 13 }}>
          {error}
        </p>
      ) : null}

      {pending.length ? (
        <>
          <div className="photo-strip">
            {pending.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={p.dataUrl} alt={p.name} />
            ))}
          </div>
          <div className="row">
            <button className="btn btn-primary btn-sm" type="submit" disabled={busy || uploading}>
              {uploading ? "מעלה…" : `העלה ${pending.length} תמונות`}
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setPending([])}>
              נקה
            </button>
          </div>
        </>
      ) : (
        <p className="quiet" style={{ fontSize: 12.5 }}>
          אפשר לבחור כמה תמונות בבת אחת. הן מוקטנות בדפדפן ל-1600px לפני השמירה.
        </p>
      )}
    </form>
  );
}
