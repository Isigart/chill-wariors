"use client";

import { useEffect, useRef } from "react";
import { createWorld, resizeWorld } from "@/game/world";
import { tickWorld } from "@/game/tick";
import { renderWorld } from "@/game/render";
import { computeEffectiveSword, hasAnyChoiceAvailable } from "@/game/skills";
import type { World } from "@/game/types";
import { useGame } from "@/lib/store";
import { xpToNextLevel } from "@/lib/balance";
import { loadSave, persistFromStore } from "@/lib/save";

/**
 * Canvas plein écran + boucle de jeu.
 *
 * Pattern :
 *  - World mutable dans useRef (pas de re-render).
 *  - Canvas lit `useGame.getState()` (no subscribe) pour éviter re-render.
 *  - HUD subscribe normalement, sync world → store toutes les ~100ms.
 *  - Subscribe à `skills` pour recalculer les stats effectives de l'épée.
 *  - Le tick est freezé si `paused` ou `pendingChoice != null`.
 */
export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<World | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const syncAccumRef = useRef(0);
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

    // Hydratation save AVANT createWorld pour avoir startWave correct.
    const restored = loadSave();
    const startWave = restored?.wave ?? 1;
    const skills = restored?.skills ?? [];
    const sealedBranches = restored?.sealedBranches ?? [];

    const world = createWorld(window.innerWidth, window.innerHeight, startWave);
    world.sword.effective = computeEffectiveSword(skills, sealedBranches);

    // Restaure niveau / xp depuis le store déjà hydraté par loadSave.
    const st0 = useGame.getState();
    world.sword.level = st0.swordLevel;
    world.sword.xp = st0.swordXp;
    st0.setSwordProgress(world.sword.level, world.sword.xp, xpToNextLevel(world.sword.level));

    worldRef.current = world;

    window.addEventListener("resize", setSize);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = (ts: number) => {
      const last = lastTsRef.current ?? ts;
      const dt = Math.min(50, ts - last);
      lastTsRef.current = ts;

      const w = worldRef.current!;
      const st = useGame.getState();
      const frozen = st.paused || st.pendingChoice != null;

      if (!frozen) {
        tickWorld(w, dt, {
          onKill: () => {
            // setKills via la fonction du store. Zustand ne notifie que
            // les selectors qui dépendent de `kills` — le canvas ne
            // subscribe pas, donc pas de re-render ici.
            const s = useGame.getState();
            s.setKills(s.kills + 1);
          },
          onLevelUp: () => {
            const s = useGame.getState();
            if (hasAnyChoiceAvailable(s.skills, s.sealedBranches, s.extendedTier)) {
              s.requestSkillChoice(w.sword.level);
            }
          },
          onWaveCleared: () => {
            // v0.2 : rien — la transition est gérée dans tickWave.
            // Crochet conservé pour brancher un effet plus tard.
          },
        });
      }

      // Render systématique (montre la scène figée pendant un choix).
      renderWorld(ctx, w);

      // Sync HUD ~10 Hz.
      syncAccumRef.current += dt;
      if (syncAccumRef.current >= 100) {
        syncAccumRef.current = 0;
        syncStoreFromWorld(w);
      }

      // Persistence ~0.5 Hz.
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

  // Recalcule les stats effectives quand skills OU sealedBranches change.
  // On compare par ref pour éviter le travail à chaque setKills/setWave/...
  const lastSkillsRef = useRef<unknown>(null);
  const lastSealedRef = useRef<unknown>(null);
  useEffect(() => {
    const unsub = useGame.subscribe((s) => {
      if (!worldRef.current) return;
      if (s.skills === lastSkillsRef.current && s.sealedBranches === lastSealedRef.current) return;
      lastSkillsRef.current = s.skills;
      lastSealedRef.current = s.sealedBranches;
      worldRef.current.sword.effective = computeEffectiveSword(s.skills, s.sealedBranches);
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

/** Sync les valeurs HUD-relevant du world → store. Idempotent. */
function syncStoreFromWorld(w: World) {
  const s = useGame.getState();
  if (s.wave !== w.wave.index) s.setWave(w.wave.index);

  const xpToNext = xpToNextLevel(w.sword.level);
  if (
    s.swordLevel !== w.sword.level ||
    s.swordXp !== w.sword.xp ||
    s.swordXpToNext !== xpToNext
  ) {
    s.setSwordProgress(w.sword.level, w.sword.xp, xpToNext);
  }
}
