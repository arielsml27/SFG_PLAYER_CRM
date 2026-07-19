import type { AttributeItem } from "@/lib/scouting";

export default function AttributeBarChart({ items }: { items: AttributeItem[] }) {
  const grouped = items.reduce<Record<string, AttributeItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, group]) => (
        <div key={category}>
          <h4 className="text-xs font-bold mb-2" style={{ color: "var(--muted)" }}>
            {category}
          </h4>
          <div className="space-y-1.5">
            {group.map((item) => (
              <div key={item.key} className="flex items-center gap-2 text-sm">
                <span className="w-44 shrink-0 truncate" title={item.label}>
                  {item.label}
                </span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(item.value / 5) * 100}%`, background: "var(--gold)" }}
                  />
                </div>
                <span className="w-8 shrink-0 text-left font-medium" style={{ color: "var(--gold)" }}>
                  {item.value.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
