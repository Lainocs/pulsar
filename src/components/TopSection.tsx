"use client";

import { useEffect, useState } from "react";
import type { SpotifyArtist, SpotifyTrack, TimeRange } from "@/lib/spotify/types";
import ArtistCard from "@/components/ArtistCard";
import TrackRow from "@/components/TrackRow";

const RANGES: { key: TimeRange; label: string }[] = [
  { key: "short_term", label: "le dernier mois" },
  { key: "medium_term", label: "6 mois" },
  { key: "long_term", label: "depuis le début" },
];

export default function TopSection({
  initialArtists,
  initialTracks,
}: {
  initialArtists: SpotifyArtist[];
  initialTracks: SpotifyTrack[];
}) {
  const [range, setRange] = useState<TimeRange>("medium_term");
  const [cache, setCache] = useState<
    Partial<Record<TimeRange, { artists: SpotifyArtist[]; tracks: SpotifyTrack[] }>>
  >({ medium_term: { artists: initialArtists, tracks: initialTracks } });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cache[range]) return;
    let cancelled = false;
    Promise.all([
      fetch(`/api/top-artists?range=${range}`).then((r) => r.json()),
      fetch(`/api/top-tracks?range=${range}`).then((r) => r.json()),
    ])
      .then(([a, t]) => {
        if (cancelled) return;
        setCache((prev) => ({
          ...prev,
          [range]: { artists: a.items ?? [], tracks: (t.items ?? []).slice(0, 10) },
        }));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  function selectRange(next: TimeRange) {
    if (!cache[next]) setLoading(true);
    setRange(next);
  }

  const { artists, tracks } = cache[range] ?? { artists: [], tracks: [] };

  return (
    <section id="classement" className="block">
      <div className="section-head">
        <h2>Le classement</h2>
        <div className="range" role="group" aria-label="Période">
          {RANGES.map((r) => (
            <button key={r.key} onClick={() => selectRange(r.key)} aria-pressed={range === r.key}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <p className="lede">
        Celui que Spotify calcule de son côté. Il ne dit pas comment, et il ne tombe pas toujours
        d&apos;accord avec mes minutes réelles au-dessus.
      </p>

      <div style={{ opacity: loading ? 0.4 : 1, transition: "opacity .2s" }}>
        <h3 className="mt-10">Artistes</h3>
        {artists.length > 0 ? (
          <ol className="artists">
            {artists.map((artist, i) => (
              <ArtistCard key={artist.id} artist={artist} rank={i + 1} />
            ))}
          </ol>
        ) : (
          !loading && <p className="muted">Pas assez de données sur cette période.</p>
        )}

        <h3 className="mt-12">Morceaux</h3>
        {tracks.length > 0 ? (
          <ol className="tracks">
            {tracks.map((track, i) => (
              <TrackRow key={track.id} track={track} rank={i + 1} />
            ))}
          </ol>
        ) : (
          !loading && <p className="muted">Pas assez de données sur cette période.</p>
        )}
      </div>
    </section>
  );
}
