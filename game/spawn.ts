import { BALANCE } from "@/lib/balance";
import type { World } from "./types";

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
    weakenedUntilMs: -Infinity,
    weakenMultiplier: 1,
    burnUntilMs: -Infinity,
    burnDps: 0,
    burnPropagationRadius: 0,
  });
}
