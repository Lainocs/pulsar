export default function Marquee({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  const loop = [...items, ...items];

  return (
    <div className="marquee">
      <div className="marquee-track">
        {loop.map((item, i) => (
          <span key={i}>
            {item}
            <em>✦</em>
          </span>
        ))}
      </div>
    </div>
  );
}
