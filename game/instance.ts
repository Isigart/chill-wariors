import { BALANCE, instanceWaveSpec } from "@/lib/balance";
import type { TickHooks, World } from "./types";

const SPAWN_RATE_MINOR = 3.5; // mobs/s spawn dans une vague mineure
const TWO_PI = Math.PI * 2;

/**
 * Avance le système de vagues en mode instance.
 *
 *  - phase 'spawning' : on dépense le budget pour spawn N golems.
 *  - phase 'cleaning' : on attend que tous les golems soient morts.
 *  - phase 'rest'     : pause `restMs`, puis vague suivante.
 *
 * À l'entrée du run, instanceWave est déjà initialisé (index=1, count=0,
 * phase='spawning' avec spec à charger). On lazy-init la 1ère vague.
 */
export function tickInstanceWaves(world: World, dtMs: number, hooks: TickHooks) {
  const wave = world.instanceWave;

  // Lazy init : si remainingToSpawn = 0 et mobs vides et phase 'spawning',
  // on prépare la vague selon sa spec.
  if (wave.phase === "spawning" && wave.remainingToSpawn === 0 && world.mobs.length === 0) {
    const spec = instanceWaveSpec(wave.index);
    wave.remainingToSpawn = spec.count;
    wave.spawnAccum = 0;
  }

  switch (wave.phase) {
    case "spawning": {
      const spec = instanceWaveSpec(wave.index);
      // Major waves : spawn instantané (1 golem).
      if (spec.kind === "major") {
        while (wave.remainingToSpawn > 0) {
          spawnGolem(world, spec);
          wave.remainingToSpawn -= 1;
        }
        wave.phase = "cleaning";
        break;
      }
      // Minor waves : spawn budget.
      wave.spawnAccum += (dtMs / 1000) * SPAWN_RATE_MINOR;
      while (wave.spawnAccum >= 1 && wave.remainingToSpawn > 0) {
        wave.spawnAccum -= 1;
        wave.remainingToSpawn -= 1;
        spawnGolem(world, spec);
      }
      if (wave.remainingToSpawn <= 0) wave.phase = "cleaning";
      break;
    }
    case "cleaning": {
      if (world.mobs.length === 0) {
        wave.phase = "rest";
        wave.restMs = BALANCE.instance.restMs;
      }
      break;
    }
    case "rest": {
      wave.restMs -= dtMs;
      if (wave.restMs <= 0) {
        wave.index += 1;
        wave.phase = "spawning";
        wave.remainingToSpawn = 0;
        wave.spawnAccum = 0;
        hooks.onWaveCleared?.(wave.index);
      }
      break;
    }
  }
}

function spawnGolem(world: World, spec: ReturnType<typeof instanceWaveSpec>) {
  const { w, h } = world.viewport;
  const r = (Math.hypot(w, h) / 2) * BALANCE.instance.spawnDistance;
  const angle = Math.random() * TWO_PI;
  const cx = w / 2;
  const cy = h / 2;
  world.mobs.push({
    id: world.nextId++,
    pos: { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r },
    hp: spec.hp,
    maxHp: spec.hp,
    radius: spec.radius,
    speed: spec.speed,
    weakenedUntilMs: -Infinity,
    weakenMultiplier: 1,
    burnUntilMs: -Infinity,
    burnDps: 0,
    burnPropagationRadius: 0,
    isGolem: true,
    isMajor: spec.kind === "major",
    mithrilDrop: spec.mithril,
    contactDamage: spec.damage,
  });
}

/**
 * Gestion des dégâts au contact + invulnérabilité.
 * Doit être appelé après le déplacement des mobs et AVANT les collisions
 * armes pour que la mort du joueur stoppe le tick en cours.
 */
export function tickPlayerContact(world: World, dtMs: number, hooks: TickHooks): boolean {
  // Décrément du timer d'invuln.
  if (world.invulnUntilMs > world.nowMs) {
    // Encore invulnérable, on skip la détection des dégâts.
    return false;
  }

  const px = world.player.pos.x;
  const py = world.player.pos.y;
  const playerR = BALANCE.player.radius;

  for (const mob of world.mobs) {
    if (mob.hp <= 0) continue;
    if (!mob.isGolem || mob.contactDamage <= 0) continue;
    const dx = mob.pos.x - px;
    const dy = mob.pos.y - py;
    const r = playerR + mob.radius;
    if (dx * dx + dy * dy > r * r) continue;

    // Touché.
    world.playerHp = Math.max(0, world.playerHp - mob.contactDamage);
    world.invulnUntilMs = world.nowMs + BALANCE.instance.invulnAfterHitMs;
    hooks.onPlayerDamage?.(mob.contactDamage);

    // Effets : screen shake léger + flash rouge.
    world.screenShake = Math.max(world.screenShake, 8);
    world.flashMs = Math.max(world.flashMs, 100);
    // Particules rouges.
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * TWO_PI;
      const s = 140 * (0.5 + Math.random() * 0.8);
      world.particles.push({
        pos: { x: px, y: py },
        vel: { x: Math.cos(a) * s, y: Math.sin(a) * s },
        lifeMs: 350,
        ageMs: 0,
        color: "#ff5a5a",
      });
    }

    if (world.playerHp <= 0) {
      hooks.onPlayerDeath?.();
      return true; // mort
    }
    break; // 1 hit max par tick
  }
  return false;
}
