import { computeEffectiveSword } from "./skills";
import type { World, Wave } from "./types";
import { BALANCE, waveMobCount } from "@/lib/balance";

export function createWorld(w: number, h: number, startWave = 1): World {
  return {
    ctx: { mode: "idle", modifiers: {} },
    player: { pos: { x: w / 2, y: h / 2 } },
    sword: {
      angle: 0,
      lastHits: new Map(),
      level: 1,
      xp: 0,
      effective: computeEffectiveSword([]),
    },
    wave: initWave(startWave),
    mobs: [],
    particles: [],
    popups: [],
    trail: [],
    screenShake: 0,
    flashMs: 0,
    hitStopMs: 0,
    nextId: 1,
    viewport: { w, h },
    nowMs: 0,
  };
}

export function initWave(index: number): Wave {
  return {
    index,
    phase: "spawning",
    remainingToSpawn: waveMobCount(index),
    spawnAccum: 0,
    restMs: 0,
  };
}

/** Mettre à jour la taille (resize) en gardant le perso centré. */
export function resizeWorld(world: World, w: number, h: number) {
  world.viewport.w = w;
  world.viewport.h = h;
  world.player.pos.x = w / 2;
  world.player.pos.y = h / 2;
}

/** Garde le tick.ts ignorant de BALANCE pour le sword : on lit world.sword.effective. */
export { BALANCE };
