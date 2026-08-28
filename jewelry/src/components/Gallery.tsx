"use client";

import { useState } from "react";

/** גלריה פשוטה: תמונה גדולה + תמוניות. אין ספרייה, אין תלות. */
export default function Gallery({ photoIds, alt }: { photoIds: string[]; alt: string }) {
  const [active, setActive] = useState(0);

  if (photoIds.length === 0) {
    return (
      <div className="shots">
        <div className="no-shot">אין תמונה</div>
      </div>
    );
  }

  return (
    <div className="shots">
      <div className="main-shot">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/photos/${photoIds[active]}`} alt={alt} />
      </div>
      {photoIds.length > 1 ? (
        <div className="thumbs">
          {photoIds.map((pid, i) => (
            <button
              key={pid}
              type="button"
              aria-current={i === active}
              aria-label={`תמונה ${i + 1}`}
              onClick={() => setActive(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/photos/${pid}`} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
