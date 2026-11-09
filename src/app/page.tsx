import NowPlaying from "@/components/NowPlaying";
import TopSection from "@/components/TopSection";
import HistorySection from "@/components/HistorySection";
import { getNowPlaying, getStatsSummary, getTopArtists, getTopTracks } from "@/lib/spotify/api";
import { getListeningStats, type ListeningStats } from "@/lib/history";
import type { StatsSummary } from "@/lib/spotify/types";
import { formatNumber } from "@/lib/format";

const EMPTY_HISTORY: ListeningStats = {
  totalMinutes: 0,
  trackedDays: 0,
  currentStreakDays: 0,
  earliestPlayedAt: null,
  topArtists: [],
  topTracks: [],
  topAlbums: [],
  dailyActivity: [],
};

// This route renders dynamically on every request because getNowPlaying()
// always fetches fresh (`cache: "no-store"`). The top-artists/top-tracks/
// stats calls still hit Next's fetch cache independently (see
// lib/spotify/api.ts revalidateSeconds), so Spotify's rate limits stay safe.
export const dynamic = "force-dynamic";

export default async function Home() {
  let data;
  try {
    const [nowPlaying, stats, artists, tracks] = await Promise.all([
      getNowPlaying(),
      getStatsSummary(),
      getTopArtists("medium_term", 8),
      getTopTracks("medium_term", 10),
    ]);
    data = { nowPlaying, stats, artists, tracks };
  } catch (err) {
    console.error("[page] Spotify not configured yet:", err);
    return <SetupNotice />;
  }
  const { nowPlaying, stats, artists, tracks } = data;

  let history = EMPTY_HISTORY;
  try {
    history = await getListeningStats();
  } catch (err) {
    console.error("[page] listening-history DB not reachable:", err);
  }

  return (
    <div className="page">
      <header className="masthead">
        <a href="#now" className="wordmark">
          pulsar
        </a>
        <nav className="text-[0.95rem]">
          <a href="#temps">le temps passé</a>
          <a href="#classement">le classement</a>
        </nav>
      </header>

      <main>
        <NowPlaying initialData={nowPlaying} />
        <HistorySection stats={history} />
        <TopSection initialArtists={artists} initialTracks={tracks} />
        <AccountNotes stats={stats} />
      </main>

      <footer className="colophon text-[0.95rem]">
        <span>Les écoutes sont relevées toutes les 10 minutes.</span>
        <a href="https://github.com/Lainocs/pulsar" target="_blank" rel="noopener noreferrer">
          Le code est sur GitHub
        </a>
      </footer>
    </div>
  );
}

function AccountNotes({ stats }: { stats: StatsSummary }) {
  const genres = stats.genreBreakdown.slice(0, 6).map((g) => g.genre);
  return (
    <section className="block">
      <h3>En vrac</h3>
      <p className="lede" style={{ marginTop: 0 }}>
        <strong>{formatNumber(stats.savedTrackCount)}</strong> titres likés,{" "}
        <strong>{formatNumber(stats.followedArtistCount)}</strong> artistes suivis,{" "}
        <strong>{formatNumber(stats.playlistCount)}</strong> playlists. Les 50 derniers morceaux
        représentent <strong>{formatNumber(stats.recentMinutes)}</strong> minutes.
        {genres.length > 0 && <> Les genres qui reviennent le plus : {genres.join(", ")}.</>}
      </p>
    </section>
  );
}

function SetupNotice() {
  return (
    <div className="page">
      <header className="masthead">
        <span className="wordmark">pulsar</span>
      </header>
      <main className="now">
        <h1 className="now-intro">Pas encore branché.</h1>
        <p className="lede">
          Il manque les variables Spotify (client ID, secret, refresh token). Tout est expliqué dans le{" "}
          <code className="mono">README.md</code> : créer l&apos;app Spotify, remplir{" "}
          <code className="mono">.env.local</code>, puis passer par{" "}
          <code className="mono">/api/auth/login?key=…</code> pour récupérer le refresh token.
        </p>
      </main>
    </div>
  );
}
