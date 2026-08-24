import StatTile from "@/components/StatTile";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import type { StatsSummary } from "@/lib/spotify/types";

export default function StatsRow({ stats }: { stats: StatsSummary }) {
  const tiles = [
    { value: stats.recentMinutes, label: "minutes écoutées (50 derniers titres)", accent: "var(--cyan)" },
    { value: stats.followedArtistCount, label: "artistes suivis", accent: "var(--magenta)" },
    { value: stats.savedTrackCount, label: "titres likés", accent: "var(--violet)" },
    { value: stats.playlistCount, label: "playlists", accent: "var(--green)" },
  ];

  return (
    <section id="stats" className="mb-28">
      <Reveal>
        <SectionHeading
          index="02"
          eyebrow="Vue d'ensemble"
          title="Le résumé, sans filtre"
          description={
            <>
              Des chiffres réels, tirés directement de mon compte Spotify.
              {stats.topGenre && (
                <>
                  {" "}
                  Genre dominant en ce moment : <b style={{ color: "var(--text)" }}>{stats.topGenre}</b>.
                </>
              )}
            </>
          }
        />
      </Reveal>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        {tiles.map((t) => (
          <Reveal key={t.label}>
            <StatTile value={t.value} label={t.label} accent={t.accent} />
          </Reveal>
        ))}
      </div>

      {stats.genreBreakdown.length > 0 && (
        <Reveal className="mt-6">
          <div className="flex flex-wrap gap-2">
            {stats.genreBreakdown.map((g) => (
              <span
                key={g.genre}
                className="font-mono text-[0.72rem] px-3 py-1.5 rounded-full border"
                style={{ borderColor: "var(--panel-border)", color: "var(--text-dim)" }}
              >
                {g.genre} · {g.count}
              </span>
            ))}
          </div>
        </Reveal>
      )}
    </section>
  );
}
