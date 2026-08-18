import Reveal from "@/components/Reveal";
import StatTile from "@/components/StatTile";
import RankedList from "@/components/RankedList";
import HeatmapCalendar from "@/components/HeatmapCalendar";
import type { ListeningStats } from "@/lib/history";
import { formatDate } from "@/lib/format";

export default function HistorySection({ stats }: { stats: ListeningStats }) {
  return (
    <section id="history" className="mb-24">
      <Reveal className="mb-9">
        <div className="eyebrow">Historique d&apos;écoute</div>
        <h2 className="text-[2rem] font-bold tracking-tight mt-2">Le vrai temps passé</h2>
        <p className="mt-2 max-w-md" style={{ color: "var(--text-dim)" }}>
          {stats.trackedDays > 0 ? (
            <>
              Suivi depuis le {formatDate(stats.earliestPlayedAt!)} — {stats.trackedDays} jour
              {stats.trackedDays > 1 ? "s" : ""} avec au moins une écoute enregistrée.
            </>
          ) : (
            <>
              Rien d&apos;enregistré pour l&apos;instant. Le suivi automatique se construit toutes
              les 10 minutes — ou importe ton export Spotify (<code>npm run import:history</code>)
              pour un résultat immédiat.
            </>
          )}
        </p>
      </Reveal>

      {stats.trackedDays === 0 ? (
        <Reveal>
          <div className="stat-card p-8 text-center" style={{ ["--accent" as string]: "var(--violet)" }}>
            <p style={{ color: "var(--text-dim)" }}>
              Cette section se remplit toute seule — reviens dans quelques heures, ou lance
              l&apos;import de ton historique Spotify pour voir tout de suite tes vraies stats
              (voir <code>README.md</code>).
            </p>
          </div>
        </Reveal>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5 mb-10">
            <Reveal>
              <StatTile value={stats.totalMinutes} label="minutes réellement écoutées" accent="var(--cyan)" />
            </Reveal>
            <Reveal>
              <StatTile value={stats.trackedDays} label="jours trackés" accent="var(--magenta)" />
            </Reveal>
            <Reveal>
              <StatTile value={stats.currentStreakDays} label="jours d'écoute consécutifs" accent="var(--green)" />
            </Reveal>
          </div>

          <Reveal className="mb-10">
            <div className="rounded-[18px] border p-5" style={{ borderColor: "var(--panel-border)" }}>
              <HeatmapCalendar data={stats.dailyActivity} />
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Reveal>
              <RankedList
                title="Top artistes"
                accent="var(--cyan)"
                items={stats.topArtists.map((a) => ({ primary: a.name, minutes: a.minutes }))}
              />
            </Reveal>
            <Reveal>
              <RankedList
                title="Top titres"
                accent="var(--magenta)"
                items={stats.topTracks.map((t) => ({ primary: t.name, secondary: t.artist, minutes: t.minutes }))}
              />
            </Reveal>
            <Reveal>
              <RankedList
                title="Top albums"
                accent="var(--violet)"
                items={stats.topAlbums.map((a) => ({ primary: a.name, secondary: a.artist, minutes: a.minutes }))}
              />
            </Reveal>
          </div>
        </>
      )}
    </section>
  );
}
