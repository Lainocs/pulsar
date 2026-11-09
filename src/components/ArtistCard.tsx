import Image from "next/image";
import type { SpotifyArtist } from "@/lib/spotify/types";

export default function ArtistCard({ artist, rank }: { artist: SpotifyArtist; rank: number }) {
  const photo = artist.images[0]?.url;
  const genre = artist.genres?.[0];

  return (
    <li>
      <a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer">
        <div className="artist-photo">
          {photo && (
            <Image src={photo} alt="" fill sizes="(min-width: 720px) 220px, 45vw" className="object-cover" />
          )}
        </div>
        <div className="artist-name">
          <span className="mono muted mr-1.5">{rank}.</span>
          {artist.name}
        </div>
        {genre && <div className="muted text-[0.9rem]">{genre}</div>}
      </a>
    </li>
  );
}
