import { BALANCE } from "@/lib/balance";
import type { World } from "./types";

const PLAYER_RADIUS = BALANCE.player.radius;

export interface SubmersionTickResult {
  /** Multiplicateur appliqué aux cadences/vitesses d'armes ce tick. */
  weaponEfficiency: number;
  /** Stunné ce tick. */
  isStun: boolean;
  /** Immunisé ce tick. */
  isImmunity: boolean;
  /** Le stun vient de se déclencher à ce tick. */
  justTriggeredStun: boolean;
  /** Le stun vient de se terminer à ce tick (onde déclenchée). */
  justEndedStun: boolean;
}

/**
 * Logique de la jauge de submersion + stun + onde + immunité.
 * Appelé chaque frame avant les ticks d'armes (pour appliquer
 * `weaponEfficiency` aux rotations/cadences).
 *
 * Gère :
 *  - Si stun en cours : retourne efficiency 0.5, ne touche pas la jauge.
 *  - Si stun vient juste de finir : déclenche shockwave, reset, set immunity.
 *  - Si immunité : décroissance de la jauge sans contribution.
 *  - Sinon : compte mobs en contact, ajuste jauge, déclenche stun si seuil atteint.
 */
export function tickSubmersion(world: World, dtMs: number): SubmersionTickResult {
  const sub = world.submersion;
  const dtSec = dtMs / 1000;
  const now = world.nowMs;
  const px = world.player.pos.x;
  const py = world.player.pos.y;
  const B = BALANCE.submersion;

  const result: SubmersionTickResult = {
    weaponEfficiency: 1,
    isStun: false,
    isImmunity: false,
    justTriggeredStun: false,
    justEndedStun: false,
  };

  // 1. Stun en cours.
  if (sub.stunUntilMs > 0 && now < sub.stunUntilMs) {
    sub.value = B.thresholdStun;
    result.isStun = true;
    result.weaponEfficiency = B.stunWeaponEfficiency;
    return result;
  }

  // 2. Stun vient de se terminer.
  if (sub.stunUntilMs > 0 && now >= sub.stunUntilMs) {
    triggerShockwave(world);
    sub.value = 0;
    sub.stunUntilMs = 0;
    sub.immunityUntilMs = now + B.immunityDurationMs;
    result.justEndedStun = true;
    return result;
  }

  // 3. Immunité post-stun.
  if (now < sub.immunityUntilMs) {
    result.isImmunity = true;
    sub.value = Math.max(0, sub.value - B.decayPerSec * dtSec);
    return result;
  }

  // 4. État normal — count des mobs en contact.
  let touching = 0;
  for (const mob of world.mobs) {
    if (mob.hp <= 0) continue;
    const dx = mob.pos.x - px;
    const dy = mob.pos.y - py;
    const r = mob.radius + PLAYER_RADIUS;
    if (dx * dx + dy * dy <= r * r) touching++;
  }

  if (touching > 0) {
    sub.value += B.hitContribution * touching * dtSec;
  } else {
    sub.value = Math.max(0, sub.value - B.decayPerSec * dtSec);
  }

  // 5. Déclenche le stun si seuil atteint.
  if (sub.value >= B.thresholdStun) {
    sub.value = B.thresholdStun;
    sub.stunUntilMs = now + B.stunDurationMs;
    result.isStun = true;
    result.justTriggeredStun = true;
    result.weaponEfficiency = B.stunWeaponEfficiency;
    if (world.shakeEnabled) world.screenShake = Math.max(world.screenShake, 5);
  }

  return result;
}

/** Onde de choc à la fin du stun. Knockback + dégâts éventuels + shockwave visuelle. */
function triggerShockwave(world: World) {
  const B = BALANCE.submersion;
  const { x: px, y: py } = world.player.pos;

  for (const mob of world.mobs) {
    if (mob.hp <= 0) continue;
    const dx = mob.pos.x - px;
    const dy = mob.pos.y - py;
    const d = Math.hypot(dx, dy) || 1;
    if (d > B.endOfStunWaveRadius) continue;
    if (B.endOfStunWaveDamage > 0) mob.hp -= B.endOfStunWaveDamage;
    // Pousse vers le bord du rayon (proportionnel à knockback).
    const factor = B.endOfStunWaveKnockback / d;
    mob.pos.x += dx * factor;
    mob.pos.y += dy * factor;
  }

  world.shockwaves.push({
    pos: { x: px, y: py },
    radius: 0,
    ageMs: 0,
    lifeMs: B.waveLifeMs,
  });
  if (world.shakeEnabled) world.screenShake = Math.max(world.screenShake, 10);
  world.flashMs = Math.max(world.flashMs, 200);
}
