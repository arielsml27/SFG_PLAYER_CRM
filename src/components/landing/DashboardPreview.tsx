const RINGS: { label: string; value: number }[] = [
  { label: "מקצועי", value: 82 },
  { label: "גופני", value: 71 },
  { label: "מדיה", value: 64 },
];

const BARS = [38, 55, 46, 68, 60, 78, 90];

function Ring({ label, value }: { label: string; value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="var(--lp-gold)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="text-center -mt-11">
        <div className="text-sm font-bold" style={{ color: "var(--lp-fg)" }}>
          {value}
        </div>
      </div>
      <div className="text-[11px] mt-3" style={{ color: "var(--lp-muted)" }}>
        {label}
      </div>
    </div>
  );
}

export default function DashboardPreview() {
  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div
        className="absolute -inset-10 rounded-full lp-glow"
        style={{ background: "radial-gradient(circle, rgba(227,181,99,0.22), transparent 70%)" }}
        aria-hidden
      />
      <div className="lp-glass lp-float relative rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs" style={{ color: "var(--lp-muted)" }}>
              ברוך שובך
            </div>
            <div className="text-lg font-bold">אריאל כהן</div>
          </div>
          <div className="lp-glass rounded-full px-4 py-1.5 text-xs font-semibold" style={{ color: "var(--lp-gold-soft)" }}>
            ציון קריירה · 87
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {RINGS.map((r) => (
            <div key={r.label} className="lp-glass rounded-2xl py-4">
              <Ring label={r.label} value={r.value} />
            </div>
          ))}
        </div>

        <div className="lp-glass rounded-2xl p-4 flex items-end gap-2 h-24 mb-6">
          {BARS.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md"
              style={{
                height: `${h}%`,
                background: "linear-gradient(180deg, var(--lp-gold-soft), rgba(227,181,99,0.15))",
              }}
            />
          ))}
        </div>

        <div className="lp-glass rounded-2xl px-4 py-3 flex items-center justify-between">
          <div className="text-sm font-medium">הבא בתור: בדיקה גופנית</div>
          <div className="text-xs" style={{ color: "var(--lp-muted)" }}>
            בעוד 3 ימים
          </div>
        </div>
      </div>
    </div>
  );
}
