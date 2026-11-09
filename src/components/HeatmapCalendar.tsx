const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function shade(minutes: number, max: number): string {
  if (minutes <= 0) return "var(--faint)";
  const ratio = Math.min(minutes / max, 1);
  // 4 steps, from a light wash of the accent to the full accent
  const pct = [30, 55, 78, 100][Math.min(3, Math.floor(ratio * 4))];
  return `color-mix(in srgb, var(--accent) ${pct}%, var(--faint))`;
}

export default function HeatmapCalendar({ data }: { data: { day: string; minutes: number }[] }) {
  const byDay = new Map(data.map((d) => [d.day, d.minutes]));
  // Cap the scale so one marathon day doesn't wash out everything else.
  const sorted = data.map((d) => d.minutes).sort((a, b) => a - b);
  const max = Math.max(1, sorted[Math.floor(sorted.length * 0.95)] ?? 1);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 7 * 26);
  // weeks start on Monday
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  const cells: React.ReactNode[] = [];
  const cursor = new Date(start);
  let lastMonth = -1;
  let week = 0;
  while (cursor <= today) {
    if (cursor.getDay() === 1) {
      const month = cursor.getMonth();
      cells.push(
        <span key={`m${week}`} className="month">
          {month !== lastMonth && cursor.getDate() <= 7 ? MONTHS[month] : ""}
        </span>
      );
      if (cursor.getDate() <= 7) lastMonth = month;
      week++;
    }
    const minutes = byDay.get(dayKey(cursor)) ?? 0;
    cells.push(
      <span
        key={dayKey(cursor)}
        className="cell"
        title={`${cursor.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} : ${minutes} min`}
        style={{ background: shade(minutes, max) }}
      />
    );
    cursor.setDate(cursor.getDate() + 1);
  }

  return (
    <div className="heatmap">
      <div className="heatmap-grid">{cells}</div>
      <p className="mono muted mt-2">Six derniers mois, un carré par jour. Plus c&apos;est rouge, plus j&apos;ai écouté.</p>
    </div>
  );
}
