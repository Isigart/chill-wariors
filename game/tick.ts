import { BALANCE, xpToNextLevel } from "@/lib/balance";
import type { Mob, TickHooks, World } from "./types";
import { tickWave } from "./waves";

const TRAIL_LIFE_MS = 180;
const TRAIL_SAMPLE_MS = 16; // ~1 sample par frame max

/**
 * Avance le monde de `dtMs` millisecondes.
 *
 * Ordre :
 *  1. Hit-stop : si le temps est figé, on consomme dt et on sort.
 *  2. Décroissance shake + flash.
 *  3. Cycle de vague (spawn/cleaning/rest).
 *  4. Déplacement mobs vers le perso.
 *  5. Rotation épée (vitesse effective) + collisions.
 *  6. Vieillissement particules / popups / trail.
 */
export function tickWorld(world: World, dtMs: number, hooks: TickHooks) {
  if (world.hitStopMs > 0) {
    world.hitStopMs = Math.max(0, world.hitStopMs - dtMs);
    return;
  }

  world.nowMs += dtMs;
  const dtSec = dtMs / 1000;

  // Decay shake + flash.
  world.screenShake = Math.max(0, world.screenShake - BALANCE.juice.screenShakeDecay * dtSec);
  world.flashMs = Math.max(0, world.flashMs - dtMs);

  // Vagues.
  tickWave(world, dtMs, hooks);

  // Déplacement mobs.
  const px = world.player.pos.x;
  const py = world.player.pos.y;
  for (const mob of world.mobs) {
    const dx = px - mob.pos.x;
    const dy = py - mob.pos.y;
    const dist = Math.hypot(dx, dy) || 1;
    mob.pos.x += (dx / dist) * mob.speed * dtSec;
    mob.pos.y += (dy / dist) * mob.speed * dtSec;
  }

  // Épée — stats effectives.
  const eff = world.sword.effective;
  world.sword.angle = (world.sword.angle + eff.rotationSpeed * dtSec) % (Math.PI * 2);

  const tip = {
    x: px + Math.cos(world.sword.angle) * eff.length,
    y: py + Math.sin(world.sword.angle) * eff.length,
  };

  // Trail (échantillonnage par âge — pas plus dense que TRAIL_SAMPLE_MS).
  if (eff.visuals.trail) {
    const last = world.trail[0];
    if (!last || last.ageMs >= TRAIL_SAMPLE_MS) {
      world.trail.unshift({ tip: { ...tip }, pivot: { x: px, y: py }, ageMs: 0 });
    }
  } else {
    world.trail.length = 0;
  }

  // Collisions épée↔mob.
  const killedIds: number[] = [];
  for (const mob of world.mobs) {
    if (mob.hp <= 0) continue;
    const d = distancePointToSegment(mob.pos, world.player.pos, tip);
    const hitThreshold = mob.radius + (eff.width / 2);
    if (d > hitThreshold) continue;

    const lastHit = world.sword.lastHits.get(mob.id) ?? -Infinity;
    if (world.nowMs - lastHit < BALANCE.sword.hitCooldownMs) continue;
    world.sword.lastHits.set(mob.id, world.nowMs);

    mob.hp -= eff.damage;

    if (mob.hp <= 0) {
      killedIds.push(mob.id);
      onMobKilled(world, mob);
      hooks.onKill();
      grantXp(world, BALANCE.sword.xpPerKill, hooks);
    }
  }
  if (killedIds.length > 0) {
    const dead = new Set(killedIds);
    world.mobs = world.mobs.filter((m) => !dead.has(m.id));
    for (const id of killedIds) world.sword.lastHits.delete(id);
  }

  // Vieillissement particules.
  for (const p of world.particles) {
    p.ageMs += dtMs;
    p.pos.x += p.vel.x * dtSec;
    p.pos.y += p.vel.y * dtSec;
    p.vel.x *= 0.92;
    p.vel.y *= 0.92;
  }
  world.particles = world.particles.filter((p) => p.ageMs < p.lifeMs);

  for (const pop of world.popups) pop.ageMs += dtMs;
  world.popups = world.popups.filter((p) => p.ageMs < p.lifeMs);

  // Trail aging.
  for (const t of world.trail) t.ageMs += dtMs;
  world.trail = world.trail.filter((t) => t.ageMs < TRAIL_LIFE_MS);
}

function grantXp(world: World, amount: number, hooks: TickHooks) {
  world.sword.xp += amount;
  let leveledUp = false;
  while (world.sword.xp >= xpToNextLevel(world.sword.level)) {
    world.sword.xp -= xpToNextLevel(world.sword.level);
    world.sword.level += 1;
    leveledUp = true;
    hooks.onLevelUp(world.sword.level);
  }
  if (leveledUp) {
    world.flashMs = BALANCE.juice.levelUpFlashMs;
    world.popups.push({
      pos: { x: world.player.pos.x, y: world.player.pos.y - 30 },
      text: `LVL ${world.sword.level}`,
      lifeMs: 900,
      ageMs: 0,
      color: "#9ce5ff",
    });
  }
}

function onMobKilled(world: World, mob: Mob) {
  world.screenShake = Math.max(world.screenShake, BALANCE.juice.screenShakeOnKill);
  world.hitStopMs = Math.max(world.hitStopMs, BALANCE.juice.hitStopOnKillMs);

  const count = BALANCE.juice.particlesPerKill;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const speed = BALANCE.juice.particleSpeed * (0.6 + Math.random() * 0.6);
    world.particles.push({
      pos: { x: mob.pos.x, y: mob.pos.y },
      vel: { x: Math.cos(a) * speed, y: Math.sin(a) * speed },
      lifeMs: BALANCE.juice.particleLifeMs,
      ageMs: 0,
      color: i % 2 === 0 ? "#ffe18a" : "#ff6b6b",
    });
  }

  world.popups.push({
    pos: { x: mob.pos.x, y: mob.pos.y },
    text: "+1",
    lifeMs: BALANCE.juice.popupLifeMs,
    ageMs: 0,
    color: "#ffe18a",
  });
}

function distancePointToSegment(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = a.x + t * dx;
  const cy = a.y + t * dy;
  return Math.hypot(p.x - cx, p.y - cy);
}
