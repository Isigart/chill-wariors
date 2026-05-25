import type { FireProjectile, Mob, TickHooks, Vec2, World } from "./types";

const TWO_PI = Math.PI * 2;

/**
 * Avance le système de la baguette de feu.
 *  - Tirs (si équipée).
 *  - Déplacement projectiles + collisions/portée → explosion.
 *  - 2e onde différée (T4 inferno).
 *  - Burn DoT sur les mobs (T1-T5 brasier).
 *  - Patches de feu au sol (T5 brasier).
 *  - Météores (T5 inferno) : descente depuis le ciel.
 */
export function tickFireWand(world: World, dtMs: number, hooks: TickHooks) {
  const eff = world.fireWand.effective;
  const wandEquipped = world.equipped === "fireWand";

  const effectiveFireRate = eff.effects.continuousStorm ? 80 : eff.fireRateMs;

  if (wandEquipped && world.nowMs - world.fireWand.lastShotAt >= effectiveFireRate) {
    const target = findNearestMob(world, eff.range);
    if (target) {
      fireVolley(world, target);
      world.fireWand.lastShotAt = world.nowMs;
    }
  }

  // 2e ondes différées (T4 inferno).
  for (let i = world.pendingExplosions.length - 1; i >= 0; i--) {
    const pe = world.pendingExplosions[i];
    if (pe.atMs > world.nowMs) continue;
    detonate(world, pe.pos, pe.damage, pe.radius, /* burnDuration */ 0, /* burnDps */ 0, undefined, undefined, undefined, hooks);
    world.pendingExplosions.splice(i, 1);
  }

  // Déplacement / impact des projectiles.
  tickFireProjectiles(world, dtMs, hooks);

  // Burn DoT sur tous les mobs marqués.
  tickBurn(world, dtMs, hooks);

  // Ground fires.
  tickGroundFires(world, dtMs, hooks);
}

function findNearestMob(world: World, range: number): Mob | null {
  const px = world.player.pos.x;
  const py = world.player.pos.y;
  let best: Mob | null = null;
  let bestDist = Infinity;
  for (const mob of world.mobs) {
    if (mob.hp <= 0) continue;
    const dx = mob.pos.x - px;
    const dy = mob.pos.y - py;
    const d = Math.hypot(dx, dy);
    if (d > range) continue;
    if (d < bestDist || (d === bestDist && best && mob.id < best.id)) {
      best = mob;
      bestDist = d;
    }
  }
  return best;
}

function fireVolley(world: World, target: Mob) {
  const eff = world.fireWand.effective;
  const px = world.player.pos.x;
  const py = world.player.pos.y;
  const baseAngle = Math.atan2(target.pos.y - py, target.pos.x - px);

  // Nombre de projectiles : multiCast forcé OU doubleCastRatio (1 / N chance).
  let count = eff.projectilesPerShot;
  if (eff.effects.multiCastCount && eff.effects.multiCastCount > count) {
    count = eff.effects.multiCastCount;
  }
  if (eff.effects.doubleCastRatio && Math.random() < eff.effects.doubleCastRatio) {
    count = Math.max(2, count);
  }

  const spreadRad = count > 1 ? (25 * Math.PI) / 180 : 0;

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1) - 0.5;
    const angle = baseAngle + t * spreadRad;

    const isMeteor = !!eff.effects.meteor;
    const isHoming = (eff.effects.homingRatio ?? 0) > 0 && Math.random() < (eff.effects.homingRatio ?? 0);

    const distToTarget = Math.hypot(target.pos.x - px, target.pos.y - py);
    const maxDistance = Math.min(eff.range, distToTarget + 40); // explose à portée si rien touché

    const proj: FireProjectile = {
      id: world.nextId++,
      pos: { x: px, y: py },
      vel: { x: Math.cos(angle) * eff.projectileSpeed, y: Math.sin(angle) * eff.projectileSpeed },
      targetPos: { x: target.pos.x, y: target.pos.y },
      damage: eff.damage,
      explosionRadius: eff.explosionRadius,
      burnDurationMs: eff.burnDurationMs,
      burnDps: eff.burnDps,
      spawnedAt: world.nowMs,
      maxDistance,
      traveled: 0,
      isHoming,
      homingTargetId: isHoming ? target.id : null,
      isMeteor,
      meteorElevation: isMeteor ? 480 : 0,
      secondaryWave: eff.effects.secondaryWave,
      groundFire: eff.effects.groundFireDurationMs
        ? {
            durationMs: eff.effects.groundFireDurationMs,
            radius: eff.effects.groundFireRadius ?? 70,
            dps: eff.effects.groundFireDps ?? 15,
          }
        : undefined,
      burnPropagationRadius: eff.effects.burnPropagationRadius,
    };

    // Météore : on téléporte la position de départ vers la cible avec une grande altitude
    // (rendue via meteorElevation), vitesse de chute uniquement.
    if (isMeteor) {
      proj.pos.x = target.pos.x;
      proj.pos.y = target.pos.y;
      proj.vel.x = 0;
      proj.vel.y = 0;
    }

    world.fireProjectiles.push(proj);
  }
}

