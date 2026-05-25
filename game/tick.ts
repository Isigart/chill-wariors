import { BALANCE } from "@/lib/balance";
import type { Mob, TickHooks, Vec2, World } from "./types";
import { tickSpawn } from "./spawn";
import { applyKnockback, rollCrit, triggerExplosion } from "./effects";
import { tickBow } from "./bow";
import { tickFireWand } from "./fireWand";

const TRAIL_LIFE_MS = 180;
const TRAIL_SAMPLE_MS = 16;
const PHANTOM_BUFFER_MS = 80;
const TWO_PI = Math.PI * 2;

export function tickWorld(world: World, dtMs: number, hooks: TickHooks) {
  if (world.hitStopMs > 0) {
    world.hitStopMs = Math.max(0, world.hitStopMs - dtMs);
    return;
  }

  world.nowMs += dtMs;
  const dtSec = dtMs / 1000;

  world.screenShake = Math.max(0, world.screenShake - BALANCE.juice.screenShakeDecay * dtSec);
  world.flashMs = Math.max(0, world.flashMs - dtMs);

  for (const sw of world.shockwaves) sw.ageMs += dtMs;
  world.shockwaves = world.shockwaves.filter((s) => s.ageMs < s.lifeMs);

  tickSpawn(world, dtMs);

  const px = world.player.pos.x;
  const py = world.player.pos.y;
  const pivot: Vec2 = { x: px, y: py };

  // Mouvement mobs.
  for (const mob of world.mobs) {
    const dx = px - mob.pos.x;
    const dy = py - mob.pos.y;
    const dist = Math.hypot(dx, dy) || 1;
    mob.pos.x += (dx / dist) * mob.speed * dtSec;
    mob.pos.y += (dy / dist) * mob.speed * dtSec;
  }

  /* ----- ÉPÉE (équipée seulement) ----- */

  const swordActive = world.equipped === "sword";
  const sEff = world.sword.effective;
  if (!swordActive) {
    // Décay des trails / phantom pour éviter qu'ils restent à l'écran après switch.
    world.trail.length = 0;
    world.phantomTrail.length = 0;
  }
  const a0 = world.sword.angle;
  const a1 = swordActive ? (a0 + sEff.rotationSpeed * dtSec) % TWO_PI : a0;
  world.sword.angle = a1;
  const deltaA = ((a1 - a0) % TWO_PI + TWO_PI) % TWO_PI;

  const tip: Vec2 = {
    x: px + Math.cos(a1) * sEff.length,
    y: py + Math.sin(a1) * sEff.length,
  };

  if (swordActive && sEff.visual.shockwaveOnRotation) {
    const angleSinceLast = ((a1 - world.sword.lastShockwaveAngle) % TWO_PI + TWO_PI) % TWO_PI;
    if (angleSinceLast >= Math.PI) {
      world.sword.lastShockwaveAngle = a1;
      world.shockwaves.push({ pos: { ...pivot }, radius: 0, ageMs: 0, lifeMs: 360 });
    }
  }

  if (swordActive && sEff.visual.trail && sEff.visual.trail > 0) {
    const last = world.trail[0];
    if (!last || last.ageMs >= TRAIL_SAMPLE_MS) {
      world.trail.unshift({ tip: { ...tip }, pivot: { ...pivot }, ageMs: 0 });
    }
  } else {
    world.trail.length = 0;
  }

  if (swordActive && sEff.visual.phantomDelayMs) {
    world.phantomTrail.unshift({ tip: { ...tip }, pivot: { ...pivot }, ts: world.nowMs });
    while (
      world.phantomTrail.length > 1 &&
      world.phantomTrail[world.phantomTrail.length - 1].ts < world.nowMs - PHANTOM_BUFFER_MS
    ) {
      world.phantomTrail.pop();
    }
  } else {
    world.phantomTrail.length = 0;
  }

  if (Math.floor(a0 / Math.PI) !== Math.floor(a1 / Math.PI) && a1 < a0) {
    world.sword.hitsThisRotation.clear();
  }

  const halfWidth = sEff.width / 2;
  const reach = sEff.length + halfWidth;
  const killedIds: number[] = [];

  if (swordActive) for (const mob of world.mobs) {
    if (mob.hp <= 0) continue;

    const dx = mob.pos.x - px;
    const dy = mob.pos.y - py;
    const d = Math.hypot(dx, dy);
    if (d > reach + mob.radius) continue;

    const effectiveR = mob.radius + halfWidth;
    const angR = d > effectiveR ? Math.asin(effectiveR / d) : Math.PI;

    const thetaM = Math.atan2(dy, dx);
    const offset = ((thetaM - a0) % TWO_PI + TWO_PI) % TWO_PI;
    let angDist: number;
    if (offset <= deltaA) {
      angDist = 0;
    } else {
      const distToEnd = offset - deltaA;
      const distToStart = TWO_PI - offset;
      angDist = Math.min(distToEnd, distToStart);
    }
    if (angDist > angR) continue;

    const lastHit = world.sword.lastHits.get(mob.id) ?? -Infinity;
    const cooldownOver = world.nowMs - lastHit >= sEff.hitCooldownMs;
    if (!sEff.effects.pierce && !cooldownOver) {
      if (
        sEff.effects.doubleHitPerRotation &&
        !world.sword.hitsThisRotation.has(mob.id)
      ) {
        // OK : second hit autorisé.
      } else {
        continue;
      }
    }

    if (!sEff.effects.pierce) world.sword.lastHits.set(mob.id, world.nowMs);
    world.sword.hitsThisRotation.add(mob.id);

    const { crit, mult } = rollCrit(sEff);
    const weakMult = world.nowMs < mob.weakenedUntilMs ? mob.weakenMultiplier : 1;
    const damage = sEff.damage * mult * weakMult;
    mob.hp -= damage;

    if (sEff.effects.knockbackPx) {
      applyKnockback(mob, pivot, sEff.effects.knockbackPx);
    }

    if (mob.hp <= 0) {
      killedIds.push(mob.id);
      onMobKilledBySword(world, mob, crit, sEff, hooks);
    } else {
      world.popups.push({
        pos: { x: mob.pos.x, y: mob.pos.y },
        text: crit ? `CRIT ${Math.floor(damage)}` : `${Math.floor(damage)}`,
        lifeMs: 500,
        ageMs: 0,
        color: sEff.effects.popupColor ?? "#ffe18a",
        size: crit ? 26 : 18,
      });
    }
  }

  if (killedIds.length > 0) {
    const dead = new Set(killedIds);
    world.mobs = world.mobs.filter((m) => !dead.has(m.id));
    for (const id of killedIds) world.sword.lastHits.delete(id);
  }

  // Aura cinétique (vitesse T5).
  if (swordActive && sEff.effects.zoneDamagePerSec) {
    const auraRadius = sEff.length + halfWidth;
    const auraInner = Math.max(0, sEff.length - 30);
    const damageThisTick = sEff.effects.zoneDamagePerSec * dtSec;
    const zoneKilled: number[] = [];
    for (const mob of world.mobs) {
      if (mob.hp <= 0) continue;
      const dxm = mob.pos.x - px;
      const dym = mob.pos.y - py;
      const dm = Math.hypot(dxm, dym);
      if (dm > auraRadius + mob.radius || dm < auraInner - mob.radius) continue;
      mob.hp -= damageThisTick;
      if (mob.hp <= 0) {
        zoneKilled.push(mob.id);
        onMobKilledBySword(world, mob, false, sEff, hooks);
      }
    }
    if (zoneKilled.length > 0) {
      const dead = new Set(zoneKilled);
      world.mobs = world.mobs.filter((m) => !dead.has(m.id));
      for (const id of zoneKilled) world.sword.lastHits.delete(id);
    }
  }

  /* ----- ARC ----- */

  tickBow(world, dtMs, hooks);

  /* ----- BAGUETTE DE FEU ----- */

  tickFireWand(world, dtMs, hooks);

  /* ----- Vieillissement particules / popups / trail ----- */

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

function onMobKilledBySword(world: World, mob: Mob, crit: boolean, sEff: typeof world.sword.effective, hooks: TickHooks) {
  const shakeMult = sEff.effects.screenShakeMultiplier ?? 1;
  world.screenShake = Math.max(world.screenShake, BALANCE.juice.screenShakeOnKill * shakeMult);

  const hitStopMult = sEff.effects.hitStopMultiplier ?? 1;
  if (world.nowMs - world.lastHitStopAt >= BALANCE.juice.hitStopCooldownMs) {
    world.hitStopMs = Math.max(world.hitStopMs, BALANCE.juice.hitStopOnKillMs * hitStopMult);
    world.lastHitStopAt = world.nowMs;
  }

  if (crit && sEff.visual.whiteFlashOnCrit) {
    world.flashMs = Math.max(world.flashMs, 80);
  }

  world.popups.push({
    pos: { x: mob.pos.x, y: mob.pos.y },
    text: crit ? `CRIT` : `+1`,
    lifeMs: BALANCE.juice.popupLifeMs,
    ageMs: 0,
    color: sEff.effects.popupColor ?? "#ffe18a",
    size: crit ? 28 : 20,
  });

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

  if (sEff.effects.explosionRadius && sEff.effects.explosionDamageRatio) {
    const r = sEff.effects.explosionRadius;
    const ratio = sEff.effects.explosionDamageRatio;
    const damage = sEff.damage * ratio;
    const chained = triggerExplosion(world, mob.pos, damage, r, 0);
    world.shockwaves.push({ pos: { ...mob.pos }, radius: 0, ageMs: 0, lifeMs: 280 });
    if (chained.length > 0) {
      const chainedSet = new Set(chained.map((m) => m.id));
      world.mobs = world.mobs.filter((m) => !chainedSet.has(m.id));
      for (const id of chainedSet) world.sword.lastHits.delete(id);
      for (let k = 0; k < chained.length; k++) hooks.onKill();
    }
  }

  hooks.onKill();
}
