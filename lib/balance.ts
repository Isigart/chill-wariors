/**
 * SOURCE DE VÉRITÉ UNIQUE pour tous les chiffres du jeu.
 * Toute modif de feel passe par ici. Aucun magic number ailleurs.
 */
export const BALANCE = {
  player: {
    radius: 18,
  },

  sword: {
    /** Stats de BASE. Les tiers de l'arbre les multiplient. */
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
    speed: 60,
    radius: 12,
    hp: 1,
    spawnDistance: 1.05, // mult sur hypot(w,h)/2 — garantit hors-écran
  },

  wave: {
    mobsBase: 7,
    mobsPerWave: 2,
    hpScale: 0.15,
    speedScale: 0.04,
    spawnRateBase: 2.0,
    spawnRatePerWave: 0.1,
    restMs: 1800,
  },

  juice: {
    screenShakeOnKill: 3,
    screenShakeDecay: 8,
    hitStopOnKillMs: 35,
    /** Cooldown global du hit-stop : pas plus d'un freeze par X ms (anti-stutter). */
    hitStopCooldownMs: 100,
    particlesPerKill: 8,
    particleLifeMs: 400,
    particleSpeed: 180,
    popupLifeMs: 600,
    popupRise: 40,
    levelUpFlashMs: 250,
    /** Alpha du clear par-dessus la frame précédente (1 = clear net, 0.3 = trail léger). */
    clearAlpha: 1,
  },

  /**
   * Arbre interne — 9 tiers par voie.
   *
   *   T1-T3  : base. Accessibles par défaut.
   *   T4-T6  : voies supérieures. Débloquées par 1 sacrifice (une autre voie scellée).
   *   T7-T9  : voies finales. Débloquées par un 2e sacrifice (une autre voie scellée).
   *
   * Chaque tier a un modifier multiplicatif sur les stats de base, et
   * éventuellement un flag visuel (trail, fire, phantomBlade, …).
   */
  swordTree: {
    speed: [
      // T1-T3 base
      { label: "Rotation +30%", mod: { rotationSpeed: 1.3 } },
      { label: "Traînée + Rotation +20%", mod: { rotationSpeed: 1.2, trail: true } },
      { label: "Rotation +40%", mod: { rotationSpeed: 1.4 } },
      // T4-T6 voies supérieures
      { label: "Rotation +35%", mod: { rotationSpeed: 1.35 } },
      { label: "Épée fantôme (écho à 180°)", mod: { rotationSpeed: 1.2, phantomBlade: true } },
      { label: "Rotation +40%", mod: { rotationSpeed: 1.4 } },
      // T7-T9 voies finales
      { label: "Rotation +45%", mod: { rotationSpeed: 1.45 } },
      { label: "Triple écho (3 lames)", mod: { rotationSpeed: 1.2, tripleEcho: true } },
      { label: "Disque cosmique (×1.6)", mod: { rotationSpeed: 1.6 } },
    ],
    range: [
      // T1-T3
      { label: "Longueur +30%", mod: { length: 1.3 } },
      { label: "Lame plus large", mod: { length: 1.15, width: 1.4 } },
      { label: "Longueur +25%", mod: { length: 1.25 } },
      // T4-T6
      { label: "Longueur +20% + lame +15%", mod: { length: 1.2, width: 1.15 } },
      { label: "Lame titanesque (aura)", mod: { length: 1.2, titanBlade: true } },
      { label: "Longueur +20% + lame +20%", mod: { length: 1.2, width: 1.2 } },
      // T7-T9
      { label: "Longueur +20%", mod: { length: 1.2 } },
      { label: "Ondes concentriques", mod: { length: 1.2, windWaves: true } },
      { label: "Horizon (×1.3)", mod: { length: 1.3 } },
    ],
    damage: [
      // T1-T3
      { label: "Dégâts ×2", mod: { damage: 2 } },
      { label: "Lame enflammée + ×1.5", mod: { damage: 1.5, fire: true } },
      { label: "Dégâts ×2", mod: { damage: 2 } },
      // T4-T6
      { label: "Dégâts ×1.8", mod: { damage: 1.8 } },
      { label: "Brasier intense", mod: { damage: 2, biggerFire: true } },
      { label: "Dégâts ×2", mod: { damage: 2 } },
      // T7-T9
      { label: "Dégâts ×2.5", mod: { damage: 2.5 } },
      { label: "Plasma (flammes bleues)", mod: { damage: 2, plasma: true } },
      { label: "Cataclysme (×3)", mod: { damage: 3 } },
    ],
  },
} as const;

export type SwordBranch = keyof typeof BALANCE.swordTree;
export const SWORD_BRANCHES: SwordBranch[] = ["speed", "range", "damage"];

/** Nombre total de tiers possibles par voie (9). */
export const SWORD_TIERS_PER_BRANCH = BALANCE.swordTree.speed.length;
/** Taille d'un palier d'unlock (3 tiers = base, +3 = supérieurs, +3 = finaux). */
export const TIERS_PER_BRACKET = 3;

export function xpToNextLevel(lvl: number): number {
  return Math.floor(BALANCE.sword.xpBase * Math.pow(BALANCE.sword.xpGrowth, lvl - 1));
}

export function waveMobCount(waveIndex: number): number {
  return BALANCE.wave.mobsBase + BALANCE.wave.mobsPerWave * (waveIndex - 1);
}

export function waveSpawnRate(waveIndex: number): number {
  return BALANCE.wave.spawnRateBase + BALANCE.wave.spawnRatePerWave * (waveIndex - 1);
}

export function waveMobStats(waveIndex: number): { hp: number; speed: number; radius: number } {
  const k = waveIndex - 1;
  return {
    hp: Math.ceil(BALANCE.mob.hp * (1 + BALANCE.wave.hpScale * k)),
    speed: BALANCE.mob.speed * (1 + BALANCE.wave.speedScale * k),
    radius: BALANCE.mob.radius,
  };
}

/**
 * Tier maximum accessible sur une voie pour un `extendedTier` donné.
 *  - extendedTier 0 → 3 (base seulement)
 *  - extendedTier 1 → 6 (voies supérieures unlocked)
 *  - extendedTier 2 → 9 (voies finales unlocked)
 */
export function maxAccessibleTier(extendedTier: number): number {
  return TIERS_PER_BRACKET * (1 + Math.max(0, Math.min(2, extendedTier)));
}