function tickFireProjectiles(world: World, dtMs: number, hooks: TickHooks) {
  const dtSec = dtMs / 1000;
  const removed: number[] = [];

  for (let i = 0; i < world.fireProjectiles.length; i++) {
    const p = world.fireProjectiles[i];

    // Météore : descend depuis le ciel jusqu'à elevation 0.
    if (p.isMeteor && p.meteorElevation > 0) {
      // Vitesse de chute proportionnelle à l'altitude pour finir en ~0.6s.
      const fallSpeed = 480 / 0.6;
      p.meteorElevation -= fallSpeed * dtSec;
      if (p.meteorElevation <= 0) {
        p.meteorElevation = 0;
        // Impact au sol = explosion direct.
        detonateFromProjectile(world, p, hooks);
        removed.push(i);
      }
      continue;
    }

    // Homing : ajustement léger.
    if (p.isHoming) {
      let target: Mob | undefined = world.mobs.find((m) => m.id === p.homingTargetId && m.hp > 0);
      if (!target) {
        target = findNearestMob(world, 2000) ?? undefined;
        p.homingTargetId = target?.id ?? null;
      }
      if (target) {
        const dx = target.pos.x - p.pos.x;
        const dy = target.pos.y - p.pos.y;
        const desired = Math.atan2(dy, dx);
        const current = Math.atan2(p.vel.y, p.vel.x);
        let diff = desired - current;
        while (diff > Math.PI) diff -= TWO_PI;
        while (diff < -Math.PI) diff += TWO_PI;
        const step = Math.max(-3 * dtSec, Math.min(3 * dtSec, diff));
        const speed = Math.hypot(p.vel.x, p.vel.y);
        const newA = current + step;
        p.vel.x = Math.cos(newA) * speed;
        p.vel.y = Math.sin(newA) * speed;
      }
    }

    const vx = p.vel.x;
    const vy = p.vel.y;
    p.pos.x += vx * dtSec;
    p.pos.y += vy * dtSec;
    p.traveled += Math.hypot(vx, vy) * dtSec;

    // Collision avec un mob (sphère contact).
    let hit = false;
    for (const mob of world.mobs) {
      if (mob.hp <= 0) continue;
      const dx = mob.pos.x - p.pos.x;
      const dy = mob.pos.y - p.pos.y;
      const r = mob.radius + 4;
      if (dx * dx + dy * dy <= r * r) {
        hit = true;
        break;
      }
    }

    if (hit || p.traveled >= p.maxDistance) {
      detonateFromProjectile(world, p, hooks);
      removed.push(i);
      continue;
    }

    // Hors-écran avec marge.
    const m = 100;
    if (
      p.pos.x < -m ||
      p.pos.x > world.viewport.w + m ||
      p.pos.y < -m ||
      p.pos.y > world.viewport.h + m
    ) {
      removed.push(i);
    }
  }

  if (removed.length > 0) {
    const set = new Set(removed);
    world.fireProjectiles = world.fireProjectiles.filter((_, i) => !set.has(i));
  }
}

function detonateFromProjectile(world: World, p: FireProjectile, hooks: TickHooks) {
  detonate(
    world,
    p.pos,
    p.damage,
    p.explosionRadius,
    p.burnDurationMs,
    p.burnDps,
    p.secondaryWave,
    p.groundFire,
    p.burnPropagationRadius,
    hooks,
  );
}

