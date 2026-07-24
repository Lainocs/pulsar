import { NextRequest, NextResponse } from "next/server";
import { getTopArtists } from "@/lib/spotify/api";
import type { TimeRange } from "@/lib/spotify/types";

const VALID_RANGES: TimeRange[] = ["short_term", "medium_term", "long_term"];

export async function GET(request: NextRequest) {
  const rangeParam = request.nextUrl.searchParams.get("range");
  const range: TimeRange = VALID_RANGES.includes(rangeParam as TimeRange)
    ? (rangeParam as TimeRange)
    : "medium_term";

  try {
    const items = await getTopArtists(range, 8);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[top-artists]", err);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
