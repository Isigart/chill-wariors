import { BALANCE } from "@/lib/balance";
import type { Mob, TickHooks, World } from "./types";

/**
 * Tick du bouclier équipé.
 * - Bash périodique : tous les bashCooldownMs, pulse circulaire qui inflige
 *   bashDamage + knockback dans bashRadius.
 * - Aura passive (T1+ aura) : DPS continu dans auraRadius.
 * - Bash continu (T4 forteresse) : pression légère permanente hors du rayon.
 * - Citadelle (T5 forteresse) : aucun mob ne peut entrer dans le rayon.
 * - Auto-stun (T4 aura) : chance de "ralentir" les mobs (proxy via weakenedUntilMs).
 * - Tempête statique (T5 aura) : éclair random toutes les 100ms.
 * - Reflect / Punition / Sentence (riposte) : interaction avec submersion + sky bolts.
 */
export function tickShield(world: World, dtMs: number, hooks: TickHooks) {
  if (world.equipped !== "shield") return;

  const eff = world.shield.effective;
  const now = world.nowMs;
  const dtSec = dtMs / 1000;

  // 1. Bash périodique.
  if (now - world.shield.lastBashAt >= eff.bashCooldownMs) {
    world.shield.lastBashAt = now;
    triggerBash(world, eff, hooks);
  }

  // 2. Aura DPS passive (T1+).
  if (eff.auraRadius > 0 && eff.auraDps > 0) {
    tickAura(world, eff, dtSec, hooks);
  }

  // 3. Bash continu (T4 forteresse).
  if (eff.effects.bashContinuous) {
    tickContinuousPush(world, eff, dtSec);
  }

  // 4. Citadelle (T5 forteresse) : enforce un minimum de distance.
  if (eff.effects.citadel) {
    enforceCitadel(world, eff);
  }

  // 5. Tempête statique (T5 aura) : éclairs random.
  if (eff.effects.staticStormIntervalMs && eff.effects.staticStormDamage) {
    world.shield.stormAccumMs += dtMs;
    while (world.shield.stormAccumMs >= eff.effects.staticStormIntervalMs) {
      world.shield.stormAccumMs -= eff.effects.staticStormIntervalMs;
      castStormBolt(world, eff, hooks);
    }
  }
}

function triggerBash(world: World, eff: World["shield"]["effective"], hooks: TickHooks) {
  const { x: px, y: py } = world.player.pos;
  const killed: Mob[] = [];

  for (const mob of world.mobs) {
    if (mob.hp <= 0) continue;
    const dx = mob.pos.x - px;
    const dy = mob.pos.y - py;
    const d = Math.hypot(dx, dy) || 1;
    if (d > eff.bashRadius + mob.radius) continue;

    // Dégâts.
    mob.hp -= eff.bashDamage;
    // Knockback.
    const force = eff.knockbackForce;
    mob.pos.x += (dx / d) * force;
    mob.pos.y += (dy / d) * force;

    if (mob.hp <= 0) killed.push(mob);
  }

  // Cleanup + popups + onKill.
  if (killed.length > 0) {
    for (const m of killed) {
      world.popups.push({
        pos: { x: m.pos.x, y: m.pos.y },
        text: "+1",
        lifeMs: 500,
        ageMs: 0,
        color: "#d8d4c0",
      });
      if (m.isGolem && m.mithrilDrop > 0) {
        world.popups.push({
          pos: { x: m.pos.x, y: m.pos.y - 14 },
          text: `+${m.mithrilDrop} ✦`,
          lifeMs: 950,
          ageMs: 0,
          color: "#ffd76b",
          size: m.isMajor ? 22 : 16,
        });
      }
      hooks.onKill(m.mithrilDrop, m.pos);

      // Sentence divine (T5 riposte) — éclairs random sur kill bash.
      if (eff.effects.sentenceBoltsOnKill && eff.effects.sentenceBoltDamage) {
        triggerSentence(world, m, eff.effects.sentenceBoltsOnKill, eff.effects.sentenceBoltDamage, hooks);
      }
    }
    const deadIds = new Set(killed.map((m) => m.id));
    world.mobs = world.mobs.filter((m) => !deadIds.has(m.id));
  }

  // FX visuel : pulse shockwave.
  world.shockwaves.push({
    pos: { x: px, y: py },
    radius: 0,
    ageMs: 0,
    lifeMs: 300,
  });
  if (world.shakeEnabled) {
    world.screenShake = Math.max(world.screenShake, Math.min(4, eff.bashRadius * 0.02));
  }
}

