import Image from "next/image";
import type { SpotifyTrack } from "@/lib/spotify/types";
import { formatDuration } from "@/lib/format";

// Deterministic pseudo-waveform derived from the track id, so server and
// client render identical bars (no hydration mismatch from Math.random()).
function waveformHeights(id: string, count = 14): number[] {
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) >>> 0;
  return Array.from({ length: count }, (_, i) => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return 4 + (seed % 17) + ((i * 7) % 5);
  });
}

export default function TrackRow({
  track,
  rank,
  accent,
}: {
  track: SpotifyTrack;
  rank: number;
  accent: string;
}) {
  const art = track.album.images[0]?.url;
  const bars = waveformHeights(track.id);

  return (
    <a
      href={track.external_urls.spotify}
      target="_blank"
      rel="noopener noreferrer"
      className="track-row px-5 py-4"
      style={{ ["--accent" as string]: accent }}
    >
      <div className="font-mono text-[0.85rem]" style={{ color: "var(--text-dim)" }}>
        {String(rank).padStart(2, "0")}
      </div>
      <div className="track-art relative w-[54px] h-[54px] rounded-xl overflow-hidden" style={{ background: accent }}>
        {art && <Image src={art} alt={track.album.name} fill sizes="54px" className="object-cover" />}
        <span className="track-art-play" style={{ color: accent }}>
          ▶
        </span>
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-[0.94rem] truncate">{track.name}</div>
        <div className="text-[0.82rem] truncate mt-0.5" style={{ color: "var(--text-dim)" }}>
          {track.artists.map((a) => a.name).join(", ")}
        </div>
      </div>
      <div className="track-waveform hidden sm:flex items-center gap-[2px] h-5">
        {bars.map((h, i) => (
          <span key={i} style={{ height: `${h}px` }} />
        ))}
      </div>
      <div className="font-mono text-[0.78rem] text-right" style={{ color: "var(--text-dim)" }}>
        {formatDuration(track.duration_ms)}
      </div>
    </a>
  );
}
