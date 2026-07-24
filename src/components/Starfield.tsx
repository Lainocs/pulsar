"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  s: number;
  o: number;
  hue: string;
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let frame = 0;

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
      const count = Math.floor((w * h) / 9000);
      stars = Array.from({ length: count }).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.2,
        s: Math.random() * 0.4 + 0.05,
        o: Math.random() * 0.6 + 0.2,
        hue: Math.random() > 0.5 ? "0,240,255" : "255,47,208",
      }));
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      for (const st of stars) {
        st.y += st.s;
        if (st.y > h) st.y = 0;
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(${st.hue},${st.o})`;
        ctx!.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      frame = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className="bg-canvas" aria-hidden="true" />;
}
