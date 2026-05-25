import type { Arrow, Mob, TickHooks, Vec2, World } from "./types";

const TWO_PI = Math.PI * 2;

/**
 * Avance le système de l'arc :
 *  - Détermine si un tir est dû (selon fireRate).
 *  - Trouve la cible la plus proche dans `range`.
 *  - Spawn une volée (1 à N flèches, avec spread).
 *  - Process les tirs différés (double-tap).
 *  - Update les flèches existantes : déplacement, homing, collision.
 */
export function tickBow(world: World, dtMs: number, hooks: TickHooks) {
  const eff = world.bow.effective;
  const bowEquipped = world.equipped === "bow";

  // Cadence : si T5 cadence (continuousStream), on tire ~16 Hz peu importe le fireRate.
  const effectiveFireRate = eff.effects.continuousStream ? 60 : eff.fireRateMs;

  if (bowEquipped && world.nowMs - world.bow.lastShotAt >= effectiveFireRate) {
    const target = findNearestMob(world);
    if (target) {
      fireVolley(world, target);
      world.bow.lastShotAt = world.nowMs;
      if (eff.effects.doubleTap) {
        world.pendingShots.push({ atMs: world.nowMs + 30 });
      }
    }
  }

  // Process pending shots (même si arc plus équipé : volée différée résolue).
  for (let i = world.pendingShots.length - 1; i >= 0; i--) {
    const ps = world.pendingShots[i];
    if (ps.atMs > world.nowMs) continue;
    if (bowEquipped) {
      const t = findNearestMob(world);
      if (t) fireVolley(world, t);
    }
    world.pendingShots.splice(i, 1);
  }

  // Les flèches en vol continuent même après désequipement (cleanup naturel).
  tickArrows(world, dtMs, hooks);
}

function findNearestMob(world: World): Mob | null {
  const px = world.player.pos.x;
  const py = world.player.pos.y;
  const range = world.bow.effective.range;
  let best: Mob | null = null;
  let bestDist = Infinity;
  for (const mob of world.mobs) {
    if (mob.hp <= 0) continue;
    const dx = mob.pos.x - px;
    const dy = mob.pos.y - py;
    const d = Math.hypot(dx, dy);
    if (d > range) continue;
    // Ties broken by id (lowest first).
    if (d < bestDist || (d === bestDist && best && mob.id < best.id)) {
      best = mob;
      bestDist = d;
    }
  }
  return best;
}

function fireVolley(world: World, target: Mob) {
  const eff = world.bow.effective;
  const px = world.player.pos.x;
  const py = world.player.pos.y;
  const baseAngle = Math.atan2(target.pos.y - py, target.pos.x - px);
  const n = Math.max(1, eff.arrowsPerShot);
  const spreadRad = (eff.spreadDegrees * Math.PI) / 180;

  // Combien de flèches homing dans la volée ?
  const homingCount = eff.effects.homingRatio
    ? Math.max(1, Math.floor(n * eff.effects.homingRatio))
    : 0;

  for (let i = 0; i < n; i++) {
    // Spread :
    //  - 360° : on répartit uniformément autour du cercle (volée totale T5 multi).
    //  - Sinon : N flèches étalées symétriquement sur [-spread/2, +spread/2].
    let angle: number;
    if (spreadRad >= TWO_PI - 0.01) {
      angle = baseAngle + (i / n) * TWO_PI;
    } else if (n === 1) {
      angle = baseAngle;
    } else {
      const t = i / (n - 1);
      angle = baseAngle - spreadRad / 2 + t * spreadRad;
    }

    const isBeam = !!eff.effects.beam;
    const speed = isBeam ? Math.max(eff.arrowSpeed, 2200) : eff.arrowSpeed;
    const ttlMs = isBeam ? 240 : Math.min(2000, (1.2 * Math.max(world.viewport.w, world.viewport.h)) / Math.max(80, eff.arrowSpeed) * 1000);
    const isHoming = i < homingCount;

    const arrow: Arrow = {
      id: world.nextId++,
      pos: { x: px, y: py },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      damage: eff.damage,
      pierceRemaining: eff.pierceCount,
      hitMobIds: new Set(),
      spawnedAt: world.nowMs,
      ttlMs,
      homing: isHoming,
      homingTargetId: isHoming ? target.id : null,
      beam: isBeam,
      visualTrailColor: isHoming ? "#ff6b6b" : (eff.visual.trailColor ?? "#ffe18a"),
      weakeningOnPierce: eff.effects.weakeningOnPierce,
    };
    world.arrows.push(arrow);
  }
}

