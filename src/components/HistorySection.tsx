import RankedList from "@/components/RankedList";
import HeatmapCalendar from "@/components/HeatmapCalendar";
import type { ListeningStats } from "@/lib/history";
import { formatDate, formatNumber } from "@/lib/format";

export default function HistorySection({ stats }: { stats: ListeningStats }) {
  if (stats.trackedDays === 0) {
    return (
      <section id="temps" className="block">
        <h2>Le temps passé</h2>
        <p className="lede">
          Rien d&apos;enregistré pour l&apos;instant. Le relevé tourne toutes les 10 minutes, donc ça
          va se remplir tout seul. Pour avoir l&apos;historique complet d&apos;un coup, il y a{" "}
          <code className="mono">npm run import:history</code> avec l&apos;export Spotify.
        </p>
      </section>
    );
  }

  const hours = Math.round(stats.totalMinutes / 60);

  return (
    <section id="temps" className="block">
      <h2>Le temps passé</h2>
      <p className="lede">
        Ce sont de vraies minutes d&apos;écoute, comptées morceau par morceau depuis le{" "}
        {formatDate(stats.earliestPlayedAt!)}. Pas le classement maison de Spotify.
      </p>

      <div className="figures">
        <div>
          <div className="figure">
            {formatNumber(hours)}
            <small>h</small>
          </div>
          <div className="muted text-[0.95rem] mt-1">soit {formatNumber(stats.totalMinutes)} minutes</div>
        </div>
        <div>
          <div className="figure">
            {formatNumber(stats.trackedDays)}
            <small>j</small>
          </div>
          <div className="muted text-[0.95rem] mt-1">avec au moins une écoute</div>
        </div>
        <div>
          <div className="figure">
            {formatNumber(stats.currentStreakDays)}
            <small>j</small>
          </div>
          <div className="muted text-[0.95rem] mt-1">d&apos;affilée, jusqu&apos;à aujourd&apos;hui</div>
        </div>
      </div>

      <HeatmapCalendar data={stats.dailyActivity} />

      <div className="lists">
        <RankedList title="Artistes" items={stats.topArtists.map((a) => ({ primary: a.name, minutes: a.minutes }))} />
        <RankedList
          title="Morceaux"
          items={stats.topTracks.map((t) => ({ primary: t.name, secondary: t.artist, minutes: t.minutes }))}
        />
        <RankedList
          title="Albums"
          items={stats.topAlbums.map((a) => ({ primary: a.name, secondary: a.artist, minutes: a.minutes }))}
        />
      </div>
    </section>
  );
}
