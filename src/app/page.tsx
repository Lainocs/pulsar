import Starfield from "@/components/Starfield";
import CursorGlow from "@/components/CursorGlow";
import SiteHeader from "@/components/SiteHeader";
import Marquee from "@/components/Marquee";
import NowPlaying from "@/components/NowPlaying";
import StatsRow from "@/components/StatsRow";
import TopSection from "@/components/TopSection";
import HistorySection from "@/components/HistorySection";
import { getNowPlaying, getStatsSummary, getTopArtists, getTopTracks } from "@/lib/spotify/api";
import { getListeningStats, type ListeningStats } from "@/lib/history";

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
      getTopTracks("medium_term", 8),
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

  const tickerItems =
    artists.length > 0
      ? artists.map((a) => a.name)
      : ["connecte ton compte Spotify", "pour voir tes vrais artistes ici"];

  return (
    <>
      <Starfield />
      <div className="grid-overlay" />
      <CursorGlow />

      <SiteHeader />
      <Marquee items={tickerItems} />

      <main className="relative z-[3] max-w-[1180px] mx-auto px-8">
        <section id="now" className="relative pt-28 pb-20 text-center overflow-hidden">
          <div className="hero-glow" />
          <span className="section-num hero-num" aria-hidden="true">
            01
          </span>
          <div className="relative z-[1]">
            <div className="eyebrow">{"// personal spotify intelligence"}</div>
            <div className="hero-title-wrap">
              <h1 className="title-gradient title-glow" aria-hidden="true">
                Pulsar
              </h1>
              <h1 className="title-gradient">Pulsar</h1>
            </div>
            <p className="max-w-[560px] mx-auto text-[1.05rem] leading-relaxed -mt-2" style={{ color: "var(--text-dim)" }}>
              Le battement de <b style={{ color: "var(--text)" }}>mes</b> écoutes, en temps réel. Artistes, titres,
              minutes obsessionnelles — tout ce que Spotify sait de moi, visualisé comme un cockpit.
            </p>

            <div className="max-w-[640px] mx-auto mt-14">
              <NowPlaying initialData={nowPlaying} />
            </div>
          </div>
        </section>

        <StatsRow stats={stats} />
        <HistorySection stats={history} />
        <TopSection initialArtists={artists} initialTracks={tracks} />
      </main>

      <footer className="relative z-[3] border-t mt-10" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div
          className="max-w-[1180px] mx-auto px-8 py-9 flex flex-wrap items-center justify-between gap-3 text-[0.85rem]"
          style={{ color: "var(--text-dim)" }}
        >
          <span>Pulsar — dashboard perso, connecté en direct à l&apos;API Spotify.</span>
          <a
            href="https://github.com/Lainocs/pulsar"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "var(--text)" }}
          >
            Voir sur GitHub
          </a>
        </div>
      </footer>
    </>
  );
}

function SetupNotice() {
  return (
    <>
      <Starfield />
      <div className="grid-overlay" />
      <main className="relative z-[3] max-w-[640px] mx-auto px-8 pt-32 text-center">
        <div className="eyebrow">{"// personal spotify intelligence"}</div>
        <h1 className="title-gradient is-compact mt-5 mb-6">Pulsar n&apos;est pas encore configuré</h1>
        <p className="text-[1.05rem] leading-relaxed" style={{ color: "var(--text-dim)" }}>
          Il manque des variables d&apos;environnement Spotify (client ID/secret, refresh token…).
          Suis le guide de <code style={{ color: "var(--cyan)" }}>README.md</code> — créer l&apos;app
          Spotify, remplir <code style={{ color: "var(--cyan)" }}>.env.local</code>, puis passer par{" "}
          <code style={{ color: "var(--cyan)" }}>/api/auth/login?key=…</code> pour obtenir un refresh
          token.
        </p>
      </main>
    </>
  );
}
