import type { ReactNode } from "react";

export default function SectionHeading({
  index,
  eyebrow,
  title,
  description,
}: {
  index: string;
  eyebrow: string;
  title: string;
  description: ReactNode;
}) {
  return (
    <div className="section-heading">
      <span className="section-num" aria-hidden="true">
        {index}
      </span>
      <div className="min-w-0">
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="section-title">{title}</h2>
        <p className="mt-2 max-w-md" style={{ color: "var(--text-dim)" }}>
          {description}
        </p>
      </div>
    </div>
  );
}
