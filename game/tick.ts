import { BALANCE, xpToNextLevel } from "@/lib/balance";
import type { Mob, TickHooks, World } from "./types";
import { tickWave } from "./waves";

const TRAIL_LIFE_MS = 180;
const TRAIL_SAMPLE_MS = 16;
const TWO_PI = Math.PI * 2;

/**
 * Avance le monde de `dtMs` millisecondes.
 *
 * Ordre :
 *  1. Hit-stop.
 *  2. Decay shake + flash.
 *  3. Cycle de vague.
 *  4. Déplacement mobs.
 *  5. Rotation épée + collisions par SWEEP (arc balayé entre frame N-1 et N).
 *  6. Vieillissement particules / popups / trail.
 */
export function tickWorld(world: World, dtMs: number, hooks: TickHooks) {
  if (world.hitStopMs > 0) {
    world.hitStopMs = Math.max(0, world.hitStopMs - dtMs);
    return;
  }

  world.nowMs += dtMs;
  const dtSec = dtMs / 1000;

  world.screenShake = Math.max(0, world.screenShake - BALANCE.juice.screenShakeDecay * dtSec);
  world.flashMs = Math.max(0, world.flashMs - dtMs);

  tickWave(world, dtMs, hooks);

  const px = world.player.pos.x;
  const py = world.player.pos.y;

  for (const mob of world.mobs) {
    const dx = px - mob.pos.x;
    const dy = py - mob.pos.y;
    const dist = Math.hypot(dx, dy) || 1;
    mob.pos.x += (dx / dist) * mob.speed * dtSec;
    mob.pos.y += (dy / dist) * mob.speed * dtSec;
  }

  const eff = world.sword.effective;
  // On capture l'angle AVANT de l'avancer pour disposer de l'arc balayé.
  const a0 = world.sword.angle;
  const a1 = (a0 + eff.rotationSpeed * dtSec) % TWO_PI;
  world.sword.angle = a1;
  const deltaA = ((a1 - a0) % TWO_PI + TWO_PI) % TWO_PI;

  const tip = {
    x: px + Math.cos(a1) * eff.length,
    y: py + Math.sin(a1) * eff.length,
  };

  if (eff.visuals.trail) {
    const last = world.trail[0];
    if (!last || last.ageMs >= TRAIL_SAMPLE_MS) {
      world.trail.unshift({ tip: { ...tip }, pivot: { x: px, y: py }, ageMs: 0 });
    }
  } else {
    world.trail.length = 0;
  }

  // Collisions par sweep angulaire : un mob est touché si son disque
  // intersecte l'aire balayée entre a0 et a1, dans la portée [0, length+r+hw].
  const halfWidth = eff.width / 2;
  const reach = eff.length + halfWidth;
  const killedIds: number[] = [];

  for (const mob of world.mobs) {
    if (mob.hp <= 0) continue;

    const dx = mob.pos.x - px;
    const dy = mob.pos.y - py;
    const d = Math.hypot(dx, dy);
    if (d > reach + mob.radius) continue;

    // Largeur angulaire du mob vue du pivot, élargie par half-width de la lame.
    // Si le mob est très proche, on considère qu'il occupe tout l'angle (Math.PI).
    const effectiveR = mob.radius + halfWidth;
    const angR = d > effectiveR ? Math.asin(effectiveR / d) : Math.PI;

    const thetaM = Math.atan2(dy, dx);
    const offset = ((thetaM - a0) % TWO_PI + TWO_PI) % TWO_PI;

    let angDist: number;
    if (offset <= deltaA) {
      angDist = 0; // centre du mob dans l'arc balayé
    } else {
      const distToEnd = offset - deltaA;
      const distToStart = TWO_PI - offset;
      angDist = Math.min(distToEnd, distToStart);
    }

    if (angDist > angR) continue;

    // Cooldown anti multi-hit (par mob).
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

  // Hit-stop : cooldown global pour ne pas geler le jeu en cas d'enchaînement.
  if (world.nowMs - world.lastHitStopAt >= BALANCE.juice.hitStopCooldownMs) {
    world.hitStopMs = Math.max(world.hitStopMs, BALANCE.juice.hitStopOnKillMs);
    world.lastHitStopAt = world.nowMs;
  }

  const count = BALANCE.juice.particlesPerKill;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TWO_PI + Math.random() * 0.3;
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
