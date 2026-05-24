import { waveMobStats } from "@/lib/balance";
import type { World } from "./types";

/** Spawn UN mob hors-champ, distance = diagonale/2 × marge. */
export function spawnOneMob(world: World) {
  const { w, h } = world.viewport;
  // Distance jusqu'au coin (hypot/2) * marge — garantit hors-écran même
  // sur les écrans très allongés.
  const radius = (Math.hypot(w, h) / 2) * 1.05;
  const angle = Math.random() * Math.PI * 2;
  const cx = w / 2;
  const cy = h / 2;

  const stats = waveMobStats(world.wave.index);

  world.mobs.push({
    id: world.nextId++,
    pos: {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    },
    hp: stats.hp,
    maxHp: stats.hp,
    radius: stats.radius,
    speed: stats.speed,
  });
}
