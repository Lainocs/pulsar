"use client";

import { useRef } from "react";
import Image from "next/image";
import type { SpotifyArtist } from "@/lib/spotify/types";
import { getArtistCutout } from "@/lib/artist-cutouts";

export default function ArtistCard({
  artist,
  rank,
  accent,
  maxPopularity,
}: {
  artist: SpotifyArtist;
  rank: number;
  accent: string;
  maxPopularity: number;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const cutout = getArtistCutout(artist.id);
  const photo = artist.images[0]?.url ?? null;
  const pct = maxPopularity > 0 ? Math.round((artist.popularity / maxPopularity) * 100) : 0;

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `rotateX(${(-py * 12).toFixed(2)}deg) rotateY(${(px * 14).toFixed(2)}deg) translateY(-4px)`;
  }

  function handleMouseLeave() {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "rotateX(0deg) rotateY(0deg) translateY(0)";
  }

  return (
    <a
      href={artist.external_urls.spotify}
      target="_blank"
      rel="noopener noreferrer"
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="artist-card p-4.5 block"
      style={{ ["--accent" as string]: accent }}
    >
      <div
        className="absolute top-3.5 left-4 font-mono text-[0.75rem] tracking-[0.1em]"
        style={{ color: "var(--text-dim)" }}
      >
        #{String(rank).padStart(2, "0")}
      </div>
      {artist.genres[0] && (
        <div className="absolute top-3.5 right-4 font-mono text-[0.68rem]" style={{ color: accent }}>
          {artist.genres[0]}
        </div>
      )}

      {(cutout ?? photo) && (
        <div className={`artist-cutout-wrap ${cutout ? "" : "is-masked"}`}>
          <Image
            src={cutout ?? photo!}
            alt={artist.name}
            fill
            sizes="132px"
            className={`w-full h-full ${cutout ? "object-contain" : "object-cover"}`}
          />
        </div>
      )}

      <div data-z className="font-semibold text-[1.02rem] px-4 truncate">
        {artist.name}
      </div>
      <div data-z className="mt-2 h-[3px] rounded-full mx-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}, transparent)` }}
        />
      </div>
      <div data-z className="mb-4 px-4" />
    </a>
  );
}
