import { ils } from "@/lib/format";
import type { MonthRow } from "@/lib/data";

/**
 * רווח נקי לפי חודש. סדרה אחת, ולכן אין מקרא — הכותרת מזהה אותה.
 * הצבע מקודד קוטביות (רווח מול הפסד), לא זהות, ולכן שני צבעים בלבד.
 * כל עמודה נושאת תווית שנה־חודש, כך שהזיהוי לא נשען על צבע.
 */
export default function ProfitChart({ rows, fx }: { rows: MonthRow[]; fx: number }) {
  const W = 720;
  const H = 210;
  const padTop = 18;
  const padBottom = 26;
  const padSide = 8;

  const values = rows.map((r) => r.netUsd * fx);
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;

  const plotH = H - padTop - padBottom;
  const colW = (W - padSide * 2) / rows.length;
  const barW = Math.min(38, colW * 0.56);
  const yOf = (v: number) => padTop + ((max - v) / span) * plotH;
  const zeroY = yOf(0);

  // תווית מספרית רק על החודש האחרון ועל השיא — לא על כל עמודה
  const active = rows.map((r) => r.orders > 0 || r.expensesUsd > 0);
  let peakIndex = active.indexOf(true);
  values.forEach((v, i) => {
    if (active[i] && (peakIndex < 0 || Math.abs(v) > Math.abs(values[peakIndex]))) peakIndex = i;
  });
  const lastActive = active.lastIndexOf(true);
  const labelled = new Set([lastActive, peakIndex].filter((i) => i >= 0));

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="רווח נקי לפי חודש">
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            className="grid-line"
            x1={padSide}
            x2={W - padSide}
            y1={padTop + plotH * t}
            y2={padTop + plotH * t}
          />
        ))}

        {rows.map((r, i) => {
          const v = values[i];
          // חודש בלי הזמנות ובלי הוצאות אינו "רווח אפס" — אין בו נתון.
          // מינימום גובה על עמודה כזו היה מצייר פס זהב קטן ומרמז על רווח.
          const hasData = r.orders > 0 || r.expensesUsd > 0;
          const x = padSide + i * colW + (colW - barW) / 2;
          const top = v >= 0 ? yOf(v) : zeroY;
          const h = hasData ? Math.max(2, Math.abs(yOf(v) - zeroY)) : 0;
          const gain = v >= 0;
          return (
            <g key={r.month} className="col">
              <title>{hasData ? `${r.label} · ${ils(v)}` : `${r.label} · אין פעילות`}</title>
              {/* יעד ריחוף רחב מהעמודה עצמה */}
              <rect
                x={padSide + i * colW}
                y={padTop}
                width={colW}
                height={plotH}
                fill="transparent"
              />
              {hasData ? (
                <rect
                  className="bar"
                  x={x}
                  y={top}
                  width={barW}
                  height={h}
                  rx="4"
                  fill={gain ? "var(--data-gain)" : "var(--data-loss)"}
                />
              ) : (
                <line
                  className="grid-line"
                  x1={x}
                  x2={x + barW}
                  y1={zeroY}
                  y2={zeroY}
                  strokeWidth="2"
                />
              )}
              {hasData && labelled.has(i) && Math.abs(v) > 0 ? (
                <text
                  className="value-label"
                  x={x + barW / 2}
                  y={gain ? top - 5 : top + h + 12}
                  textAnchor="middle"
                >
                  {ils(v)}
                </text>
              ) : null}
              <text
                className="axis-label"
                x={x + barW / 2}
                y={H - 9}
                textAnchor="middle"
              >
                {r.label}
              </text>
            </g>
          );
        })}

        <line className="zero-line" x1={padSide} x2={W - padSide} y1={zeroY} y2={zeroY} />
      </svg>
    </div>
  );
}
