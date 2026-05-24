import type { World } from "./types";

export function createWorld(w: number, h: number): World {
  return {
    ctx: { mode: "idle", modifiers: {} },
    player: { pos: { x: w / 2, y: h / 2 } },
    sword: { angle: 0, lastHits: new Map() },
    mobs: [],
    particles: [],
    popups: [],
    screenShake: 0,
    hitStopMs: 0,
    spawnAccum: 0,
    nextId: 1,
    viewport: { w, h },
    nowMs: 0,
  };
}

/** Mettre à jour la taille (resize) en gardant le perso centré. */
export function resizeWorld(world: World, w: number, h: number) {
  world.viewport.w = w;
  world.viewport.h = h;
  world.player.pos.x = w / 2;
  world.player.pos.y = h / 2;
}
