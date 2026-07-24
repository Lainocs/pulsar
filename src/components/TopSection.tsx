"use client";

import { useEffect, useState } from "react";
import type { SpotifyArtist, SpotifyTrack, TimeRange } from "@/lib/spotify/types";
import ArtistCard from "@/components/ArtistCard";
import TrackRow from "@/components/TrackRow";
import Reveal from "@/components/Reveal";

const ACCENTS = ["#00f0ff", "#ff2fd0", "#7c5cff", "#3dffb0", "#ffb020", "#ff5c5c", "#00f0ff", "#ff2fd0"];

const RANGES: { key: TimeRange; label: string }[] = [
  { key: "short_term", label: "4 dernières semaines" },
  { key: "medium_term", label: "6 derniers mois" },
  { key: "long_term", label: "Depuis toujours" },
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
    if (cache[range]) return; // already fetched (or seeded) this range
    let cancelled = false;
    Promise.all([
      fetch(`/api/top-artists?range=${range}`).then((r) => r.json()),
      fetch(`/api/top-tracks?range=${range}`).then((r) => r.json()),
    ]).then(([a, t]) => {
      if (cancelled) return;
      setCache((prev) => ({ ...prev, [range]: { artists: a.items ?? [], tracks: t.items ?? [] } }));
      setLoading(false);
    });
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
  const maxPopularity = Math.max(1, ...artists.map((a) => a.popularity));

  return (
    <>
      <div className="flex flex-wrap gap-2.5 mb-10">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => selectRange(r.key)}
            className={`range-tab ${range === r.key ? "is-active" : ""}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <section id="artists" className="mb-24">
        <Reveal className="mb-9">
          <div className="eyebrow">Top Artistes</div>
          <h2 className="text-[2rem] font-bold tracking-tight mt-2">Ceux qui tournent en boucle</h2>
          <p className="mt-2 max-w-md" style={{ color: "var(--text-dim)" }}>
            Survole une carte : l&apos;artiste sort de son cadre.
          </p>
        </Reveal>
        <div
          className="artist-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity"
          style={{ opacity: loading ? 0.5 : 1 }}
        >
          {artists.map((artist, i) => (
            <Reveal key={artist.id}>
              <ArtistCard artist={artist} rank={i + 1} accent={ACCENTS[i % ACCENTS.length]} maxPopularity={maxPopularity} />
            </Reveal>
          ))}
        </div>
        {artists.length === 0 && !loading && (
          <p style={{ color: "var(--text-dim)" }}>Pas assez de données Spotify pour cette période.</p>
        )}
      </section>

      <section id="tracks">
        <Reveal className="mb-9">
          <div className="eyebrow">Top Titres</div>
          <h2 className="text-[2rem] font-bold tracking-tight mt-2">La playlist qui ne meurt jamais</h2>
          <p className="mt-2 max-w-md" style={{ color: "var(--text-dim)" }}>
            Les morceaux les plus rejoués sur la période.
          </p>
        </Reveal>
        <Reveal>
          <div
            className="rounded-[18px] overflow-hidden border transition-opacity"
            style={{ borderColor: "var(--panel-border)", opacity: loading ? 0.5 : 1 }}
          >
            {tracks.map((track, i) => (
              <TrackRow key={track.id} track={track} rank={i + 1} accent={ACCENTS[i % ACCENTS.length]} />
            ))}
          </div>
        </Reveal>
        {tracks.length === 0 && !loading && (
          <p style={{ color: "var(--text-dim)" }}>Pas assez de données Spotify pour cette période.</p>
        )}
      </section>
    </>
  );
}
