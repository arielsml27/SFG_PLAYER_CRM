"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: number | null;
}) {
  const [value, setValue] = useState<number | null>(defaultValue ?? null);

  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm">{label}</label>
      <div className="flex items-center gap-2">
        <div className="flex" dir="ltr">
          {[0, 1, 2, 3, 4].map((i) => {
            const fill = value !== null ? Math.min(1, Math.max(0, value - i)) * 100 : 0;
            return (
              <span key={i} className="relative inline-block w-5 h-5">
                <Star size={20} style={{ color: "var(--border)" }} />
                <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill}%` }}>
                  <Star size={20} fill="var(--gold)" style={{ color: "var(--gold)" }} />
                </span>
                <button
                  type="button"
                  aria-label={`${i + 0.5} כוכבים`}
                  className="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
                  onClick={() => setValue(i + 0.5)}
                />
                <button
                  type="button"
                  aria-label={`${i + 1} כוכבים`}
                  className="absolute inset-y-0 right-0 w-1/2 cursor-pointer"
                  onClick={() => setValue(i + 1)}
                />
              </span>
            );
          })}
        </div>
        <span className="text-xs w-6 text-center" style={{ color: "var(--muted)" }}>
          {value ?? "—"}
        </span>
        {value !== null && (
          <button
            type="button"
            className="text-xs"
            style={{ color: "var(--muted)" }}
            onClick={() => setValue(null)}
          >
            נקה
          </button>
        )}
      </div>
      <input type="hidden" name={name} value={value ?? ""} />
    </div>
  );
}
