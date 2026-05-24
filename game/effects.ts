import type { EffectiveSwordStats } from "./progression";
import type { Mob, Vec2, World } from "./types";

/**
 * Effets spéciaux des paliers — implémentent les flags de `TierEffects`.
 *
 * - knockback (vitesse T4/T5) : pousse les mobs touchés loin du perso.
 * - doubleHitPerRotation (portée T4) : ignore le hitCooldown 1× par rotation.
 * - pierce (portée T5) : la lame ne consomme jamais le cooldown.
 * - critChance/critMultiplier (dégâts T4/T5) : multiplicateur de dégâts roll.
 * - explosionRadius/Ratio (dégâts T5) : explosion en zone autour du mob tué.
 *   Cap récursion à 1 niveau pour éviter chain explosions exponentielles.
 */

/** Applique un knockback sur un mob (push directionnel depuis le perso). */
export function applyKnockback(mob: Mob, from: Vec2, force: number) {
  const dx = mob.pos.x - from.x;
  const dy = mob.pos.y - from.y;
  const d = Math.hypot(dx, dy) || 1;
  mob.pos.x += (dx / d) * force;
  mob.pos.y += (dy / d) * force;
}

/** Roll un crit. Retourne le multiplicateur de dégâts (1 si pas de crit). */
export function rollCrit(eff: EffectiveSwordStats): { crit: boolean; mult: number } {
  const chance = eff.effects.critChance ?? 0;
  if (chance <= 0) return { crit: false, mult: 1 };
  if (Math.random() < chance) {
    return { crit: true, mult: eff.effects.critMultiplier ?? 2 };
  }
  return { crit: false, mult: 1 };
}

/**
 * Une explosion en zone qui tue les mobs dans `radius` avec `damage`.
 * `chainDepth` empêche la récursion : 0 = première explosion, 1 = blocked.
 * Renvoie les mobs tués supplémentaires.
 */
export function triggerExplosion(
  world: World,
  center: Vec2,
  damage: number,
  radius: number,
  chainDepth: number,
): Mob[] {
  const killed: Mob[] = [];
  if (chainDepth > 0) return killed; // cap pour éviter cascade infinie

  for (const mob of world.mobs) {
    if (mob.hp <= 0) continue;
    const dx = mob.pos.x - center.x;
    const dy = mob.pos.y - center.y;
    const d = Math.hypot(dx, dy);
    if (d > radius + mob.radius) continue;
    mob.hp -= damage;
    if (mob.hp <= 0) killed.push(mob);
  }

  // FX visuels : onde et particules.
  world.particles.push(
    ...Array.from({ length: 16 }).map((_, i) => {
      const a = (i / 16) * Math.PI * 2;
      const s = 220 * (0.7 + Math.random() * 0.5);
      return {
        pos: { x: center.x, y: center.y },
        vel: { x: Math.cos(a) * s, y: Math.sin(a) * s },
        lifeMs: 350,
        ageMs: 0,
        color: i % 2 === 0 ? "#ffe18a" : "#ff8a3d",
      };
    }),
  );

  return killed;
}
