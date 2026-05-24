import { BALANCE, SWORD_TIERS_PER_BRANCH, type SwordBranch } from "@/lib/balance";

/** Une compétence acquise = (branche, tier 1-indexed). */
export interface SkillChoice {
  branch: SwordBranch;
  tier: number; // 1-indexed
}

/** Stats effectives + flags visuels de l'épée. */
export interface EffectiveSword {
  rotationSpeed: number;
  length: number;
  width: number;
  damage: number;
  /** Drapeaux visuels accumulés (trail, fire, …). */
  visuals: { trail: boolean; fire: boolean };
}

/** Hauteur courante de chaque branche pour la liste de skills donnée. */
export function branchHeight(skills: SkillChoice[], branch: SwordBranch): number {
  let h = 0;
  for (const s of skills) if (s.branch === branch && s.tier > h) h = s.tier;
  return h;
}

/** Le joueur a-t-il maxé cette branche ? */
export function isBranchMaxed(skills: SkillChoice[], branch: SwordBranch): boolean {
  return branchHeight(skills, branch) >= SWORD_TIERS_PER_BRANCH;
}

/** Renvoie la définition du PROCHAIN tier disponible sur cette branche (ou null). */
export function nextTierOf(skills: SkillChoice[], branch: SwordBranch) {
  const h = branchHeight(skills, branch);
  if (h >= SWORD_TIERS_PER_BRANCH) return null;
  return {
    branch,
    tier: h + 1,
    def: BALANCE.swordTree[branch][h], // h = index 0-based du prochain
  };
}

/**
 * Calcule les stats effectives à partir des stats de base + skills acquises.
 * Modèle multiplicatif sur les stats numériques, union sur les visuels.
 */
export function computeEffectiveSword(skills: SkillChoice[]): EffectiveSword {
  let rotationSpeed = BALANCE.sword.rotationSpeed;
  let length = BALANCE.sword.length;
  let width = BALANCE.sword.width;
  let damage = BALANCE.sword.damage;
  let trail = false;
  let fire = false;

  for (const s of skills) {
    const def = BALANCE.swordTree[s.branch][s.tier - 1];
    if (!def) continue;
    const m = def.mod as Record<string, number | boolean>;
    if (typeof m.rotationSpeed === "number") rotationSpeed *= m.rotationSpeed;
    if (typeof m.length === "number") length *= m.length;
    if (typeof m.width === "number") width *= m.width;
    if (typeof m.damage === "number") damage *= m.damage;
    if (m.trail) trail = true;
    if (m.fire) fire = true;
  }

  return { rotationSpeed, length, width, damage, visuals: { trail, fire } };
}

/**
 * Le joueur a-t-il encore au moins un tier dispo, toutes branches confondues ?
 * Sert à savoir si on doit ouvrir le modal de choix au level up.
 */
export function hasAnyAvailableTier(skills: SkillChoice[]): boolean {
  for (const b of ["speed", "range", "damage"] as SwordBranch[]) {
    if (!isBranchMaxed(skills, b)) return true;
  }
  return false;
}
