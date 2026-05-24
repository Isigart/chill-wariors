"use client";

import { useEffect, useRef } from "react";
import { createWorld, resizeWorld } from "@/game/world";
import { tickWorld } from "@/game/tick";
import { renderWorld } from "@/game/render";
import { getEffectiveSwordStats } from "@/game/progression";
import type { World } from "@/game/types";
import { useGame } from "@/lib/store";
import { loadSave, persistFromStore } from "@/lib/save";

/**
 * Canvas plein écran + boucle de jeu.
 *
 *  - World mutable dans useRef (pas de re-render).
 *  - Canvas lit `useGame.getState()` (no subscribe).
 *  - HUD/SkillTreeHUD subscribent normalement.
 *  - Subscribe à `progression.tier` pour recacher les stats effectives.
 */
export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<World | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const saveAccumRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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

    // Charge le save (hydrate le store), récupère la progression de départ.
    loadSave();
    const prog = useGame.getState().progression;
    const world = createWorld(window.innerWidth, window.innerHeight, prog);
    worldRef.current = world;

    window.addEventListener("resize", setSize);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = (ts: number) => {
      const last = lastTsRef.current ?? ts;
      const dt = Math.min(50, ts - last);
      lastTsRef.current = ts;

      const w = worldRef.current!;
      const s = useGame.getState();

      tickWorld(w, dt, {
        onKill: () => {
          s.addKill();
          s.awardXp(1);
        },
      });

      renderWorld(ctx, w);

      saveAccumRef.current += dt;
      if (saveAccumRef.current >= 2000) {
        saveAccumRef.current = 0;
        persistFromStore();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", setSize);
      persistFromStore();
    };
  }, []);

  // Recache les stats effectives quand un tier change.
  const lastTierRef = useRef<string>("");
  useEffect(() => {
    const unsub = useGame.subscribe((s) => {
      const w = worldRef.current;
      if (!w) return;
      const key = `${s.progression.tier.speed}-${s.progression.tier.range}-${s.progression.tier.damage}`;
      if (key === lastTierRef.current) return;
      lastTierRef.current = key;
      w.sword.effective = getEffectiveSwordStats(s.progression);
    });
    return unsub;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block"
      aria-label="Chill Warriors — arène"
    />
  );
}
