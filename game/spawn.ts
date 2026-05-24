import { waveMobStats } from "@/lib/balance";
import type { World } from "./types";

/** Spawn UN mob à la position d'un point aléatoire hors-champ. */
export function spawnOneMob(world: World) {
  const { w, h } = world.viewport;
  const radius = (Math.min(w, h) / 2) * 1.2;
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
