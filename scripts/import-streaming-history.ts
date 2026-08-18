/**
 * Imports Spotify's "Extended streaming history" GDPR export into the
 * listening-history database, so stats aren't limited to whatever the
 * poller has accumulated since you set this up.
 *
 * How to get the export: on Spotify, go to Account -> Privacy settings ->
 * "Request data" and pick *Extended streaming history* specifically (the
 * basic export doesn't include per-stream listening data). Spotify emails
 * a download link, but it can take several days to a couple of weeks to
 * arrive.
 *
 * Usage:
 *   npm run import:history -- ./path/to/extracted/export/folder
 *
 * Looks for every "Streaming_History_Audio_*.json" file in that folder
 * (recursively) — podcast/video entries are skipped, we only track music.
 * Safe to re-run: duplicate plays are ignored via the DB's unique
 * constraint on (played_at, track_name, artist_name).
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { recordPlays, type PlayRecord } from "../src/lib/history";

interface RawStreamEntry {
  ts: string;
  ms_played: number;
  master_metadata_track_name: string | null;
  master_metadata_album_artist_name: string | null;
  master_metadata_album_album_name: string | null;
  spotify_track_uri: string | null;
}

const BATCH_SIZE = 500;

async function findHistoryFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findHistoryFiles(full)));
    } else if (/^Streaming_History_Audio_.*\.json$/i.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function trackIdFromUri(uri: string | null): string | null {
  if (!uri) return null;
  const parts = uri.split(":");
  return parts[parts.length - 1] || null;
}

async function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error("Usage: npm run import:history -- ./path/to/extracted/export/folder");
    process.exit(1);
  }

  const dirStat = await stat(dir).catch(() => null);
  if (!dirStat?.isDirectory()) {
    console.error(`Not a directory: ${dir}`);
    process.exit(1);
  }

  const files = await findHistoryFiles(dir);
  if (files.length === 0) {
    console.error(`No Streaming_History_Audio_*.json files found under ${dir}`);
    process.exit(1);
  }
  console.log(`Found ${files.length} history file(s).`);

  let totalRaw = 0;
  let totalSkipped = 0;
  let totalInserted = 0;
  let batch: PlayRecord[] = [];

  async function flush() {
    if (batch.length === 0) return;
    const { inserted } = await recordPlays(batch);
    totalInserted += inserted;
    batch = [];
  }

  for (const file of files) {
    const raw = JSON.parse(await readFile(file, "utf-8")) as RawStreamEntry[];
    totalRaw += raw.length;

    for (const entry of raw) {
      if (!entry.master_metadata_track_name || !entry.spotify_track_uri) {
        totalSkipped++; // podcast/video/local-file entry — not music we can attribute
        continue;
      }

      batch.push({
        playedAt: entry.ts,
        trackId: trackIdFromUri(entry.spotify_track_uri),
        trackName: entry.master_metadata_track_name,
        artistName: entry.master_metadata_album_artist_name ?? "Unknown",
        albumName: entry.master_metadata_album_album_name,
        durationMs: entry.ms_played, // real track length isn't in the export
        msPlayed: entry.ms_played, // this IS the real listened duration
        source: "import",
      });

      if (batch.length >= BATCH_SIZE) {
        process.stdout.write(`\rImporting… ${totalInserted} new rows so far`);
        await flush();
      }
    }
  }
  await flush();

  console.log(`\n\nDone. ${totalRaw} raw entries, ${totalSkipped} skipped (podcasts/video), ${totalInserted} new plays recorded.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
