const TOKEN_URL = "https://accounts.spotify.com/api/token";

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. See README.md for setup instructions.`
    );
  }
  return value;
}

function basicAuthHeader(): string {
  const id = requireEnv("SPOTIFY_CLIENT_ID");
  const secret = requireEnv("SPOTIFY_CLIENT_SECRET");
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

/**
 * Exchanges the long-lived owner refresh token for a short-lived access
 * token, cached in memory for the process lifetime (serverless instances
 * are ephemeral, so this mostly helps warm invocations).
 */
export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5_000) {
    return cachedToken.accessToken;
  }

  const refreshToken = requireEnv("SPOTIFY_REFRESH_TOKEN");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify token refresh failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    // Spotify may rotate the refresh token; not persisted automatically —
    // if this ever appears, update SPOTIFY_REFRESH_TOKEN manually.
    refresh_token?: string;
  };

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.accessToken;
}

/** Exchanges an authorization code for tokens during the one-time owner setup flow. */
export async function exchangeAuthorizationCode(code: string, redirectUri: string) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify code exchange failed (${res.status}): ${body}`);
  }

  return (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
  };
}
