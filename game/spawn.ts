import { BALANCE, idleMobStats } from "@/lib/balance";
import type { World } from "./types";

/**
 * Spawn idle continu, avec scaling de difficulté basé sur les kills cumulés.
 * Au-delà de `BALANCE.mob.difficultyTierEvery` kills, les nouveaux mobs ont
 * un peu plus de HP, sont plus rapides, et le spawn rate accélère.
 */
export function tickSpawn(world: World, dtMs: number) {
  const stats = idleMobStats(world.totalKills);
  const dtSec = dtMs / 1000;
  world.spawnAccum += dtSec * stats.spawnRate;

  while (world.spawnAccum >= 1) {
    world.spawnAccum -= 1;
    spawnOneMob(world, stats);
  }
}

function spawnOneMob(world: World, stats: ReturnType<typeof idleMobStats>) {
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
    hp: stats.hp,
    maxHp: stats.hp,
    radius: BALANCE.mob.radius,
    speed: stats.speed,
    weakenedUntilMs: -Infinity,
    weakenMultiplier: 1,
    burnUntilMs: -Infinity,
    burnDps: 0,
    burnPropagationRadius: 0,
    isGolem: false,
    isMajor: false,
    mithrilDrop: 0,
    contactDamage: 0,
  });
}
