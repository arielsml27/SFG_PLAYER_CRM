"use client";

import { useActionState, useRef, useState } from "react";
import { uploadOrderPhotosAction } from "@/lib/customer-actions";

const MAX_EDGE = 1600;
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
  return { name: file.name, dataUrl: canvas.toDataURL("image/jpeg", 0.85) };
}

/** העלאת סקיצות ותמונות של הפריט המוגמר, שהלקוח יראה בעמוד שלו. */
export default function OrderPhotoUploader({ orderId }: { orderId: string }) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, formAction, sending] = useActionState(async (_: null, fd: FormData) => {
    await uploadOrderPhotosAction(fd);
    setPending([]);
    return null;
  }, null);

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
