import { getAccessToken } from "./token";
import type {
  CurrentlyPlaying,
  SpotifyArtist,
  SpotifyTrack,
  StatsSummary,
  TimeRange,
} from "./types";

const API_BASE = "https://api.spotify.com/v1";

async function spotifyFetch<T>(
  path: string,
  revalidateSeconds?: number
): Promise<T | null> {
  const accessToken = await getAccessToken();

  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    ...(revalidateSeconds !== undefined
      ? { next: { revalidate: revalidateSeconds } }
      : { cache: "no-store" as const }),
  });

  if (res.status === 204) return null; // e.g. nothing currently playing
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify API ${path} failed (${res.status}): ${body}`);
  }
  return (await res.json()) as T;
}

function pickImage(images: { url: string }[] | undefined): string | null {
  return images && images.length > 0 ? images[0].url : null;
}

export async function getNowPlaying(): Promise<CurrentlyPlaying> {
  const current = await spotifyFetch<{
    is_playing: boolean;
    progress_ms: number | null;
    item: SpotifyTrack | null;
  }>("/me/player/currently-playing");

  if (current?.item) {
    return {
      isPlaying: current.is_playing,
      isLive: true,
      progressMs: current.progress_ms ?? 0,
      track: {
        id: current.item.id,
        name: current.item.name,
        artists: current.item.artists.map((a) => a.name).join(", "),
        albumName: current.item.album.name,
        albumImage: pickImage(current.item.album.images),
        durationMs: current.item.duration_ms,
        url: current.item.external_urls.spotify,
      },
    };
  }

  // Nothing playing right now — fall back to the last played track so the
  // widget never shows an empty state on a public profile.
  const recent = await spotifyFetch<{
    items: { played_at: string; track: SpotifyTrack }[];
  }>("/me/player/recently-played?limit=1");

  const last = recent?.items?.[0];
  if (!last) {
    return { isPlaying: false, isLive: false, progressMs: 0, track: null };
  }

  return {
    isPlaying: false,
    isLive: false,
    progressMs: 0,
    playedAt: last.played_at,
    track: {
      id: last.track.id,
      name: last.track.name,
      artists: last.track.artists.map((a) => a.name).join(", "),
      albumName: last.track.album.name,
      albumImage: pickImage(last.track.album.images),
      durationMs: last.track.duration_ms,
      url: last.track.external_urls.spotify,
    },
  };
}

export async function getTopArtists(
  timeRange: TimeRange,
  limit = 8,
  revalidateSeconds = 3600
): Promise<SpotifyArtist[]> {
  const data = await spotifyFetch<{ items: SpotifyArtist[] }>(
    `/me/top/artists?time_range=${timeRange}&limit=${limit}`,
    revalidateSeconds
  );
  return data?.items ?? [];
}

export async function getTopTracks(
  timeRange: TimeRange,
  limit = 8,
  revalidateSeconds = 3600
): Promise<SpotifyTrack[]> {
  const data = await spotifyFetch<{ items: SpotifyTrack[] }>(
    `/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
    revalidateSeconds
  );
  return data?.items ?? [];
}

export async function getStatsSummary(
  revalidateSeconds = 3600
): Promise<StatsSummary> {
  const [playlists, savedTracks, following, topArtistsForGenres, recentlyPlayed] =
    await Promise.all([
      spotifyFetch<{ total: number }>("/me/playlists?limit=1", revalidateSeconds),
      spotifyFetch<{ total: number }>("/me/tracks?limit=1", revalidateSeconds),
      spotifyFetch<{ artists: { total: number } }>(
        "/me/following?type=artist&limit=1",
        revalidateSeconds
      ),
      spotifyFetch<{ items: SpotifyArtist[] }>(
        "/me/top/artists?time_range=long_term&limit=50",
        revalidateSeconds
      ),
      spotifyFetch<{ items: { track: SpotifyTrack }[] }>(
        "/me/player/recently-played?limit=50",
        revalidateSeconds
      ),
    ]);

  const genreCounts = new Map<string, number>();
  for (const artist of topArtistsForGenres?.items ?? []) {
    for (const genre of artist.genres ?? []) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    }
  }
  const genreBreakdown = [...genreCounts.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const recentMs = (recentlyPlayed?.items ?? []).reduce(
    (sum, item) => sum + item.track.duration_ms,
    0
  );

  return {
    topGenre: genreBreakdown[0]?.genre ?? null,
    genreBreakdown,
    playlistCount: playlists?.total ?? 0,
    savedTrackCount: savedTracks?.total ?? 0,
    followedArtistCount: following?.artists?.total ?? 0,
    recentMinutes: Math.round(recentMs / 60000),
  };
}
