import { createClient, type Client } from "@libsql/client";
import { mkdirSync } from "node:fs";

let client: Client | null = null;
let migrated = false;

/**
 * Turso (libSQL) in production — required on Vercel, where the filesystem
 * isn't persistent across requests. Falls back to a local SQLite file for
 * local dev or a VPS with a real disk, so you can try the history features
 * without creating a Turso database first.
 */
function getClient(): Client {
  if (client) return client;

  if (process.env.TURSO_DATABASE_URL) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  } else {
    mkdirSync("./data", { recursive: true });
    client = createClient({ url: "file:./data/pulsar.db" });
  }
  return client;
}

async function migrate(db: Client) {
  if (migrated) return;
  await db.execute(`
    CREATE TABLE IF NOT EXISTS plays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      played_at TEXT NOT NULL,
      track_id TEXT,
      track_name TEXT NOT NULL,
      artist_name TEXT NOT NULL,
      artist_id TEXT,
      album_name TEXT,
      duration_ms INTEGER NOT NULL,
      ms_played INTEGER NOT NULL,
      source TEXT NOT NULL,
      UNIQUE(played_at, track_name, artist_name)
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_plays_artist ON plays(artist_name)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_plays_played_at ON plays(played_at)`);
  migrated = true;
}

export async function getDb(): Promise<Client> {
  const db = getClient();
  await migrate(db);
  return db;
}
