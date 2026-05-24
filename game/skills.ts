import {
  BALANCE,
  SWORD_BRANCHES,
  SWORD_TIERS_PER_BRANCH,
  maxAccessibleTier,
  type SwordBranch,
} from "@/lib/balance";

/** Une compétence acquise = (branche, tier 1-indexed). */
export interface SkillChoice {
  branch: SwordBranch;
  tier: number;
}

/** Stats effectives + flags visuels de l'épée. */
export interface EffectiveSword {
  rotationSpeed: number;
  length: number;
  width: number;
  damage: number;
  visuals: {
    trail: boolean;
    fire: boolean;
    phantomBlade: boolean;
    tripleEcho: boolean;
    titanBlade: boolean;
    windWaves: boolean;
    biggerFire: boolean;
    plasma: boolean;
  };
}

/** Hauteur courante d'une voie. Une voie scellée renvoie 0 (les tiers sont révoqués). */
export function branchHeight(
  skills: SkillChoice[],
  sealedBranches: SwordBranch[],
  branch: SwordBranch,
): number {
  if (sealedBranches.includes(branch)) return 0;
  let h = 0;
  for (const s of skills) if (s.branch === branch && s.tier > h) h = s.tier;
  return h;
}

/**
 * Le joueur peut-il prendre le prochain tier sur cette voie sans sacrifice ?
 * Vrai si la voie n'est pas scellée et que sa hauteur < maxAccessibleTier(extendedTier).
 */
export function canTakeNextTier(
  skills: SkillChoice[],
  sealedBranches: SwordBranch[],
  extendedTier: number,
  branch: SwordBranch,
): boolean {
  if (sealedBranches.includes(branch)) return false;
  const h = branchHeight(skills, sealedBranches, branch);
  return h < maxAccessibleTier(extendedTier);
}

/**
 * Une voie peut-elle débloquer le prochain bracket via sacrifice ?
 * Vrai si :
 *  - la voie n'est pas scellée
 *  - sa hauteur est exactement au plafond courant
 *  - extendedTier < 2 (il reste des brackets à débloquer)
 *  - il existe au moins une autre voie non scellée à sacrifier
 */
export function canUnlockNextBracket(
  skills: SkillChoice[],
  sealedBranches: SwordBranch[],
  extendedTier: number,
  branch: SwordBranch,
): boolean {
  if (sealedBranches.includes(branch)) return false;
  if (extendedTier >= 2) return false;
  const h = branchHeight(skills, sealedBranches, branch);
  if (h !== maxAccessibleTier(extendedTier)) return false;
  // Au moins une autre voie sacrifiable.
  const sacrificeOptions = SWORD_BRANCHES.filter(
    (b) => b !== branch && !sealedBranches.includes(b),
  );
  return sacrificeOptions.length > 0;
}

/**
 * Une voie peut-elle être présentée dans la liste de sacrifice quand on déverrouille ?
 * Vrai si non scellée et différente de la voie qu'on cherche à upgrader.
 */
export function sacrificeCandidates(
  sealedBranches: SwordBranch[],
  excludeBranch: SwordBranch,
): SwordBranch[] {
  return SWORD_BRANCHES.filter(
    (b) => b !== excludeBranch && !sealedBranches.includes(b),
  );
}

/** Existe-t-il au moins une action possible dans le modal de choix ? */
export function hasAnyChoiceAvailable(
  skills: SkillChoice[],
  sealedBranches: SwordBranch[],
  extendedTier: number,
): boolean {
  for (const b of SWORD_BRANCHES) {
    if (canTakeNextTier(skills, sealedBranches, extendedTier, b)) return true;
    if (canUnlockNextBracket(skills, sealedBranches, extendedTier, b)) return true;
  }
  return false;
}

/** Calcule les stats effectives. Les tiers des voies scellées sont ignorés. */
export function computeEffectiveSword(
  skills: SkillChoice[],
  sealedBranches: SwordBranch[],
): EffectiveSword {
  let rotationSpeed = BALANCE.sword.rotationSpeed;
  let length = BALANCE.sword.length;
  let width = BALANCE.sword.width;
  let damage = BALANCE.sword.damage;
  const visuals = {
    trail: false,
    fire: false,
    phantomBlade: false,
    tripleEcho: false,
    titanBlade: false,
    windWaves: false,
    biggerFire: false,
    plasma: false,
  };

  for (const s of skills) {
    if (sealedBranches.includes(s.branch)) continue;
    if (s.tier < 1 || s.tier > SWORD_TIERS_PER_BRANCH) continue;
    const def = BALANCE.swordTree[s.branch][s.tier - 1];
    if (!def) continue;
    const m = def.mod as Record<string, number | boolean>;
    if (typeof m.rotationSpeed === "number") rotationSpeed *= m.rotationSpeed;
    if (typeof m.length === "number") length *= m.length;
    if (typeof m.width === "number") width *= m.width;
    if (typeof m.damage === "number") damage *= m.damage;
    if (m.trail) visuals.trail = true;
    if (m.fire) visuals.fire = true;
    if (m.phantomBlade) visuals.phantomBlade = true;
    if (m.tripleEcho) visuals.tripleEcho = true;
    if (m.titanBlade) visuals.titanBlade = true;
    if (m.windWaves) visuals.windWaves = true;
    if (m.biggerFire) visuals.biggerFire = true;
    if (m.plasma) visuals.plasma = true;
  }

  return { rotationSpeed, length, width, damage, visuals };
}
