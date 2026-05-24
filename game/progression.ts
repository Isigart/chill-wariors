import {
  BALANCE,
  BRANCHES,
  type Branch,
  type TierEffects,
  type TierStatOverride,
  type TierVisual,
} from "@/lib/balance";

/** Tier max possible par voie (5). */
export const MAX_TIER = 5;

/** État de progression de l'épée. */
export interface SwordProgression {
  trainingBranch: Branch;
  xp: Record<Branch, number>;
  tier: Record<Branch, number>; // 0..MAX_TIER
}

/** Stats effectives calculées. Lues par tick.ts et render.ts. */
export interface EffectiveSwordStats {
  length: number;
  width: number;
  rotationSpeed: number;
  damage: number;
  hitCooldownMs: number;
  effects: TierEffects;
  visual: TierVisual;
}

/** Crée une progression initiale (toute fraîche). */
export function createProgression(): SwordProgression {
  return {
    trainingBranch: "speed",
    xp: { speed: 0, range: 0, damage: 0 },
    tier: { speed: 0, range: 0, damage: 0 },
  };
}

/** Change la branche entraînée (sans coût). */
export function setTrainingBranch(prog: SwordProgression, branch: Branch) {
  prog.trainingBranch = branch;
}

/**
 * Ajoute `amount` xp sur la branche entraînée.
 * Si un palier est franchi, incrémente le tier et renvoie {branch, tier}.
 * Plusieurs paliers peuvent être franchis d'un coup (cap à MAX_TIER).
 */
export function awardXp(
  prog: SwordProgression,
  amount: number,
): { branch: Branch; tier: number } | null {
  const b = prog.trainingBranch;
  if (prog.tier[b] >= MAX_TIER) return null;
  prog.xp[b] += amount;

  const thresholds = BALANCE.sword.branches[b].thresholds;
  let unlocked: { branch: Branch; tier: number } | null = null;
  while (
    prog.tier[b] < MAX_TIER &&
    prog.xp[b] >= thresholds[prog.tier[b]]
  ) {
    prog.tier[b] += 1;
    unlocked = { branch: b, tier: prog.tier[b] };
  }
  return unlocked;
}

/**
 * XP requis pour atteindre le tier suivant ET XP courant DANS le palier
 * courant (pour afficher une jauge propre).
 */
export function gaugeOf(prog: SwordProgression, branch: Branch) {
  const t = prog.tier[branch];
  if (t >= MAX_TIER) {
    return { current: 1, max: 1, atMax: true };
  }
  const thresholds = BALANCE.sword.branches[branch].thresholds;
  const prev = t === 0 ? 0 : thresholds[t - 1];
  const next = thresholds[t];
  return {
    current: prog.xp[branch] - prev,
    max: next - prev,
    atMax: false,
  };
}

/**
 * Calcule les stats effectives = base + overrides du tier ATTEINT de
 * chaque branche. Les flags d'effets et de visuels sont fusionnés
 * additivement (les flags les plus récents écrasent les anciens).
 */
export function getEffectiveSwordStats(prog: SwordProgression): EffectiveSwordStats {
  const base = BALANCE.sword.base;
  const stats: TierStatOverride = {
    length: base.length,
    width: base.width,
    rotationSpeed: base.rotationSpeed,
    damage: base.damage,
    hitCooldownMs: base.hitCooldownMs,
  };
  const effects: TierEffects = {};
  const visual: TierVisual = {};

  for (const branch of BRANCHES) {
    const t = prog.tier[branch];
    if (t === 0) continue;
    // Le tier `t` correspond à l'index t-1 (tiers 0-indexed dans le tableau).
    const def = BALANCE.sword.branches[branch].tiers[t - 1];
    Object.assign(stats, def.stats);
    if (def.effects) Object.assign(effects, def.effects);
    if (def.visual) Object.assign(visual, def.visual);
  }

  return {
    length: stats.length ?? base.length,
    width: stats.width ?? base.width,
    rotationSpeed: stats.rotationSpeed ?? base.rotationSpeed,
    damage: stats.damage ?? base.damage,
    hitCooldownMs: stats.hitCooldownMs ?? base.hitCooldownMs,
    effects,
    visual,
  };
}
