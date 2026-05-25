import {
  BALANCE,
  BRANCHES_OF,
  MAX_TIER,
  type BowStatOverride,
  type BowTierEffects,
  type BowTierVisual,
  type FireWandStatOverride,
  type FireWandTierEffects,
  type FireWandTierVisual,
  type SwordStatOverride,
  type SwordTierEffects,
  type SwordTierVisual,
  type WeaponKind,
} from "@/lib/balance";

/** Progression d'UNE arme : ses XPs et tiers par branche. */
export interface WeaponProgression {
  xp: Record<string, number>;
  tier: Record<string, number>;
}

/** Progression GLOBALE du jeu : armes + sélection de training + arme équipée. */
export interface GameProgression {
  /** Arme actuellement équipée (1 seule active à la fois en v0.5). */
  equipped: WeaponKind;
  /** Branche entraînée pour l'arme équipée. */
  trainingBranch: string;
  weapons: Record<WeaponKind, WeaponProgression>;
}

/* ---------- Stats effectives ---------- */

export interface EffectiveSwordStats {
  length: number;
  width: number;
  rotationSpeed: number;
  damage: number;
  hitCooldownMs: number;
  effects: SwordTierEffects;
  visual: SwordTierVisual;
}

export interface EffectiveBowStats {
  range: number;
  arrowSpeed: number;
  fireRateMs: number;
  damage: number;
  arrowsPerShot: number;
  spreadDegrees: number;
  pierceCount: number;
  effects: BowTierEffects;
  visual: BowTierVisual;
}

export interface EffectiveFireWandStats {
  range: number;
  projectileSpeed: number;
  fireRateMs: number;
  damage: number;
  explosionRadius: number;
  burnDurationMs: number;
  burnDps: number;
  projectilesPerShot: number;
  effects: FireWandTierEffects;
  visual: FireWandTierVisual;
}

/* ---------- Init ---------- */

function emptyWeaponProg(kind: WeaponKind): WeaponProgression {
  const xp: Record<string, number> = {};
  const tier: Record<string, number> = {};
  for (const b of BRANCHES_OF[kind]) {
    xp[b as string] = 0;
    tier[b as string] = 0;
  }
  return { xp, tier };
}

export function createProgression(): GameProgression {
  return {
    equipped: "sword",
    trainingBranch: "speed",
    weapons: {
      sword: emptyWeaponProg("sword"),
      bow: emptyWeaponProg("bow"),
      fireWand: emptyWeaponProg("fireWand"),
    },
  };
}

/* ---------- Mutations ---------- */

/**
 * Switch d'arme : équipe `weapon` et met à jour la branche entraînée.
 * Si `branch` est omis, prend la première branche de l'arme.
 */
export function setTraining(prog: GameProgression, weapon: WeaponKind, branch?: string) {
  const branches = BRANCHES_OF[weapon] as readonly string[];
  const targetBranch = branch && branches.includes(branch) ? branch : branches[0];
  prog.equipped = weapon;
  prog.trainingBranch = targetBranch;
}

/**
 * Award `amount` xp sur la sélection courante. Renvoie le palier
 * débloqué (le plus récent en cas de multiple) ou null.
 */
export function awardXp(
  prog: GameProgression,
  amount: number,
): { weapon: WeaponKind; branch: string; tier: number } | null {
  const w = prog.equipped;
  const b = prog.trainingBranch;
  const wp = prog.weapons[w];
  if (wp.tier[b] >= MAX_TIER) return null;
  wp.xp[b] += amount;

  const thresholds = (BALANCE.weapons[w].branches as Record<string, { thresholds: readonly number[] }>)[b].thresholds;
  let unlocked: { weapon: WeaponKind; branch: string; tier: number } | null = null;
  while (wp.tier[b] < MAX_TIER && wp.xp[b] >= thresholds[wp.tier[b]]) {
    wp.tier[b] += 1;
    unlocked = { weapon: w, branch: b, tier: wp.tier[b] };
  }
  return unlocked;
}

/* ---------- Lecture ---------- */

export function gaugeOf(prog: GameProgression, weapon: WeaponKind, branch: string) {
  const wp = prog.weapons[weapon];
  const t = wp.tier[branch] ?? 0;
  if (t >= MAX_TIER) return { current: 1, max: 1, atMax: true };
  const thresholds = (BALANCE.weapons[weapon].branches as Record<string, { thresholds: readonly number[] }>)[branch].thresholds;
  const prev = t === 0 ? 0 : thresholds[t - 1];
  const next = thresholds[t];
  return {
    current: (wp.xp[branch] ?? 0) - prev,
    max: next - prev,
    atMax: false,
  };
}

export function tierOf(prog: GameProgression, weapon: WeaponKind, branch: string): number {
  return prog.weapons[weapon].tier[branch] ?? 0;
}

/* ---------- Stats effectives ---------- */

