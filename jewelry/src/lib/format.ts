/** פורמט אחיד למספרים, כסף ותאריכים — עברית, ותמיד ספרות טבלאיות. */

export function usd(v: number | null | undefined, digits = 2): string {
  const n = Number.isFinite(v as number) ? (v as number) : 0;
  return (
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
  );
}

export function ils(v: number | null | undefined, digits = 0): string {
  const n = Number.isFinite(v as number) ? (v as number) : 0;
  return (
    "₪" + n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
  );
}

export function pct(v: number | null | undefined, digits = 1): string {
  const n = Number.isFinite(v as number) ? (v as number) : 0;
  return n.toFixed(digits) + "%";
}

export function grams(v: number | null | undefined): string {
  const n = Number.isFinite(v as number) ? (v as number) : 0;
  return n.toFixed(2) + " גר׳";
}

/** תאריך בפורמט ישראלי: 18/01/2026 */
export function date(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function dateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return (
    d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })
  );
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** כמה ימים נותרו עד התאריך. שלילי = עבר. null אם אין תאריך. */
export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const d = new Date(value + (value.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

/** "בעוד 3 ימים" / "עבר ב-2 ימים" / "היום" */
export function relativeDays(value: string | null | undefined): string {
  const d = daysUntil(value);
  if (d === null) return "—";
  if (d === 0) return "היום";
  if (d === 1) return "מחר";
  if (d === -1) return "אתמול";
  if (d > 0) return `בעוד ${d} ימים`;
  return `עבר ב-${Math.abs(d)} ימים`;
}
