"use client";

import { useActionState, useRef, useState } from "react";
import { uploadPhotosAction, type UploadResult } from "@/lib/product-actions";

const MAX_EDGE = 1600;
const QUALITY = 0.85;

type Pending = { name: string; dataUrl: string; kb: number };

/**
 * מקטין כל תמונה בדפדפן לפני השליחה. תמונה מהטלפון היא 4–6MB;
 * אחרי ההקטנה היא כ-200KB, וכך קובץ הגיבוי היחיד נשאר קטן.
 */
async function shrink(file: File): Promise<Pending> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("הדפדפן לא תומך בעיבוד תמונה");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
  return { name: file.name, dataUrl, kb: Math.round((dataUrl.length * 0.75) / 1024) };
}

export default function PhotoUploader({ productId }: { productId: string }) {
  const [pending, setPending] = useState<Pending[]>([]);
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
      const shrunk: Pending[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        shrunk.push(await shrink(file));
      }
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