function tickAura(world: World, eff: World["shield"]["effective"], dtSec: number, hooks: TickHooks) {
  const { x: px, y: py } = world.player.pos;
  const r2 = eff.auraRadius * eff.auraRadius;
  const killed: Mob[] = [];

  for (const mob of world.mobs) {
    if (mob.hp <= 0) continue;
    const dx = mob.pos.x - px;
    const dy = mob.pos.y - py;
    if (dx * dx + dy * dy > r2) continue;
    mob.hp -= eff.auraDps * dtSec;
    // Auto-stun (T4 aura) — proxy via weakenedUntilMs (effet "slow").
    if (eff.effects.auraStunChance) {
      // probabilité par tick → conversion en chance par seconde
      const chancePerSec = eff.effects.auraStunChance * 60; // ~5% par tick → 300% par sec — trop
      // Plus juste : eff.auraStunChance est déjà "par tick", utiliser tel quel
      if (Math.random() < eff.effects.auraStunChance) {
        mob.weakenedUntilMs = Math.max(mob.weakenedUntilMs, world.nowMs + 200);
      }
      void chancePerSec;
    }
    if (mob.hp <= 0) killed.push(mob);
  }

  if (killed.length > 0) {
    for (const m of killed) {
      world.popups.push({
        pos: { x: m.pos.x, y: m.pos.y },
        text: "+1",
        lifeMs: 400,
        ageMs: 0,
        color: "#7a9a5a",
      });
      if (m.isGolem && m.mithrilDrop > 0) {
        world.popups.push({
          pos: { x: m.pos.x, y: m.pos.y - 14 },
          text: `+${m.mithrilDrop} ✦`,
          lifeMs: 950,
          ageMs: 0,
          color: "#ffd76b",
          size: m.isMajor ? 22 : 16,
        });
      }
      hooks.onKill(m.mithrilDrop, m.pos);
    }
    const deadIds = new Set(killed.map((m) => m.id));
    world.mobs = world.mobs.filter((m) => !deadIds.has(m.id));
  }
}

function tickContinuousPush(world: World, eff: World["shield"]["effective"], dtSec: number) {
  // Pression légère qui pousse constamment les mobs hors du rayon de bash.
  const { x: px, y: py } = world.player.pos;
  const pushPerSec = eff.knockbackForce * 2; // 200% du knockback bash par seconde

  for (const mob of world.mobs) {
    if (mob.hp <= 0) continue;
    const dx = mob.pos.x - px;
    const dy = mob.pos.y - py;
    const d = Math.hypot(dx, dy) || 1;
    if (d > eff.bashRadius) continue;
    const f = pushPerSec * dtSec;
    mob.pos.x += (dx / d) * f;
    mob.pos.y += (dy / d) * f;
  }
}

function enforceCitadel(world: World, eff: World["shield"]["effective"]) {
  // Aucun mob ne peut entrer dans le rayon — push hors du rayon en sortant.
  const { x: px, y: py } = world.player.pos;
  const minD = eff.bashRadius;
  const TWO_PI = Math.PI * 2;

  for (const mob of world.mobs) {
    if (mob.hp <= 0) continue;
    const dx = mob.pos.x - px;
    const dy = mob.pos.y - py;
    const d = Math.hypot(dx, dy);
    if (d >= minD) continue;

    if (d < 0.5) {
      // Cas dégénéré : mob exactement sur le perso. Pousse dans une direction random.
      const a = Math.random() * TWO_PI;
      mob.pos.x = px + Math.cos(a) * minD;
      mob.pos.y = py + Math.sin(a) * minD;
      continue;
    }
    const overflow = minD - d;
    mob.pos.x += (dx / d) * overflow;
    mob.pos.y += (dy / d) * overflow;
  }
}

function castStormBolt(world: World, eff: World["shield"]["effective"], hooks: TickHooks) {
  // Choisit un mob random dans l'aura, lui inflige des dégâts.
  const { x: px, y: py } = world.player.pos;
  const r2 = eff.auraRadius * eff.auraRadius;
  const candidates: Mob[] = [];
  for (const mob of world.mobs) {
    if (mob.hp <= 0) continue;
    const dx = mob.pos.x - px;
    const dy = mob.pos.y - py;
    if (dx * dx + dy * dy <= r2) candidates.push(mob);
  }
  if (candidates.length === 0) return;
  const target = candidates[Math.floor(Math.random() * candidates.length)];
  target.hp -= eff.effects.staticStormDamage ?? 0;
  world.popups.push({
    pos: { x: target.pos.x, y: target.pos.y },
    text: "⚡",
    lifeMs: 300,
    ageMs: 0,
    color: "#9bd47a",
  });
  if (target.hp <= 0) {
    world.mobs = world.mobs.filter((m) => m.id !== target.id);
    hooks.onKill(target.mithrilDrop, target.pos);
  }
  void BALANCE;
}

function triggerSentence(
  world: World,
  killedMob: Mob,
  count: number,
  damage: number,
  hooks: TickHooks,
) {
  const candidates = world.mobs.filter((m) => m.hp > 0 && m.id !== killedMob.id);
  const n = Math.min(count, candidates.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * candidates.length);
    const target = candidates.splice(idx, 1)[0];
    target.hp -= damage;
    world.popups.push({
      pos: { x: target.pos.x, y: target.pos.y },
      text: "⚡",
      lifeMs: 400,
      ageMs: 0,
      color: "#ffd76b",
      size: 18,
    });
    if (target.hp <= 0) {
      hooks.onKill(target.mithrilDrop, target.pos);
      world.mobs = world.mobs.filter((m) => m.id !== target.id);
    }
  }
}
