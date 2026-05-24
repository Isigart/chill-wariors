import { BALANCE } from "@/lib/balance";
import type { World } from "./types";

/**
 * Spawn continu : on accumule un budget proportionnel à dt et on spawn
 * un mob entier à chaque fois que l'accumulateur dépasse 1.
 * Les mobs ne scalent pas (1 HP, 60 px/s) — le challenge vient de
 * la densité au plus que de la stat des mobs.
 */
export function tickSpawn(world: World, dtMs: number) {
  const dtSec = dtMs / 1000;
  world.spawnAccum += dtSec * BALANCE.mob.spawnRatePerSec;

  while (world.spawnAccum >= 1) {
    world.spawnAccum -= 1;
    spawnOneMob(world);
  }
}

function spawnOneMob(world: World) {
  const { w, h } = world.viewport;
  const radius = (Math.hypot(w, h) / 2) * BALANCE.mob.spawnDistance;
  const angle = Math.random() * Math.PI * 2;
  const cx = w / 2;
  const cy = h / 2;

  world.mobs.push({
    id: world.nextId++,
    pos: {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    },
    hp: BALANCE.mob.hp,
    maxHp: BALANCE.mob.hp,
    radius: BALANCE.mob.radius,
    speed: BALANCE.mob.speed,
  });
}
