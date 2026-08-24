"use client";

import { useRef } from "react";
import Image from "next/image";
import type { SpotifyArtist } from "@/lib/spotify/types";

export default function ArtistCard({
  artist,
  rank,
  accent,
  maxPopularity,
  priority = false,
}: {
  artist: SpotifyArtist;
  rank: number;
  accent: string;
  maxPopularity: number;
  priority?: boolean;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const photo = artist.images[0]?.url ?? null;
  const pct = maxPopularity > 0 ? Math.round((artist.popularity / maxPopularity) * 100) : 0;

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    card.style.setProperty("--mask-r", "130px");
    card.style.transform = `rotateX(${(-(py - 0.5) * 10).toFixed(2)}deg) rotateY(${((px - 0.5) * 12).toFixed(2)}deg) translateY(-6px) scale(1.015)`;
  }

  function handleMouseLeave() {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--mask-r", "0px");
    card.style.transform = "rotateX(0deg) rotateY(0deg) translateY(0) scale(1)";
  }

  return (
    <a
      href={artist.external_urls.spotify}
      target="_blank"
      rel="noopener noreferrer"
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="artist-card-v2 block"
      style={{ ["--accent" as string]: accent }}
    >
      <span className="artist-ghost-rank" aria-hidden="true">
        {String(rank).padStart(2, "0")}
      </span>

      {photo && (
        <>
          <div className="artist-photo-layer artist-photo-mono">
            <Image src={photo} alt="" fill sizes="(min-width: 1024px) 280px, 45vw" className="object-cover" priority={priority} />
          </div>
          <div className="artist-photo-layer artist-photo-color">
            <Image src={photo} alt={artist.name} fill sizes="(min-width: 1024px) 280px, 45vw" className="object-cover" priority={priority} />
          </div>
        </>
      )}

      <div className="artist-card-scrim" />
      <div className="artist-card-noise" aria-hidden="true" />

      <div className="artist-card-content">
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-[0.68rem] tracking-[0.15em] uppercase" style={{ color: accent }}>
            {artist.genres?.[0] ?? "artiste"}
          </span>
          <span className="font-mono text-[0.65rem]" style={{ color: "var(--text-dim)" }}>
            {artist.popularity}%
          </span>
        </div>

        <div className="artist-card-name-row">
          <h3 className="artist-card-name">{artist.name}</h3>
          <span className="artist-card-arrow" style={{ color: accent }}>
            ↗
          </span>
        </div>

        <div className="mt-2.5 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}, transparent)` }}
          />
        </div>
      </div>
    </a>
  );
}
