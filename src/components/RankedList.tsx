export default function RankedList({
  title,
  items,
  accent,
}: {
  title: string;
  items: { primary: string; secondary?: string; minutes: number }[];
  accent: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.minutes));

  return (
    <div>
      <h3 className="font-semibold text-[1.1rem] mb-4">{title}</h3>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={`${item.primary}-${item.secondary ?? ""}`} className="flex items-center gap-3">
            <span className="font-mono text-[0.75rem] w-5 shrink-0" style={{ color: "var(--text-dim)" }}>
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium truncate">{item.primary}</span>
                <span className="font-mono text-[0.72rem] shrink-0" style={{ color: "var(--text-dim)" }}>
                  {item.minutes} min
                </span>
              </div>
              {item.secondary && (
                <div className="text-[0.75rem] truncate mb-1" style={{ color: "var(--text-dim)" }}>
                  {item.secondary}
                </div>
              )}
              <div className="h-[3px] rounded-full mt-1" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(item.minutes / max) * 100}%`, background: accent }}
                />
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>
            Pas encore assez de données.
          </p>
        )}
      </div>
    </div>
  );
}
