"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { CurrentlyPlaying } from "@/lib/spotify/types";
import { formatDuration, timeAgo } from "@/lib/format";

const POLL_MS = 7000;

export default function NowPlaying({ initialData }: { initialData: CurrentlyPlaying }) {
  const [data, setData] = useState<CurrentlyPlaying>(initialData);
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
        // keep the last known state, a dropped poll doesn't matter here
      }
    }
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!data.isPlaying) return;
    const tick = setInterval(() => {
      progressRef.current = Math.min(progressRef.current + 1000, data.track?.durationMs ?? progressRef.current);
      setProgress(progressRef.current);
    }, 1000);
    return () => clearInterval(tick);
  }, [data]);

  const { track, isLive, isPlaying } = data;
  const pct = track ? Math.min((progress / track.durationMs) * 100, 100) : 0;

  let intro: React.ReactNode = "Rien d'écouté récemment.";
  if (track && isLive && isPlaying) intro = <>Là, tout de suite, j&apos;écoute <em>ça</em>.</>;
  else if (track && isLive) intro = "J'ai mis sur pause.";
  else if (track) intro = <>Le dernier morceau que j&apos;ai écouté{data.playedAt ? `, ${timeAgo(data.playedAt)}` : ""}.</>;

  return (
    <section className="now" id="now">
      <h1 className="now-intro">{intro}</h1>

      {track && (
        <div className="now-card">
          <div className="now-cover">
            {track.albumImage && (
              <Image src={track.albumImage} alt="" fill sizes="88px" className="object-cover" priority />
            )}
          </div>
          <div className="min-w-0">
            <div className={`now-status mono muted ${isPlaying ? "is-playing" : ""}`}>
              {isLive && <span className="live" />}
              {isLive ? (isPlaying ? "en lecture" : "en pause") : "hors ligne"}
            </div>
            <a href={track.url} target="_blank" rel="noopener noreferrer" className="now-title truncate">
              {track.name}
            </a>
            <div className="muted truncate">{track.artists}</div>
            {isLive && (
              <>
                <div className="bar">
                  <div style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between mt-1 mono muted">
                  <span>{formatDuration(progress)}</span>
                  <span>{formatDuration(track.durationMs)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
