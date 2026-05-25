"use client";

import { useEffect, useRef } from "react";
import { createWorld, resizeWorld } from "@/game/world";
import { tickWorld } from "@/game/tick";
import { renderWorld } from "@/game/render";
import { getEffectiveBowStats, getEffectiveFireWandStats, getEffectiveSwordStats } from "@/game/progression";
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
    const initialMode = useGame.getState().mode === "instance" ? "instance" : "idle";
    const prog = useGame.getState().progression;
    const world = createWorld(window.innerWidth, window.innerHeight, prog, initialMode);
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

      // En mode altar : pas de tick combat, on garde la scène figée derrière la modale.
      if (s.mode !== "altar") {
        tickWorld(w, dt, {
          onKill: (mithril, pos) => {
            s.addKill();
            s.awardXp(1);
            if (s.mode === "instance" && typeof mithril === "number" && mithril > 0) {
              s.addMithril(mithril);
            }
            // Drop des Clefs de Mine en idle (RNG, gated par 1 arme T5/T5/T5).
            if (s.mode === "idle") {
              const dropped = s.rollMineKeyDrop();
              if (dropped && pos && w) {
                w.popups.push({
                  pos: { x: pos.x, y: pos.y - 18 },
                  text: "⚷ CLEF DE MINE",
                  lifeMs: 1800,
                  ageMs: 0,
                  color: "#ffe18a",
                  size: 18,
                });
                // Petit shake symbolique pour signaler l'événement.
                w.screenShake = Math.max(w.screenShake, 5);
              }
            }
          },
          onPlayerDamage: (amount) => {
            s.damagePlayer(amount);
          },
          onPlayerDeath: () => {
            // Mort = fin de run → mode altar.
            s.endRun();
          },
          onWaveCleared: (newWave) => {
            s.setInstanceWave(newWave);
          },
        });
      }

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

  // Sync world.equipped + effective stats quand le store change.
  const lastTiersKeyRef = useRef<string>("");
  const lastEquippedRef = useRef<string>("");
  const lastModeRef = useRef<string>("");
  useEffect(() => {
    const unsub = useGame.subscribe((s) => {
      const w = worldRef.current;
      if (!w) return;

      // Mode change : reset le world dans le bon mode.
      if (s.mode !== lastModeRef.current) {
        lastModeRef.current = s.mode;
        if (s.mode === "instance") {
          // Reset l'arène pour le combat actif.
          w.ctx.mode = "instance";
          w.mobs = [];
          w.arrows = [];
          w.fireProjectiles = [];
          w.groundFires = [];
          w.pendingExplosions = [];
          w.pendingShots = [];
          w.particles = [];
          w.popups = [];
          w.trail = [];
          w.shockwaves = [];
          w.phantomTrail = [];
          w.spawnAccum = 0;
          w.playerHp = s.playerHpMax;
          w.playerHpMax = s.playerHpMax;
          w.invulnUntilMs = 0;
          w.instanceWave = { index: 1, phase: "spawning", remainingToSpawn: 0, spawnAccum: 0, restMs: 0 };
        } else if (s.mode === "idle") {
          // Retour idle : on vide les golems, on reprend le spawn continu.
          w.ctx.mode = "idle";
          w.mobs = [];
          w.arrows = [];
          w.fireProjectiles = [];
          w.groundFires = [];
          w.pendingExplosions = [];
          w.pendingShots = [];
          w.particles = [];
          w.popups = [];
          w.spawnAccum = 0;
        }
        // En 'altar' on ne touche pas au world — la scène reste figée.
      }

      const swT = s.progression.weapons.sword.tier;
      const bwT = s.progression.weapons.bow.tier;
      const fwT = s.progression.weapons.fireWand.tier;
      // Inclus trempage : tempering modifie les stats effectives sans toucher aux tiers.
      const tr = s.progression.trempage;
      const trKey =
        `${tr.sword.speed ?? 0}.${tr.sword.range ?? 0}.${tr.sword.damage ?? 0}` +
        `:${tr.bow.cadence ?? 0}.${tr.bow.pierce ?? 0}.${tr.bow.multi ?? 0}` +
        `:${tr.fireWand.inferno ?? 0}.${tr.fireWand.brasier ?? 0}.${tr.fireWand.lancers ?? 0}`;
      const key =
        `${swT.speed ?? 0}-${swT.range ?? 0}-${swT.damage ?? 0}` +
        `|${bwT.cadence ?? 0}-${bwT.pierce ?? 0}-${bwT.multi ?? 0}` +
        `|${fwT.inferno ?? 0}-${fwT.brasier ?? 0}-${fwT.lancers ?? 0}` +
        `~${trKey}`;
      if (key !== lastTiersKeyRef.current) {
        lastTiersKeyRef.current = key;
        w.sword.effective = getEffectiveSwordStats(s.progression);
        w.bow.effective = getEffectiveBowStats(s.progression);
        w.fireWand.effective = getEffectiveFireWandStats(s.progression);
      }
      if (s.progression.equipped !== lastEquippedRef.current) {
        lastEquippedRef.current = s.progression.equipped;
        w.equipped = s.progression.equipped;
      }

      // Sync trempage de l'arme équipée (sert au rendu glow/halo).
      const eqTr = s.progression.trempage[s.progression.equipped] ?? {};
      w.equippedTrempage = { ...eqTr };

      // Sync préférence tremblement.
      w.shakeEnabled = s.settings.screenShake;

      // Sync kills totaux pour le scaling de difficulté idle.
      if (w.totalKills !== s.kills) {
        w.totalKills = s.kills;
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
