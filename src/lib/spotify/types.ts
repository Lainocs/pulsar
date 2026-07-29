export type TimeRange = "short_term" | "medium_term" | "long_term";

export interface SpotifyImage {
  url: string;
  width: number | null;
  height: number | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  // Spotify omits or empties this for some artists — never assume it's populated.
  genres?: string[];
  images: SpotifyImage[];
  popularity: number;
  external_urls: { spotify: string };
}

export interface SpotifyAlbum {
  name: string;
  images: SpotifyImage[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string; id: string }[];
  album: SpotifyAlbum;
  duration_ms: number;
  external_urls: { spotify: string };
}

export interface CurrentlyPlaying {
  isPlaying: boolean;
  isLive: boolean; // false when this is a fallback "recently played" item
  progressMs: number;
  track: {
    id: string;
    name: string;
    artists: string;
    albumName: string;
    albumImage: string | null;
    durationMs: number;
    url: string;
  } | null;
  playedAt?: string; // present when isLive is false
}

export interface TopArtistsResponse {
  items: SpotifyArtist[];
}

export interface TopTracksResponse {
  items: SpotifyTrack[];
}

export interface StatsSummary {
  topGenre: string | null;
  genreBreakdown: { genre: string; count: number }[];
  playlistCount: number;
  savedTrackCount: number;
  followedArtistCount: number;
  recentMinutes: number; // sum of track durations across recently-played (last ~50)
}