/** Explosion en zone + burn + 2e onde + ground fire + propagation. */
function detonate(
  world: World,
  pos: Vec2,
  damage: number,
  radius: number,
  burnDuration: number,
  burnDps: number,
  secondaryWave: { delayMs: number; ratio: number } | undefined,
  groundFire: { durationMs: number; radius: number; dps: number } | undefined,
  burnPropagationRadius: number | undefined,
  hooks: TickHooks,
) {
  // FX. Pas de flash global sur chaque explosion (trop agressif en spam) ;
  // la shockwave + les particules suffisent. Le screen shake reste mais
  // proportionnel au rayon de l'explosion (T1 = ~1 px, T5 météore = ~6 px).
  world.shockwaves.push({ pos: { ...pos }, radius: 0, ageMs: 0, lifeMs: 320 });
  const shake = Math.min(6, 0.04 * radius);
  world.screenShake = Math.max(world.screenShake, shake);
  // Particules.
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TWO_PI;
    const s = 220 * (0.7 + Math.random() * 0.6);
    world.particles.push({
      pos: { x: pos.x, y: pos.y },
      vel: { x: Math.cos(a) * s, y: Math.sin(a) * s },
      lifeMs: 380,
      ageMs: 0,
      color: i % 3 === 0 ? "#ffe18a" : i % 3 === 1 ? "#ff8a3d" : "#ff5a3d",
    });
  }

  // Dégâts en zone + application burn.
  const killedThisExplosion: Mob[] = [];
  for (const mob of world.mobs) {
    if (mob.hp <= 0) continue;
    const dxm = mob.pos.x - pos.x;
    const dym = mob.pos.y - pos.y;
    const d = Math.hypot(dxm, dym);
    if (d > radius + mob.radius) continue;

    mob.hp -= damage;
    if (burnDuration > 0 && burnDps > 0) {
      mob.burnUntilMs = Math.max(mob.burnUntilMs, world.nowMs + burnDuration);
      mob.burnDps = Math.max(mob.burnDps, burnDps);
      mob.burnPropagationRadius = burnPropagationRadius ?? mob.burnPropagationRadius;
    }
    if (mob.hp <= 0) killedThisExplosion.push(mob);
  }

  // Ground fire (T5 brasier).
  if (groundFire) {
    world.groundFires.push({
      pos: { x: pos.x, y: pos.y },
      radius: groundFire.radius,
      dps: groundFire.dps,
      ageMs: 0,
      lifeMs: groundFire.durationMs,
    });
  }

  // 2e onde (T4 inferno).
  if (secondaryWave) {
    world.pendingExplosions.push({
      atMs: world.nowMs + secondaryWave.delayMs,
      pos: { ...pos },
      damage: damage * secondaryWave.ratio,
      radius: radius * 0.85,
    });
  }

  // Popups + nettoyage + hooks.onKill.
  for (const mob of killedThisExplosion) {
    world.popups.push({
      pos: { x: mob.pos.x, y: mob.pos.y },
      text: "+1",
      lifeMs: 500,
      ageMs: 0,
      color: "#ff8a3d",
    });
    if (mob.isGolem && mob.mithrilDrop > 0) {
      world.popups.push({
        pos: { x: mob.pos.x, y: mob.pos.y - 14 },
        text: `+${mob.mithrilDrop} ✦`,
        lifeMs: 950,
        ageMs: 0,
        color: "#ffd76b",
        size: mob.isMajor ? 22 : 16,
      });
    }
    // Propagation T4 brasier : si le mob meurt en feu, propage à ses voisins.
    if (mob.burnPropagationRadius && mob.burnDps > 0 && world.nowMs < mob.burnUntilMs) {
      const pr = mob.burnPropagationRadius;
      for (const other of world.mobs) {
        if (other.id === mob.id || other.hp <= 0) continue;
        const ddx = other.pos.x - mob.pos.x;
        const ddy = other.pos.y - mob.pos.y;
        if (ddx * ddx + ddy * ddy <= pr * pr) {
          other.burnUntilMs = Math.max(other.burnUntilMs, world.nowMs + 2000);
          other.burnDps = Math.max(other.burnDps, mob.burnDps);
          other.burnPropagationRadius = pr;
        }
      }
    }
    hooks.onKill(mob.mithrilDrop, mob.pos);
  }
  const deadIds = new Set(killedThisExplosion.map((m) => m.id));
  if (deadIds.size > 0) {
    world.mobs = world.mobs.filter((m) => !deadIds.has(m.id));
  }
}

