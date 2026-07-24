import manifest from "../../public/artists/manifest.json";

type CutoutManifest = Record<string, { file: string; updatedAt: string }>;

const typedManifest = manifest as CutoutManifest;

/**
 * Returns the public path to a pre-generated, background-removed PNG for
 * this artist, if `npm run generate:cutouts` has processed them yet.
 * Falls back to null so the UI can render the raw Spotify photo, masked,
 * instead.
 */
export function getArtistCutout(artistId: string): string | null {
  const entry = typedManifest[artistId];
  return entry ? `/${entry.file}` : null;
}
