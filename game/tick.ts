import { BALANCE } from "@/lib/balance";
import type { Mob, TickHooks, World } from "./types";
import { tickSpawn } from "./spawn";

/**
 * Avance le monde de `dtMs` millisecondes.
 *
 * Ordre des opérations (volontaire) :
 *  1. Hit-stop : si le temps est figé, on consomme dt et on sort.
 *  2. Décroissance du screen shake.
 *  3. Spawn.
 *  4. Mouvement mobs (vers le perso).
 *  5. Rotation épée + collisions épée↔mob.
 *  6. Vieillissement particules / popups.
 */
export function tickWorld(world: World, dtMs: number, hooks: TickHooks) {
  // 1. Hit-stop : le temps est figé pendant N ms après un kill.
  if (world.hitStopMs > 0) {
    world.hitStopMs = Math.max(0, world.hitStopMs - dtMs);
    return;
  }

  world.nowMs += dtMs;
  const dtSec = dtMs / 1000;

  // 2. Screen shake decay (vers 0).
  world.screenShake = Math.max(0, world.screenShake - BALANCE.juice.screenShakeDecay * dtSec);

  // 3. Spawn.
  tickSpawn(world, dtMs);

  // 4. Déplacement mobs.
  const px = world.player.pos.x;
  const py = world.player.pos.y;
  for (const mob of world.mobs) {
    const dx = px - mob.pos.x;
    const dy = py - mob.pos.y;
    const dist = Math.hypot(dx, dy) || 1;
    mob.pos.x += (dx / dist) * mob.speed * dtSec;
    mob.pos.y += (dy / dist) * mob.speed * dtSec;
  }

  // 5. Rotation épée + collisions.
  world.sword.angle = (world.sword.angle + BALANCE.sword.rotationSpeed * dtSec) % (Math.PI * 2);

  const tip = {
    x: px + Math.cos(world.sword.angle) * BALANCE.sword.length,
    y: py + Math.sin(world.sword.angle) * BALANCE.sword.length,
  };

  const killedIds: number[] = [];

  for (const mob of world.mobs) {
    if (mob.hp <= 0) continue;

    const d = distancePointToSegment(mob.pos, world.player.pos, tip);
    const hitThreshold = mob.radius + BALANCE.sword.width / 2;
    if (d > hitThreshold) continue;

    // Cooldown anti multi-hit.
    const lastHit = world.sword.lastHits.get(mob.id) ?? -Infinity;
    if (world.nowMs - lastHit < BALANCE.sword.hitCooldownMs) continue;
    world.sword.lastHits.set(mob.id, world.nowMs);

    mob.hp -= BALANCE.sword.damage;

    if (mob.hp <= 0) {
      killedIds.push(mob.id);
      onMobKilled(world, mob);
      hooks.onKill();
    }
  }

  // Purge des mobs morts et de leur entrée dans lastHits.
  if (killedIds.length > 0) {
    const dead = new Set(killedIds);
    world.mobs = world.mobs.filter((m) => !dead.has(m.id));
    for (const id of killedIds) world.sword.lastHits.delete(id);
  }

  // 6. Vieillissement particules.
  for (const p of world.particles) {
    p.ageMs += dtMs;
    p.pos.x += p.vel.x * dtSec;
    p.pos.y += p.vel.y * dtSec;
    // Friction légère pour éviter qu'elles partent trop loin.
    p.vel.x *= 0.92;
    p.vel.y *= 0.92;
  }
  world.particles = world.particles.filter((p) => p.ageMs < p.lifeMs);

  // 6 bis. Popups.
  for (const pop of world.popups) {
    pop.ageMs += dtMs;
  }
  world.popups = world.popups.filter((p) => p.ageMs < p.lifeMs);
}

function onMobKilled(world: World, mob: Mob) {
  // Screen shake : on prend le max pour ne pas se faire écraser par un kill plus mou.
  world.screenShake = Math.max(world.screenShake, BALANCE.juice.screenShakeOnKill);
  // Hit-stop.
  world.hitStopMs = Math.max(world.hitStopMs, BALANCE.juice.hitStopOnKillMs);

  // Particules.
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

  // Popup.
  world.popups.push({
    pos: { x: mob.pos.x, y: mob.pos.y },
    text: "+1",
    lifeMs: BALANCE.juice.popupLifeMs,
    ageMs: 0,
  });
}

/** Distance d'un point à un segment [a,b]. */
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