function tickBurn(world: World, dtMs: number, hooks: TickHooks) {
  const dtSec = dtMs / 1000;
  const killed: Mob[] = [];
  for (const mob of world.mobs) {
    if (mob.hp <= 0) continue;
    if (world.nowMs >= mob.burnUntilMs || mob.burnDps <= 0) continue;
    mob.hp -= mob.burnDps * dtSec;
    if (mob.hp <= 0) killed.push(mob);
  }
  if (killed.length > 0) {
    for (const mob of killed) {
      world.popups.push({
        pos: { x: mob.pos.x, y: mob.pos.y },
        text: "🔥",
        lifeMs: 400,
        ageMs: 0,
        color: "#ff8a3d",
      });
      if (mob.isGolem && mob.mithrilDrop > 0) {
        world.popups.push({
          pos: { x: mob.pos.x, y: mob.pos.y - 14 },
          text: `+${mob.mithrilDrop} ✦`,
          lifeMs: 950,
          ageMs: 0,
          color: "#ffd76b",
          size: mob.isMajor ? 22 : 16,
        });
      }
      // Propagation T4 brasier.
      if (mob.burnPropagationRadius && world.nowMs < mob.burnUntilMs) {
        const pr = mob.burnPropagationRadius;
        for (const other of world.mobs) {
          if (other.id === mob.id || other.hp <= 0) continue;
          const ddx = other.pos.x - mob.pos.x;
          const ddy = other.pos.y - mob.pos.y;
          if (ddx * ddx + ddy * ddy <= pr * pr) {
            other.burnUntilMs = Math.max(other.burnUntilMs, world.nowMs + 2000);
            other.burnDps = Math.max(other.burnDps, mob.burnDps);
            other.burnPropagationRadius = pr;
          }
        }
      }
      hooks.onKill(mob.mithrilDrop, mob.pos);
    }
    const deadIds = new Set(killed.map((m) => m.id));
    world.mobs = world.mobs.filter((m) => !deadIds.has(m.id));
  }
}

function tickGroundFires(world: World, dtMs: number, hooks: TickHooks) {
  const dtSec = dtMs / 1000;
  for (const g of world.groundFires) g.ageMs += dtMs;

  const killed: Mob[] = [];
  for (const g of world.groundFires) {
    if (g.ageMs >= g.lifeMs) continue;
    for (const mob of world.mobs) {
      if (mob.hp <= 0) continue;
      const dx = mob.pos.x - g.pos.x;
      const dy = mob.pos.y - g.pos.y;
      const r = g.radius + mob.radius;
      if (dx * dx + dy * dy > r * r) continue;
      mob.hp -= g.dps * dtSec;
      if (mob.hp <= 0) killed.push(mob);
    }
  }

  if (killed.length > 0) {
    for (const mob of killed) {
      world.popups.push({
        pos: { x: mob.pos.x, y: mob.pos.y },
        text: "+1",
        lifeMs: 400,
        ageMs: 0,
        color: "#ff8a3d",
      });
      if (mob.isGolem && mob.mithrilDrop > 0) {
        world.popups.push({
          pos: { x: mob.pos.x, y: mob.pos.y - 14 },
          text: `+${mob.mithrilDrop} ✦`,
          lifeMs: 950,
          ageMs: 0,
          color: "#ffd76b",
          size: mob.isMajor ? 22 : 16,
        });
      }
      hooks.onKill(mob.mithrilDrop, mob.pos);
    }
    const deadIds = new Set(killed.map((m) => m.id));
    world.mobs = world.mobs.filter((m) => !deadIds.has(m.id));
  }

  world.groundFires = world.groundFires.filter((g) => g.ageMs < g.lifeMs);
}
