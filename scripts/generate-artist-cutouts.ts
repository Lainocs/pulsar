/**
 * One-off, offline asset generation script — NOT part of the deployed app.
 *
 * Fetches your top artists across all three Spotify time ranges, downloads
 * their photos, and runs AI background removal to produce transparent PNG
 * cutouts for the "pop-out" 3D artist cards. Results are written to
 * public/artists/ and committed to the repo like any other static asset.
 *
 * Run with: npm run generate:cutouts
 *
 * Uses @imgly/background-removal-node, which is AGPL-licensed. It only
 * runs here, offline, to produce plain PNG files — it is never imported by
 * the deployed Next.js app, so the running site isn't AGPL-encumbered.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getTopArtists } from "../src/lib/spotify/api";
import type { SpotifyArtist, TimeRange } from "../src/lib/spotify/types";

const OUTPUT_DIR = path.join(process.cwd(), "public", "artists");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.json");
const RANGES: TimeRange[] = ["short_term", "medium_term", "long_term"];

type Manifest = Record<string, { file: string; sourceUrl: string; updatedAt: string }>;

async function loadManifest(): Promise<Manifest> {
  try {
    return JSON.parse(await readFile(MANIFEST_PATH, "utf-8"));
  } catch {
    return {};
  }
}

async function collectTopArtists(): Promise<SpotifyArtist[]> {
  const byId = new Map<string, SpotifyArtist>();
  for (const range of RANGES) {
    const artists = await getTopArtists(range, 50, 0);
    for (const artist of artists) byId.set(artist.id, artist);
  }
  return [...byId.values()];
}

async function processArtist(artist: SpotifyArtist, manifest: Manifest): Promise<"done" | "skipped" | "failed"> {
  const sourceUrl = artist.images[0]?.url;
  if (!sourceUrl) return "skipped";

  const existing = manifest[artist.id];
  if (existing?.sourceUrl === sourceUrl) return "skipped"; // already processed, photo unchanged

  try {
    // Lazy import: keeps the (large, AGPL) model-loading library out of
    // every other script/route that imports lib/spotify/api.ts.
    const { removeBackground } = await import("@imgly/background-removal-node");
    const blob = await removeBackground(sourceUrl, {
      model: "small",
      output: { format: "image/png", quality: 1 },
    });
    const rawBuffer = Buffer.from(await blob.arrayBuffer());

    const trimmed = await sharp(rawBuffer)
      .trim()
      .resize({ width: 500, height: 500, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();

    const filename = `${artist.id}.png`;
    await writeFile(path.join(OUTPUT_DIR, filename), trimmed);

    manifest[artist.id] = {
      file: `artists/${filename}`,
      sourceUrl,
      updatedAt: new Date().toISOString(),
    };
    return "done";
  } catch (err) {
    console.error(`  ✗ ${artist.name}:`, err instanceof Error ? err.message : err);
    return "failed";
  }
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const manifest = await loadManifest();

  console.log("Fetching top artists across all time ranges…");
  const artists = await collectTopArtists();
  console.log(`Found ${artists.length} distinct artists.\n`);

  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const artist of artists) {
    process.stdout.write(`→ ${artist.name}… `);
    const result = await processArtist(artist, manifest);
    console.log(result);
    if (result === "done") done++;
    else if (result === "skipped") skipped++;
    else failed++;
  }

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  console.log(`\nDone. ${done} generated, ${skipped} skipped (unchanged), ${failed} failed.`);
  console.log("Artists without a cutout fall back to a masked circular photo automatically.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
