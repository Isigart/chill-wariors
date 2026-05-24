/**
 * SOURCE DE VÉRITÉ UNIQUE pour tous les chiffres du jeu.
 * Toute modif de feel passe par ici. Aucun magic number ailleurs.
 */
export const BALANCE = {
  player: {
    radius: 18,
  },

  sword: {
    /** Stats de BASE. Les paliers de l'arbre les multiplient. */
    length: 90,
    width: 14,
    rotationSpeed: 4.5,
    damage: 1,
    hitCooldownMs: 250,

    /** XP. Niveau N coûte floor(xpBase * xpGrowth^(N-1)). */
    xpPerKill: 1,
    xpBase: 10,
    xpGrowth: 1.4,
  },

  mob: {
    /** Stats de BASE. Les vagues les scaling. */
    speed: 60,
    radius: 12,
    hp: 1,
    spawnDistance: 1.2,
  },

  wave: {
    /** Vague N : mobsBase + mobsPerWave × (N-1). */
    mobsBase: 7,
    mobsPerWave: 2,
    /** Multiplicateurs scaling : 1 + factor × (N-1). */
    hpScale: 0.15,
    speedScale: 0.04,
    /** Spawn rate de la vague (mobs/s). Augmente lentement. */
    spawnRateBase: 2.0,
    spawnRatePerWave: 0.1,
    /** Pause entre vagues (ms). */
    restMs: 1800,
  },

  juice: {
    screenShakeOnKill: 3,
    screenShakeDecay: 8,
    hitStopOnKillMs: 35,
    particlesPerKill: 8,
    particleLifeMs: 400,
    particleSpeed: 180,
    popupLifeMs: 600,
    popupRise: 40,
    /** Quand un level up arrive : flash bref + popup, indép. du hit-stop. */
    levelUpFlashMs: 250,
  },

  /**
   * Arbre interne de l'épée tournoyante.
   * 3 branches × 3 tiers. Chaque tier est UN modifier appliqué à la base.
   * Visual flags = drapeaux de rendu (utilisés dans render.ts).
   */
  swordTree: {
    speed: [
      { label: "Rotation +30%", mod: { rotationSpeed: 1.3 } },
      { label: "Traînée + Rotation +20%", mod: { rotationSpeed: 1.2, trail: true } },
      { label: "Rotation +50%", mod: { rotationSpeed: 1.5 } },
    ],
    range: [
      { label: "Longueur +30%", mod: { length: 1.3 } },
      { label: "Épée plus large", mod: { length: 1.15, width: 1.4 } },
      { label: "Longueur +40% (encore)", mod: { length: 1.4 } },
    ],
    damage: [
      { label: "Dégâts ×2", mod: { damage: 2 } },
      { label: "Lame enflammée + Dégâts ×1.5", mod: { damage: 1.5, fire: true } },
      { label: "Dégâts ×2 (encore)", mod: { damage: 2 } },
    ],
  },
} as const;

/** Type des branches du tree. Évite les strings magiques ailleurs. */
export type SwordBranch = keyof typeof BALANCE.swordTree;
export const SWORD_BRANCHES: SwordBranch[] = ["speed", "range", "damage"];
export const SWORD_TIERS_PER_BRANCH = BALANCE.swordTree.speed.length;

/** XP requis pour passer DU niveau (lvl) AU niveau (lvl+1). */
export function xpToNextLevel(lvl: number): number {
  return Math.floor(BALANCE.sword.xpBase * Math.pow(BALANCE.sword.xpGrowth, lvl - 1));
}

/** Nombre de mobs pour la vague N (1-indexed). */
export function waveMobCount(waveIndex: number): number {
  return BALANCE.wave.mobsBase + BALANCE.wave.mobsPerWave * (waveIndex - 1);
}

/** Spawn rate (mobs/s) pour la vague N. */
export function waveSpawnRate(waveIndex: number): number {
  return BALANCE.wave.spawnRateBase + BALANCE.wave.spawnRatePerWave * (waveIndex - 1);
}

/** Stats du mob à la vague N. */
export function waveMobStats(waveIndex: number): { hp: number; speed: number; radius: number } {
  const k = waveIndex - 1;
  return {
    hp: Math.ceil(BALANCE.mob.hp * (1 + BALANCE.wave.hpScale * k)),
    speed: BALANCE.mob.speed * (1 + BALANCE.wave.speedScale * k),
    radius: BALANCE.mob.radius,
  };
}