function tickArrows(world: World, dtMs: number, hooks: TickHooks) {
  const dtSec = dtMs / 1000;
  const eff = world.bow.effective;
  const removed: number[] = [];

  for (let i = 0; i < world.arrows.length; i++) {
    const a = world.arrows[i];

    // Homing : tracker la cible courante, ajuster légèrement la direction.
    if (a.homing) {
      let target: Mob | undefined;
      if (a.homingTargetId != null) {
        target = world.mobs.find((m) => m.id === a.homingTargetId && m.hp > 0);
      }
      if (!target) {
        target = findNearestMobFrom(world, a.pos) ?? undefined;
        a.homingTargetId = target?.id ?? null;
      }
      if (target) {
        const dx = target.pos.x - a.pos.x;
        const dy = target.pos.y - a.pos.y;
        const desiredAngle = Math.atan2(dy, dx);
        const currentAngle = Math.atan2(a.vel.y, a.vel.x);
        let diff = desiredAngle - currentAngle;
        // wrap to [-PI, PI]
        while (diff > Math.PI) diff -= TWO_PI;
        while (diff < -Math.PI) diff += TWO_PI;
        const maxStep = 4 * dtSec; // ~4 rad/s de capacité de virage
        const step = Math.max(-maxStep, Math.min(maxStep, diff));
        const speed = Math.hypot(a.vel.x, a.vel.y);
        const newAngle = currentAngle + step;
        a.vel.x = Math.cos(newAngle) * speed;
        a.vel.y = Math.sin(newAngle) * speed;
      }
    }

    // Move.
    a.pos.x += a.vel.x * dtSec;
    a.pos.y += a.vel.y * dtSec;

    // Lifetime.
    if (world.nowMs - a.spawnedAt > a.ttlMs) {
      removed.push(i);
      continue;
    }

    // Hors-écran : suppression (avec marge).
    const m = 80;
    if (
      a.pos.x < -m ||
      a.pos.x > world.viewport.w + m ||
      a.pos.y < -m ||
      a.pos.y > world.viewport.h + m
    ) {
      removed.push(i);
      continue;
    }

    // Collision avec mobs.
    let consumed = false;
    for (const mob of world.mobs) {
      if (mob.hp <= 0) continue;
      if (a.hitMobIds.has(mob.id)) continue;
      const dx = mob.pos.x - a.pos.x;
      const dy = mob.pos.y - a.pos.y;
      const d2 = dx * dx + dy * dy;
      const hitR = mob.radius + 4;
      if (d2 > hitR * hitR) continue;

      a.hitMobIds.add(mob.id);

      // Dégâts × multiplicateur d'affaiblissement éventuel.
      const mult = world.nowMs < mob.weakenedUntilMs ? mob.weakenMultiplier : 1;
      const dmg = a.damage * mult;
      mob.hp -= dmg;

      // Appliquer l'affaiblissement (T4 pierce) au mob qui vient d'être traversé.
      if (a.weakeningOnPierce) {
        mob.weakenedUntilMs = world.nowMs + a.weakeningOnPierce.durationMs;
        mob.weakenMultiplier = a.weakeningOnPierce.multiplier;
      }

      // Particules d'impact.
      for (let k = 0; k < 4; k++) {
        const pa = Math.random() * TWO_PI;
        const ps = 80 + Math.random() * 80;
        world.particles.push({
          pos: { x: mob.pos.x, y: mob.pos.y },
          vel: { x: Math.cos(pa) * ps, y: Math.sin(pa) * ps },
          lifeMs: 180,
          ageMs: 0,
          color: a.visualTrailColor,
        });
      }

      if (mob.hp <= 0) {
        onMobKilledByArrow(world, mob, hooks, eff.effects.popupColor);
      }

      // Pierce ?
      if (a.pierceRemaining <= 0) {
        consumed = true;
        break;
      }
      a.pierceRemaining -= 1;
    }

    if (consumed) removed.push(i);
  }

  if (removed.length > 0) {
    // Construire un nouveau tableau filtrant les indices supprimés.
    const set = new Set(removed);
    world.arrows = world.arrows.filter((_, i) => !set.has(i));
    // Nettoyer mobs morts qui peuvent avoir été touchés.
    world.mobs = world.mobs.filter((m) => m.hp > 0);
  }
}

function findNearestMobFrom(world: World, pos: Vec2): Mob | null {
  let best: Mob | null = null;
  let bestDist = Infinity;
  for (const mob of world.mobs) {
    if (mob.hp <= 0) continue;
    const d = Math.hypot(mob.pos.x - pos.x, mob.pos.y - pos.y);
    if (d < bestDist) {
      best = mob;
      bestDist = d;
    }
  }
  return best;
}

function onMobKilledByArrow(world: World, mob: Mob, hooks: TickHooks, popupColor: string | undefined) {
  world.popups.push({
    pos: { x: mob.pos.x, y: mob.pos.y },
    text: "+1",
    lifeMs: 500,
    ageMs: 0,
    color: popupColor ?? "#ffe18a",
  });
  hooks.onKill(mob.mithrilDrop);
}
