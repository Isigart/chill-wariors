"use client";

import { useEffect, useRef } from "react";
import { createWorld, resizeWorld } from "@/game/world";
import { tickWorld } from "@/game/tick";
import { renderWorld } from "@/game/render";
import type { World } from "@/game/types";
import { useGame } from "@/lib/store";

/**
 * Canvas plein écran + boucle de jeu.
 *
 * Pattern important :
 *  - Le World vit dans un useRef (mutable, pas de re-render).
 *  - Le HUD lit via useGame() (subscribe). Le canvas, lui, lit
 *    `useGame.getState()` sans s'abonner pour ne pas être re-render.
 */
export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<World | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Gestion HiDPI : on dessine en CSS px mais on alloue plus de pixels.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const setSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (worldRef.current) resizeWorld(worldRef.current, w, h);
    };

    setSize();
    worldRef.current = createWorld(window.innerWidth, window.innerHeight);

    window.addEventListener("resize", setSize);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = (ts: number) => {
      const last = lastTsRef.current ?? ts;
      // Clamp dt pour éviter les sauts énormes (tab inactive, breakpoint, etc.).
      const dt = Math.min(50, ts - last);
      lastTsRef.current = ts;

      const world = worldRef.current!;

      if (!useGame.getState().paused) {
        tickWorld(world, dt, {
          onKill: () => useGame.getState().addKills(1),
        });
      }
      renderWorld(ctx, world);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", setSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block"
      aria-label="Chill Warriors — arène"
    />
  );
}
