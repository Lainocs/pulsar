// Scopes requested during the one-time owner authorization (see /api/auth/login).
// Keep this list in sync with every endpoint used across lib/spotify/api.ts —
// Spotify silently omits data your refresh token wasn't granted a scope for.
export const SPOTIFY_SCOPES = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-read-recently-played",
  "user-top-read",
  "user-library-read",
  "playlist-read-private",
  "user-follow-read",
].join(" ");
