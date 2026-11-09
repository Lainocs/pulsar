import { formatNumber } from "@/lib/format";

export default function RankedList({
  title,
  items,
}: {
  title: string;
  items: { primary: string; secondary?: string; minutes: number }[];
}) {
  return (
    <div>
      <h3 className="flex justify-between items-baseline">
        {title}
        <span className="mono muted" style={{ fontWeight: 400 }}>
          min
        </span>
      </h3>
      {items.length === 0 ? (
        <p className="muted">Pas encore assez de données.</p>
      ) : (
        <ol className="ranked">
          {items.map((item, i) => (
            <li key={`${item.primary}-${item.secondary ?? ""}`}>
              <span className="mono muted">{i + 1}</span>
              <span className="name">
                {item.primary}
                {item.secondary && <span className="sub">{item.secondary}</span>}
              </span>
              <span className="mono">{formatNumber(item.minutes)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
