import { NextResponse } from "next/server";
import { getNowPlaying } from "@/lib/spotify/api";

export async function GET() {
  try {
    const data = await getNowPlaying();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[now-playing]", err);
    return NextResponse.json(
      { isPlaying: false, isLive: false, progressMs: 0, track: null },
      { status: 200 }
    );
  }
}
