import Image from "next/image";
import type { SpotifyTrack } from "@/lib/spotify/types";
import { formatDuration } from "@/lib/format";

export default function TrackRow({ track, rank }: { track: SpotifyTrack; rank: number }) {
  const art = track.album.images.at(-1)?.url ?? track.album.images[0]?.url;

  return (
    <li>
      <a href={track.external_urls.spotify} target="_blank" rel="noopener noreferrer">
        <span className="mono muted">{rank}</span>
        <div className="track-cover">
          {art && <Image src={art} alt="" fill sizes="44px" className="object-cover" />}
        </div>
        <div className="min-w-0">
          <div className="track-name">{track.name}</div>
          <div className="track-artist">
            {track.artists.map((a) => a.name).join(", ")} — {track.album.name}
          </div>
        </div>
        <span className="mono muted">{formatDuration(track.duration_ms)}</span>
      </a>
    </li>
  );
}
