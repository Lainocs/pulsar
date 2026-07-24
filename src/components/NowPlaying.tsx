"use client";

import { useEffect, useRef, useState } from "react";
import type { CurrentlyPlaying } from "@/lib/spotify/types";
import { formatDuration, timeAgo } from "@/lib/format";

const POLL_MS = 7000;

export default function NowPlaying({ initialData }: { initialData: CurrentlyPlaying }) {
  const [data, setData] = useState<CurrentlyPlaying | null>(initialData);
  const [progress, setProgress] = useState(initialData.progressMs);
  const progressRef = useRef(initialData.progressMs);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/now-playing", { cache: "no-store" });
        const json = (await res.json()) as CurrentlyPlaying;
        if (cancelled) return;
        setData(json);
        progressRef.current = json.progressMs;
        setProgress(json.progressMs);
      } catch {
        // Silently keep last known state — this is a personal dashboard,
        // not something that needs error banners for a dropped poll.
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!data?.isPlaying) return;
    const tick = setInterval(() => {
      progressRef.current = Math.min(
        progressRef.current + 1000,
        data.track?.durationMs ?? progressRef.current
      );
      setProgress(progressRef.current);
    }, 1000);
    return () => clearInterval(tick);
  }, [data]);

  const track = data?.track;
  const isLive = data?.isLive ?? false;
  const isPlaying = data?.isPlaying ?? false;
  const pct = track ? Math.min((progress / track.durationMs) * 100, 100) : 0;

  return (
    <div className={`now-playing ${isPlaying ? "" : "is-paused"} flex items-center gap-5 p-6`}>
      <div
        className="vinyl"
        style={track?.albumImage ? { backgroundImage: `url(${track.albumImage})` } : undefined}
      />
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <span
            className="flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-[0.18em]"
            style={{ color: isLive && isPlaying ? "var(--green)" : "var(--text-dim)" }}
          >
            <span className="dot-pulse" />
            {isLive && isPlaying && "En écoute"}
            {isLive && !isPlaying && "En pause"}
            {!isLive && track && `Dernière écoute${data?.playedAt ? " · " + timeAgo(data.playedAt) : ""}`}
            {!track && "Aucune écoute récente"}
          </span>
          {isPlaying && (
            <div className="eq">
              <span />
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        {track ? (
          <>
            <a
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-semibold text-[1.05rem] truncate hover:underline"
            >
              {track.name}
            </a>
            <div className="text-sm truncate" style={{ color: "var(--text-dim)" }}>
              {track.artists}
            </div>

            {isLive ? (
              <>
                <div className="np-progress mt-3">
                  <div className="np-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div
                  className="flex justify-between mt-1.5 font-mono text-[0.68rem]"
                  style={{ color: "var(--text-dim)" }}
                >
                  <span>{formatDuration(progress)}</span>
                  <span>{formatDuration(track.durationMs)}</span>
                </div>
              </>
            ) : (
              <div className="mt-3 font-mono text-[0.68rem]" style={{ color: "var(--text-dim)" }}>
                {formatDuration(track.durationMs)}
              </div>
            )}
          </>
        ) : (
          <div className="text-sm" style={{ color: "var(--text-dim)" }}>
            Rien pour l&apos;instant.
          </div>
        )}
      </div>
    </div>
  );
}
