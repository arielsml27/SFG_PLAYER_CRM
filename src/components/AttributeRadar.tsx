const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 95;
const MAX_VALUE = 5;
const RINGS = 5;

function pointForAxis(index: number, total: number, radius: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
}

export default function AttributeRadar({ categories }: { categories: { label: string; value: number | null }[] }) {
  const n = categories.length;

  const ringPolygons = Array.from({ length: RINGS }, (_, ringIdx) => {
    const r = (RADIUS * (ringIdx + 1)) / RINGS;
    return categories.map((_, i) => pointForAxis(i, n, r)).map((p) => `${p.x},${p.y}`).join(" ");
  });

  const dataPoints = categories.map((c, i) => {
    const v = Math.max(0, Math.min(MAX_VALUE, c.value ?? 0));
    return pointForAxis(i, n, (RADIUS * v) / MAX_VALUE);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-sm mx-auto">
      {ringPolygons.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="var(--border)" strokeWidth={1} />
      ))}
      {categories.map((_, i) => {
        const p = pointForAxis(i, n, RADIUS);
        return <line key={i} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth={1} />;
      })}
      <polygon points={dataPolygon} fill="var(--gold)" fillOpacity={0.25} stroke="var(--gold)" strokeWidth={2} />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="var(--gold)" />
      ))}
      {categories.map((c, i) => {
        const p = pointForAxis(i, n, RADIUS + 28);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={12} fill="var(--muted)">
            {c.label}
          </text>
        );
      })}
      {categories.map((c, i) => {
        if (c.value === null) return null;
        const p = pointForAxis(i, n, RADIUS + 28);
        return (
          <text key={`v-${i}`} x={p.x} y={p.y + 14} textAnchor="middle" fontSize={11} fontWeight="bold" fill="var(--gold)">
            {c.value.toFixed(1)}
          </text>
        );
      })}
    </svg>
  );
}
