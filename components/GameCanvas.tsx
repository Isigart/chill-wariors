"use client";

import { useEffect, useRef } from "react";
import { createWorld, resizeWorld } from "@/game/world";
import { tickWorld } from "@/game/tick";
import { renderWorld } from "@/game/render";
import { getEffectiveBowStats, getEffectiveSwordStats } from "@/game/progression";
import type { World } from "@/game/types";
import { useGame } from "@/lib/store";
import { loadSave, persistFromStore } from "@/lib/save";

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

  // Recache les stats effectives des 2 armes quand leurs tiers changent,
  // ET sync l'arme équipée du store vers le world.
  const lastTiersKeyRef = useRef<string>("");
  const lastEquippedRef = useRef<string>("");
  useEffect(() => {
    const unsub = useGame.subscribe((s) => {
      const w = worldRef.current;
      if (!w) return;
      const swT = s.progression.weapons.sword.tier;
      const bwT = s.progression.weapons.bow.tier;
      const key =
        `${swT.speed ?? 0}-${swT.range ?? 0}-${swT.damage ?? 0}` +
        `|${bwT.cadence ?? 0}-${bwT.pierce ?? 0}-${bwT.multi ?? 0}`;
      if (key !== lastTiersKeyRef.current) {
        lastTiersKeyRef.current = key;
        w.sword.effective = getEffectiveSwordStats(s.progression);
        w.bow.effective = getEffectiveBowStats(s.progression);
      }
      if (s.progression.equipped !== lastEquippedRef.current) {
        lastEquippedRef.current = s.progression.equipped;
        w.equipped = s.progression.equipped;
      }
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
