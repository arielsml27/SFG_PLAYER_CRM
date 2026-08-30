"use client";

import { useRef, useState } from "react";
import { shrinkAll, type ShrunkPhoto } from "@/lib/shrink-image";

/**
 * בורר תמונות שחי **בתוך טופס קיים** ולא שולח בעצמו. הוא מקטין בדפדפן
 * ופולט שדות מוסתרים בשם `photo`, כך שהתמונות נוסעות יחד עם שאר הטופס.
 *
 * זה מה שמאפשר לשמור דגם חדש ואת התמונות שלו בפעולה אחת, במקום לשמור
 * ואז לחזור למסך אחר כדי להעלות.
 */
export default function PhotoPicker({ hint }: { hint?: string }) {
  const [photos, setPhotos] = useState<ShrunkPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const shrunk = await shrinkAll(files);
      setPhotos((p) => [...p, ...shrunk]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "לא הצלחתי לקרוא את התמונה");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const totalKb = photos.reduce((a, p) => a + p.kb, 0);

  return (
    <div className="stack-sm">
      {photos.map((p, i) => (
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
        {photos.length ? (
          <span className="quiet" style={{ fontSize: 12.5 }}>
            {photos.length} תמונות · {totalKb}KB
          </span>
        ) : null}
        {photos.length ? (
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => setPhotos([])}>
            נקה
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="danger" style={{ fontSize: 13 }}>
          {error}
        </p>
      ) : null}

      {photos.length ? (
        <div className="photo-strip">
          {photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={p.dataUrl} alt={p.name} />
          ))}
        </div>
      ) : (
        <p className="quiet" style={{ fontSize: 12.5 }}>
          {hint ?? "אפשר לבחור כמה תמונות בבת אחת. הן נשמרות יחד עם הדגם."}
        </p>
      )}
    </div>
  );
}
