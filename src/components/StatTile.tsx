import CountUp from "@/components/CountUp";

export default function StatTile({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent: string;
}) {
  return (
    <div className="stat-card p-6" style={{ ["--accent" as string]: accent }}>
      <div className="stat-value text-[2.1rem] font-bold">
        <CountUp value={value} />
      </div>
      <div className="mt-1.5 text-[0.85rem]" style={{ color: "var(--text-dim)" }}>
        {label}
      </div>
    </div>
  );
}
