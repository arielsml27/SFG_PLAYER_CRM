"use client";

import { useState } from "react";

/** לינק לשיתוף: העתקה בלחיצה, ופתיחת וואטסאפ עם הודעה מוכנה. */
export default function ShareBox({
  url,
  whatsappHref,
  hint,
}: {
  url: string;
  whatsappHref: string;
  hint?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="stack-sm">
      <div className="row" style={{ gap: 6 }}>
        <input readOnly value={url} dir="ltr" onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="btn btn-sm" onClick={copy}>
          {copied ? "הועתק" : "העתק"}
        </button>
        <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary">
          שלח בוואטסאפ
        </a>
        <a href={url} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost">
          תצוגה
        </a>
      </div>
      {hint ? (
        <p className="quiet" style={{ fontSize: 12 }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
