import { NextRequest, NextResponse } from "next/server";
import { SPOTIFY_SCOPES } from "@/lib/spotify/scopes";

/**
 * One-time setup route: redirects the *owner* to Spotify's consent screen
 * so we can obtain a refresh token for this personal dashboard.
 *
 * Gated by SPOTIFY_SETUP_KEY so random visitors to the public deployment
 * can't stumble into your app's OAuth flow. Visit:
 *   /api/auth/login?key=<SPOTIFY_SETUP_KEY>
 */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!process.env.SPOTIFY_SETUP_KEY || key !== process.env.SPOTIFY_SETUP_KEY) {
    return new NextResponse("Not found", { status: 404 });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return new NextResponse(
      "Missing SPOTIFY_CLIENT_ID or SPOTIFY_REDIRECT_URI env vars.",
      { status: 500 }
    );
  }

  const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", SPOTIFY_SCOPES);
  authorizeUrl.searchParams.set("state", process.env.SPOTIFY_SETUP_KEY);

  return NextResponse.redirect(authorizeUrl.toString());
}
