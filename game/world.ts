import {
  getEffectiveBowStats,
  getEffectiveSwordStats,
  type GameProgression,
} from "./progression";
import type { World } from "./types";

export function createWorld(w: number, h: number, prog: GameProgression): World {
  return {
    ctx: { mode: "idle", modifiers: {} },
    player: { pos: { x: w / 2, y: h / 2 } },
    sword: {
      angle: 0,
      lastHits: new Map(),
      hitsThisRotation: new Set(),
      effective: getEffectiveSwordStats(prog),
      lastShockwaveAngle: 0,
    },
    bow: {
      lastShotAt: -Infinity,
      effective: getEffectiveBowStats(prog),
    },
    mobs: [],
    arrows: [],
    pendingShots: [],
    particles: [],
    popups: [],
    trail: [],
    shockwaves: [],
    phantomTrail: [],
    spawnAccum: 0,
    screenShake: 0,
    flashMs: 0,
    hitStopMs: 0,
    lastHitStopAt: -Infinity,
    nextId: 1,
    viewport: { w, h },
    nowMs: 0,
  };
}

export function resizeWorld(world: World, w: number, h: number) {
  world.viewport.w = w;
  world.viewport.h = h;
  world.player.pos.x = w / 2;
  world.player.pos.y = h / 2;
}
