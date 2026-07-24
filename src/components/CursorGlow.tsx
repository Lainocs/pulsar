"use client";

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function move(e: MouseEvent) {
      el!.style.left = `${e.clientX}px`;
      el!.style.top = `${e.clientY}px`;
    }
    function show() {
      el!.style.opacity = "1";
    }
    function hide() {
      el!.style.opacity = "0";
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseenter", show);
    window.addEventListener("mouseleave", hide);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseenter", show);
      window.removeEventListener("mouseleave", hide);
    };
  }, []);

  return <div ref={ref} className="cursor-glow" aria-hidden="true" />;
}
