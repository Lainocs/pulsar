import { getDb } from "./db";

export interface PlayRecord {
  playedAt: string; // ISO 8601
  trackId?: string | null;
  trackName: string;
  artistName: string;
  artistId?: string | null;
  albumName?: string | null;
  durationMs: number;
  msPlayed: number; // actual listened duration; falls back to durationMs when unknown
  source: "poll" | "import";
}

export async function recordPlays(plays: PlayRecord[]): Promise<{ inserted: number }> {
  if (plays.length === 0) return { inserted: 0 };
  const db = await getDb();

  let inserted = 0;
  const batch = plays.map((p) => ({
    sql: `INSERT OR IGNORE INTO plays
      (played_at, track_id, track_name, artist_name, artist_id, album_name, duration_ms, ms_played, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      p.playedAt,
      p.trackId ?? null,
      p.trackName,
      p.artistName,
      p.artistId ?? null,
      p.albumName ?? null,
      p.durationMs,
      p.msPlayed,
      p.source,
    ],
  }));

  const results = await db.batch(batch, "write");
  for (const r of results) inserted += r.rowsAffected;
  return { inserted };
}

export interface ListeningStats {
  totalMinutes: number;
  trackedDays: number;
  currentStreakDays: number;
  earliestPlayedAt: string | null;
  topArtists: { name: string; minutes: number; plays: number }[];
  topTracks: { name: string; artist: string; minutes: number; plays: number }[];
  topAlbums: { name: string; artist: string; minutes: number; plays: number }[];
  dailyActivity: { day: string; minutes: number }[]; // last ~20 weeks, for a heatmap
}

export async function getListeningStats(): Promise<ListeningStats> {
  const db = await getDb();

  const [totals, artists, tracks, albums, daily, distinctDays] = await Promise.all([
    db.execute(`SELECT SUM(ms_played) AS ms, MIN(played_at) AS earliest FROM plays`),
    db.execute(`
      SELECT artist_name AS name, SUM(ms_played) AS ms, COUNT(*) AS plays
      FROM plays GROUP BY artist_name ORDER BY ms DESC LIMIT 8
    `),
    db.execute(`
      SELECT track_name AS name, artist_name AS artist, SUM(ms_played) AS ms, COUNT(*) AS plays
      FROM plays GROUP BY track_name, artist_name ORDER BY ms DESC LIMIT 8
    `),
    db.execute(`
      SELECT album_name AS name, artist_name AS artist, SUM(ms_played) AS ms, COUNT(*) AS plays
      FROM plays WHERE album_name IS NOT NULL
      GROUP BY album_name, artist_name ORDER BY ms DESC LIMIT 8
    `),
    db.execute(`
      SELECT date(played_at) AS day, SUM(ms_played) AS ms
      FROM plays WHERE played_at >= date('now', '-140 days')
      GROUP BY day ORDER BY day
    `),
    db.execute(`SELECT DISTINCT date(played_at) AS day FROM plays ORDER BY day DESC`),
  ]);

  const totalMs = Number(totals.rows[0]?.ms ?? 0);
  const earliest = (totals.rows[0]?.earliest as string | null) ?? null;

  const days = distinctDays.rows.map((r) => r.day as string);
  const currentStreakDays = computeStreak(days);

  return {
    totalMinutes: Math.round(totalMs / 60000),
    trackedDays: days.length,
    currentStreakDays,
    earliestPlayedAt: earliest,
    topArtists: artists.rows.map((r) => ({
      name: r.name as string,
      minutes: Math.round(Number(r.ms) / 60000),
      plays: Number(r.plays),
    })),
    topTracks: tracks.rows.map((r) => ({
      name: r.name as string,
      artist: r.artist as string,
      minutes: Math.round(Number(r.ms) / 60000),
      plays: Number(r.plays),
    })),
    topAlbums: albums.rows.map((r) => ({
      name: r.name as string,
      artist: r.artist as string,
      minutes: Math.round(Number(r.ms) / 60000),
      plays: Number(r.plays),
    })),
    dailyActivity: daily.rows.map((r) => ({
      day: r.day as string,
      minutes: Math.round(Number(r.ms) / 60000),
    })),
  };
}

function computeStreak(sortedDescDays: string[]): number {
  if (sortedDescDays.length === 0) return 0;
  const today = new Date();
  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

  let cursor = toDateStr(today);
  let streak = 0;
  const daySet = new Set(sortedDescDays);

  // Allow the streak to still count if today has no play yet but yesterday does.
  if (!daySet.has(cursor)) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    cursor = toDateStr(yesterday);
    if (!daySet.has(cursor)) return 0;
  }

  while (daySet.has(cursor)) {
    streak++;
    const d = new Date(cursor);
    d.setDate(d.getDate() - 1);
    cursor = toDateStr(d);
  }
  return streak;
}