export function getEffectiveSwordStats(prog: GameProgression): EffectiveSwordStats {
  const base = BALANCE.weapons.sword.base;
  let length: number = base.length;
  let width: number = base.width;
  let rotationSpeed: number = base.rotationSpeed;
  let damage: number = base.damage;
  let hitCooldownMs: number = base.hitCooldownMs;
  const effects: SwordTierEffects = {};
  const visual: SwordTierVisual = {};

  const wp = prog.weapons.sword;
  for (const branch of BRANCHES_OF.sword) {
    const t = wp.tier[branch as string];
    if (!t || t < 1) continue;
    const def = BALANCE.weapons.sword.branches[branch].tiers[t - 1] as { stats: SwordStatOverride; effects?: SwordTierEffects; visual?: SwordTierVisual };
    if (def.stats.length !== undefined) length = def.stats.length;
    if (def.stats.width !== undefined) width = def.stats.width;
    if (def.stats.rotationSpeed !== undefined) rotationSpeed = def.stats.rotationSpeed;
    if (def.stats.damage !== undefined) damage = def.stats.damage;
    if (def.stats.hitCooldownMs !== undefined) hitCooldownMs = def.stats.hitCooldownMs;
    if (def.effects) Object.assign(effects, def.effects);
    if (def.visual) Object.assign(visual, def.visual);
  }

  return { length, width, rotationSpeed, damage, hitCooldownMs, effects, visual };
}

export function getEffectiveBowStats(prog: GameProgression): EffectiveBowStats {
  const base = BALANCE.weapons.bow.base;
  let range: number = base.range;
  let arrowSpeed: number = base.arrowSpeed;
  let fireRateMs: number = base.fireRateMs;
  let damage: number = base.damage;
  let arrowsPerShot: number = base.arrowsPerShot;
  let spreadDegrees: number = base.spreadDegrees;
  let pierceCount: number = base.pierceCount;
  const effects: BowTierEffects = {};
  const visual: BowTierVisual = {};

  const wp = prog.weapons.bow;
  for (const branch of BRANCHES_OF.bow) {
    const t = wp.tier[branch as string];
    if (!t || t < 1) continue;
    const def = BALANCE.weapons.bow.branches[branch].tiers[t - 1] as { stats: BowStatOverride; effects?: BowTierEffects; visual?: BowTierVisual };
    if (def.stats.range !== undefined) range = def.stats.range;
    if (def.stats.arrowSpeed !== undefined) arrowSpeed = def.stats.arrowSpeed;
    if (def.stats.fireRateMs !== undefined) fireRateMs = def.stats.fireRateMs;
    if (def.stats.damage !== undefined) damage = def.stats.damage;
    if (def.stats.arrowsPerShot !== undefined) arrowsPerShot = def.stats.arrowsPerShot;
    if (def.stats.spreadDegrees !== undefined) spreadDegrees = def.stats.spreadDegrees;
    if (def.stats.pierceCount !== undefined) pierceCount = def.stats.pierceCount;
    if (def.effects) Object.assign(effects, def.effects);
    if (def.visual) Object.assign(visual, def.visual);
  }

  return { range, arrowSpeed, fireRateMs, damage, arrowsPerShot, spreadDegrees, pierceCount, effects, visual };
}

export function getEffectiveFireWandStats(prog: GameProgression): EffectiveFireWandStats {
  const base = BALANCE.weapons.fireWand.base;
  let range: number = base.range;
  let projectileSpeed: number = base.projectileSpeed;
  let fireRateMs: number = base.fireRateMs;
  let damage: number = base.damage;
  let explosionRadius: number = base.explosionRadius;
  let burnDurationMs: number = base.burnDurationMs;
  let burnDps: number = base.burnDps;
  let projectilesPerShot: number = base.projectilesPerShot;
  const effects: FireWandTierEffects = {};
  const visual: FireWandTierVisual = {};

  const wp = prog.weapons.fireWand;
  for (const branch of BRANCHES_OF.fireWand) {
    const t = wp.tier[branch as string];
    if (!t || t < 1) continue;
    const def = BALANCE.weapons.fireWand.branches[branch].tiers[t - 1] as { stats: FireWandStatOverride; effects?: FireWandTierEffects; visual?: FireWandTierVisual };
    if (def.stats.range !== undefined) range = def.stats.range;
    if (def.stats.projectileSpeed !== undefined) projectileSpeed = def.stats.projectileSpeed;
    if (def.stats.fireRateMs !== undefined) fireRateMs = def.stats.fireRateMs;
    if (def.stats.damage !== undefined) damage = def.stats.damage;
    if (def.stats.explosionRadius !== undefined) explosionRadius = def.stats.explosionRadius;
    if (def.stats.burnDurationMs !== undefined) burnDurationMs = def.stats.burnDurationMs;
    if (def.stats.burnDps !== undefined) burnDps = def.stats.burnDps;
    if (def.stats.projectilesPerShot !== undefined) projectilesPerShot = def.stats.projectilesPerShot;
    if (def.effects) Object.assign(effects, def.effects);
    if (def.visual) Object.assign(visual, def.visual);
  }

  return { range, projectileSpeed, fireRateMs, damage, explosionRadius, burnDurationMs, burnDps, projectilesPerShot, effects, visual };
}

export { MAX_TIER } from "@/lib/balance";
