function bucket(minutes: number, max: number): number {
  if (minutes <= 0) return 0;
  const ratio = minutes / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

const BUCKET_COLORS = [
  "rgba(255,255,255,0.06)",
  "color-mix(in srgb, var(--cyan) 25%, transparent)",
  "color-mix(in srgb, var(--cyan) 50%, transparent)",
  "color-mix(in srgb, var(--cyan) 75%, transparent)",
  "var(--cyan)",
];

export default function HeatmapCalendar({ data }: { data: { day: string; minutes: number }[] }) {
  const byDay = new Map(data.map((d) => [d.day, d.minutes]));
  const max = Math.max(1, ...data.map((d) => d.minutes));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 139); // ~20 weeks
  // Align the grid to start on a Sunday for a clean weekly grid.
  start.setDate(start.getDate() - start.getDay());

  const weeks: { date: Date; minutes: number }[][] = [];
  let week: { date: Date; minutes: number }[] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    week.push({ date: new Date(cursor), minutes: byDay.get(key) ?? 0 });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (week.length > 0) weeks.push(week);

  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-2">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {w.map((d, di) => (
              <div
                key={di}
                title={`${d.date.toLocaleDateString("fr-FR")} — ${d.minutes} min`}
                className="w-[11px] h-[11px] rounded-[3px]"
                style={{ background: BUCKET_COLORS[bucket(d.minutes, max)] }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3 font-mono text-[0.68rem]" style={{ color: "var(--text-dim)" }}>
        <span>moins</span>
        {BUCKET_COLORS.map((c, i) => (
          <span key={i} className="w-[11px] h-[11px] rounded-[3px]" style={{ background: c }} />
        ))}
        <span>plus</span>
      </div>
    </div>
  );
}
