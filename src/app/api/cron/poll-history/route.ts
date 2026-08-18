import { NextRequest, NextResponse } from "next/server";
import { getRecentlyPlayed } from "@/lib/spotify/api";
import { recordPlays, type PlayRecord } from "@/lib/history";

/**
 * Meant to be hit every ~10 minutes by an external scheduler (see
 * .github/workflows/poll-history.yml, or a VPS crontab) — Spotify's
 * recently-played endpoint only keeps the last 50 items, so polling
 * regularly is how a real listening history gets built over time.
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const recent = await getRecentlyPlayed(50);

    const plays: PlayRecord[] = recent.map(({ playedAt, track }) => ({
      playedAt,
      trackId: track.id,
      trackName: track.name,
      artistName: track.artists[0]?.name ?? "Unknown",
      artistId: track.artists[0]?.id ?? null,
      albumName: track.album.name,
      durationMs: track.duration_ms,
      // recently-played doesn't report actual listened time, only that the
      // track played — assume a full play, same simplification stats
      // services fall back to when GDPR export data isn't available yet.
      msPlayed: track.duration_ms,
      source: "poll",
    }));

    const { inserted } = await recordPlays(plays);
    return NextResponse.json({ checked: plays.length, inserted });
  } catch (err) {
    console.error("[poll-history]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
