/**
 * SOURCE DE VÉRITÉ UNIQUE pour tous les chiffres du jeu.
 *
 * Structure :
 *  - weapons.X.base       → stats par défaut tier 0
 *  - weapons.X.branches.Y → 5 tiers + 5 seuils de kills par voie
 *
 * Doc humaine des paliers : `design/SWORD_TREE.md`, `design/WEAPON_TREES.md`.
 */

export const WEAPONS = ["sword", "bow", "fireWand"] as const;
export type WeaponKind = (typeof WEAPONS)[number];

/* ------------------------------ Sword ------------------------------ */

export interface SwordStatOverride {
  rotationSpeed?: number;
  length?: number;
  width?: number;
  damage?: number;
  hitCooldownMs?: number;
}

export interface SwordTierEffects {
  knockbackPx?: number;
  doubleHitPerRotation?: boolean;
  pierce?: boolean;
  critChance?: number;
  critMultiplier?: number;
  explosionRadius?: number;
  explosionDamageRatio?: number;
  hitStopMultiplier?: number;
  screenShakeMultiplier?: number;
  zoneDamagePerSec?: number;
  popupColor?: string;
}

export interface SwordTierVisual {
  trail?: number;
  ring?: "none" | "translucent" | "dense";
  shockwaveOnRotation?: boolean;
  orbitalParticles?: boolean;
  curved?: boolean;
  trailColor?: string;
  phantomDelayMs?: number;
  goldenBlade?: boolean;
  redTint?: number;
  whiteFlashOnCrit?: boolean;
  permanentFire?: boolean;
  explosionVisible?: boolean;
}

export interface SwordTier {
  label: string;
  stats: SwordStatOverride;
  effects?: SwordTierEffects;
  visual?: SwordTierVisual;
}

/* ------------------------------ Bow ------------------------------ */

export interface BowStatOverride {
  range?: number;
  arrowSpeed?: number;
  fireRateMs?: number;
  damage?: number;
  arrowsPerShot?: number;
  spreadDegrees?: number;
  pierceCount?: number;
}

export interface BowTierEffects {
  /** T4 cadence : chaque tir lâche 2 flèches à 30ms d'écart. */
  doubleTap?: boolean;
  /** T5 cadence : flèches en continu (override fireRate). */
  continuousStream?: boolean;
  /** T4 multi : ratio de flèches homing (ex : 1/7). */
  homingRatio?: number;
  /** T4 perforation : mobs traversés prennent +X% dmg pendant Y ms. */
  weakeningOnPierce?: { multiplier: number; durationMs: number };
  /** T5 perforation : faisceau qui traverse l'écran. */
  beam?: boolean;
  popupColor?: string;
}

export interface BowTierVisual {
  trail?: number;
  trailColor?: string;
  goldenArrow?: boolean;
  redHoming?: boolean;
  plasmaBow?: boolean;
}

export interface BowTier {
  label: string;
  stats: BowStatOverride;
  effects?: BowTierEffects;
  visual?: BowTierVisual;
}

/* ------------------------------ FireWand ------------------------------ */

export interface FireWandStatOverride {
  range?: number;
  projectileSpeed?: number;
  fireRateMs?: number;
  damage?: number;
  explosionRadius?: number;
  burnDurationMs?: number;
  burnDps?: number;
  projectilesPerShot?: number;
}

export interface FireWandTierEffects {
  /** T4 inferno : 2e explosion à 50% dmg, 200ms après. */
  secondaryWave?: { delayMs: number; ratio: number };
  /** T5 inferno : météore (trajectoire depuis le ciel, shake fort). */
  meteor?: boolean;
  /** T4 brasier : un mob qui meurt brûlant propage le feu (rayon). */
  burnPropagationRadius?: number;
  /** T5 brasier : laisse un patch de feu au sol pendant N ms. */
  groundFireDurationMs?: number;
  groundFireRadius?: number;
  groundFireDps?: number;
  /** T3 lancers : 1 tir sur N (ex 1/3) lâche 2 projectiles. */
  doubleCastRatio?: number;
  /** T4 lancers : N projectiles forcés par tir. */
  multiCastCount?: number;
  /** T5 lancers : flux continu + homing partiel. */
  continuousStorm?: boolean;
  homingRatio?: number;
  popupColor?: string;
}

export interface FireWandTierVisual {
  emberPersist?: boolean;     // T2 : particules de braises qui restent
  heatWave?: boolean;         // T3 : onde de chaleur visible
  smokeVolume?: boolean;      // T4 : fumée volumétrique
  fallingMeteor?: boolean;    // T5 inferno
  bigFlames?: boolean;        // T2-T3 brasier : flammes plus grosses
  fullBurnFlames?: boolean;   // T3 brasier
  chainEffect?: boolean;      // T4 brasier
  permanentEmber?: boolean;   // T5 brasier
  wandGlow?: boolean;         // T1+ lancers
  fasterProjectile?: boolean; // T2 lancers
  multiCastEcho?: boolean;    // T3 lancers
  tripleFlamePath?: boolean;  // T4 lancers
  spewingWand?: boolean;      // T5 lancers
}

export interface FireWandTier {
  label: string;
  stats: FireWandStatOverride;
  effects?: FireWandTierEffects;
  visual?: FireWandTierVisual;
}

/* ------------------------------ BALANCE ------------------------------ */

export const BALANCE = {
  player: {
    radius: 18,
  },

  mob: {
    spawnRatePerSec: 2.0,
    speed: 60,
    radius: 12,
    hp: 1,
    spawnDistance: 1.05,
    /** Difficulté croissante : 1 tier de mobs toutes les N kills cumulés. */
    difficultyTierEvery: 200,
    /** Multiplicateurs par tier (additionnés linéairement). */
    hpPerTier: 0.5,
    speedPerTier: 0.03,
    spawnRatePerTier: 0.05,
    /** Plafond du tier pour éviter l'absurde aux très haut counts. */
    maxDifficultyTier: 50,
  },

  /** Drop des Clefs de Mine (v0.8 beta) : décisions design Pile A. */
  keys: {
    /** Taux de drop par mob tué en mode idle. */
    mineKeyDropRate: 0.005,
    /** Gating : drops désactivés tant qu'aucune arme n'est intégralement T5/T5/T5. */
    requireAnyWeaponMaxed: true,
  },

  instance: {
    playerHpMax: 100,
    /** Cooldown d'invulnérabilité après contact d'un golem (ms). */
    invulnAfterHitMs: 500,
    /** Rayon d'un golem mineur / majeur. */
    minorRadius: 16,
    majorRadius: 28,
    /** Délai entre vagues (ms). */
    restMs: 1500,
    /** Distance de spawn (multiplicateur de hypot/2). */
    spawnDistance: 1.05,
  },

  juice: {
    screenShakeOnKill: 3,
    screenShakeDecay: 8,
    hitStopOnKillMs: 35,
    hitStopCooldownMs: 100,
    particlesPerKill: 8,
    particleLifeMs: 400,
    particleSpeed: 180,
    popupLifeMs: 600,
    popupRise: 40,
    levelUpFlashMs: 250,
    clearAlpha: 1,
  },

  weapons: {
    sword: {
      base: {
        length: 90,
        width: 14,
        rotationSpeed: 4.5,
        damage: 1,
        hitCooldownMs: 250,
      },
      branches: {
        speed: {
          thresholds: [15, 75, 350, 1500, 6000] as const,
          tiers: [
            { label: "Tournoiement", stats: { rotationSpeed: 6.0, hitCooldownMs: 200 }, visual: { trail: 0.3 } },
            { label: "Tournoiement +", stats: { rotationSpeed: 8.0, hitCooldownMs: 150 }, visual: { trail: 0.6 } },
            { label: "Anneau translucide", stats: { rotationSpeed: 12.0, hitCooldownMs: 100 }, visual: { trail: 0.85, ring: "translucent" } },
            { label: "Onde de rotation", stats: { rotationSpeed: 15.0, hitCooldownMs: 80 }, effects: { knockbackPx: 50 }, visual: { trail: 0.95, ring: "translucent", shockwaveOnRotation: true } },
            { label: "Aura cinétique", stats: { rotationSpeed: 18.0, hitCooldownMs: 60 }, effects: { knockbackPx: 80, zoneDamagePerSec: 4 }, visual: { trail: 1, ring: "dense", shockwaveOnRotation: true, orbitalParticles: true } },
          ] satisfies SwordTier[],
        },
        range: {
          thresholds: [15, 75, 350, 1500, 6000] as const,
          tiers: [
            { label: "Allonge", stats: { length: 115 } },
            { label: "Lame épaisse", stats: { length: 150, width: 18 } },
            { label: "Faux ambrée", stats: { length: 220, width: 24 }, visual: { curved: true, trailColor: "#ffb84a" } },
            { label: "Lame fantôme", stats: { length: 260, width: 24 }, effects: { doubleHitPerRotation: true }, visual: { curved: true, trailColor: "#ffb84a", phantomDelayMs: 50 } },
            { label: "Faux dorée", stats: { length: 320, width: 24 }, effects: { pierce: true }, visual: { curved: true, trailColor: "#ffb84a", phantomDelayMs: 50, goldenBlade: true } },
          ] satisfies SwordTier[],
        },
        damage: {
          thresholds: [15, 75, 350, 1500, 6000] as const,
          tiers: [
            { label: "Tranchant", stats: { damage: 2 }, effects: { popupColor: "#ffe18a" } },
            { label: "Brutal", stats: { damage: 5 }, effects: { popupColor: "#ff9a3d", hitStopMultiplier: 1.4 } },
            { label: "Brisure", stats: { damage: 15 }, effects: { popupColor: "#ff5a5a", screenShakeMultiplier: 2 }, visual: { redTint: 0.6 } },
            { label: "Coup critique", stats: { damage: 25 }, effects: { popupColor: "#ff5a5a", critChance: 0.2, critMultiplier: 3 }, visual: { redTint: 0.6, whiteFlashOnCrit: true } },
            { label: "Cataclysme", stats: { damage: 60 }, effects: { popupColor: "#ff5a5a", critChance: 0.3, critMultiplier: 5, explosionRadius: 80, explosionDamageRatio: 0.5 }, visual: { redTint: 0.6, whiteFlashOnCrit: true, permanentFire: true, explosionVisible: true } },
          ] satisfies SwordTier[],
        },
      },
    },

    fireWand: {
      base: {
        range: 320,
        projectileSpeed: 280,
        fireRateMs: 900,
        damage: 3,
        explosionRadius: 50,
        burnDurationMs: 0,
        burnDps: 0,
        projectilesPerShot: 1,
      },
      branches: {
        inferno: {
          thresholds: [15, 75, 350, 1500, 6000] as const,
          tiers: [
            { label: "Flammes vives", stats: { damage: 6, explosionRadius: 65 } },
            { label: "Braises persistantes", stats: { damage: 12, explosionRadius: 85 }, visual: { emberPersist: true } },
            { label: "Onde de chaleur", stats: { damage: 25, explosionRadius: 110 }, visual: { emberPersist: true, heatWave: true } },
            { label: "Double détonation", stats: { damage: 50, explosionRadius: 140 }, effects: { secondaryWave: { delayMs: 200, ratio: 0.5 } }, visual: { emberPersist: true, heatWave: true, smokeVolume: true } },
            { label: "Météore", stats: { damage: 120, explosionRadius: 180 }, effects: { meteor: true, secondaryWave: { delayMs: 200, ratio: 0.5 } }, visual: { emberPersist: true, heatWave: true, smokeVolume: true, fallingMeteor: true } },
          ] satisfies FireWandTier[],
        },
        brasier: {
          thresholds: [15, 75, 350, 1500, 6000] as const,
          tiers: [
            { label: "Marque embrasée", stats: { burnDurationMs: 1500, burnDps: 1 } },
            { label: "Brûlure", stats: { burnDurationMs: 2500, burnDps: 3 }, visual: { bigFlames: true } },
            { label: "Immolation", stats: { burnDurationMs: 4000, burnDps: 8 }, visual: { bigFlames: true, fullBurnFlames: true } },
            { label: "Propagation", stats: { burnDurationMs: 6000, burnDps: 20 }, effects: { burnPropagationRadius: 60 }, visual: { bigFlames: true, fullBurnFlames: true, chainEffect: true } },
            { label: "Enfer permanent", stats: { burnDurationMs: 10000, burnDps: 50 }, effects: { burnPropagationRadius: 80, groundFireDurationMs: 3000, groundFireRadius: 70, groundFireDps: 15 }, visual: { bigFlames: true, fullBurnFlames: true, chainEffect: true, permanentEmber: true } },
          ] satisfies FireWandTier[],
        },
        lancers: {
          thresholds: [15, 75, 350, 1500, 6000] as const,
          tiers: [
            { label: "Cadence accrue", stats: { fireRateMs: 700 }, visual: { wandGlow: true } },
            { label: "Projectiles rapides", stats: { fireRateMs: 550, projectileSpeed: 350 }, visual: { wandGlow: true, fasterProjectile: true } },
            { label: "Double cast", stats: { fireRateMs: 400 }, effects: { doubleCastRatio: 1 / 3 }, visual: { wandGlow: true, multiCastEcho: true } },
            { label: "Triple cast", stats: { fireRateMs: 280 }, effects: { multiCastCount: 3 }, visual: { wandGlow: true, tripleFlamePath: true } },
            { label: "Tempête de feu", stats: { fireRateMs: 180 }, effects: { continuousStorm: true, homingRatio: 0.4 }, visual: { wandGlow: true, tripleFlamePath: true, spewingWand: true } },
          ] satisfies FireWandTier[],
        },
      },
    },

    bow: {
      base: {
        range: 400,
        arrowSpeed: 350,
        fireRateMs: 600,
        damage: 1,
        arrowsPerShot: 1,
        spreadDegrees: 0,
        pierceCount: 0,
      },
      branches: {
        cadence: {
          thresholds: [15, 75, 350, 1500, 6000] as const,
          tiers: [
            { label: "Tirs rapides", stats: { fireRateMs: 450 } },
            { label: "Flèches fines", stats: { fireRateMs: 320 }, visual: { trail: 0.5, trailColor: "#ffe18a" } },
            { label: "Cadence soutenue", stats: { fireRateMs: 200 }, visual: { trail: 0.8, trailColor: "#ffe18a" } },
            { label: "Double-tap", stats: { fireRateMs: 130 }, effects: { doubleTap: true }, visual: { trail: 0.9, trailColor: "#ffe18a" } },
            { label: "Tempête de flèches", stats: { fireRateMs: 80 }, effects: { continuousStream: true }, visual: { trail: 1, trailColor: "#7fd0ff", plasmaBow: true } },
          ] satisfies BowTier[],
        },
        pierce: {
          thresholds: [15, 75, 350, 1500, 6000] as const,
          tiers: [
            { label: "Perforation", stats: { pierceCount: 1 } },
            { label: "Pénétration", stats: { pierceCount: 3, damage: 2 }, visual: { trail: 0.6 } },
            { label: "Flèche lumineuse", stats: { pierceCount: 6, damage: 4 }, visual: { trail: 0.8, trailColor: "#ffffff" } },
            { label: "Onde de choc", stats: { pierceCount: 10, damage: 8 }, effects: { weakeningOnPierce: { multiplier: 1.5, durationMs: 200 } }, visual: { trail: 0.9, trailColor: "#ffffff" } },
            { label: "Rayon perçant", stats: { pierceCount: 9999, damage: 20 }, effects: { beam: true }, visual: { trail: 1, trailColor: "#ffd76b", goldenArrow: true } },
          ] satisfies BowTier[],
        },
        multi: {
          thresholds: [15, 75, 350, 1500, 6000] as const,
          tiers: [
            { label: "Éventail (2)", stats: { arrowsPerShot: 2, spreadDegrees: 15 } },
            { label: "Éventail (3)", stats: { arrowsPerShot: 3, spreadDegrees: 25 } },
            { label: "Volée (5)", stats: { arrowsPerShot: 5, spreadDegrees: 40 } },
            { label: "Tir homing (7)", stats: { arrowsPerShot: 7, spreadDegrees: 60 }, effects: { homingRatio: 1 / 7 }, visual: { redHoming: true } },
            { label: "Éventail total (12)", stats: { arrowsPerShot: 12, spreadDegrees: 360 } },
          ] satisfies BowTier[],
        },
      },
    },
  },
} as const;

/* ------------------------------ Helpers ------------------------------ */

export type BranchOf<K extends WeaponKind> = keyof (typeof BALANCE.weapons)[K]["branches"];
export type AnyBranch = BranchOf<"sword"> | BranchOf<"bow">;

export const BRANCHES_OF: { [K in WeaponKind]: readonly BranchOf<K>[] } = {
  sword: ["speed", "range", "damage"] as const,
  bow: ["cadence", "pierce", "multi"] as const,
  fireWand: ["inferno", "brasier", "lancers"] as const,
};

export const MAX_TIER = 5;

/** Couleur d'accent par arme + branche (HUD / render). */
export const BRANCH_TINT: Record<WeaponKind, Record<string, string>> = {
  sword: {
    speed: "#7fd0ff",
    range: "#9be4a3",
    damage: "#ff8a3d",
  },
  bow: {
    cadence: "#ffe18a",
    pierce: "#ffffff",
    multi: "#c8d4f0",
  },
  fireWand: {
    inferno: "#ff5a3d",
    brasier: "#ff9a3d",
    lancers: "#ffd24d",
  },
};

export const WEAPON_TINT: Record<WeaponKind, string> = {
  sword: "#dde3f0",
  bow: "#ffe18a",
  fireWand: "#ff9a3d",
};

export const WEAPON_LABEL: Record<WeaponKind, string> = {
  sword: "ÉPÉE",
  bow: "ARC",
  fireWand: "BAGUETTE",
};

export const BRANCH_LABEL: Record<WeaponKind, Record<string, string>> = {
  sword: {
    speed: "VITESSE",
    range: "PORTÉE",
    damage: "DÉGÂTS",
  },
  bow: {
    cadence: "CADENCE",
    pierce: "PIERCE",
    multi: "ÉVENTAIL",
  },
  fireWand: {
    inferno: "INFERNO",
    brasier: "BRASIER",
    lancers: "LANCERS",
  },
};

/* ------------------------------ Trempage ------------------------------ */

/**
 * Mécanique de trempage post-T5. Chaque branche maxée a un niveau de
 * trempage (entier ≥ 0) qui démarre à 0 et grandit à chaque succès au
 * rituel de l'autel.
 *
 *   probaTrempage(niveauVise, mithril) → chance de succès dans [0.05, 0.99]
 *   trempageMultiplier(niveau) → 1 + 0.05 × niveau × decay(niveau)
 */
export const TREMPAGE = {
  probaBase: (niveauVise: number) => Math.max(0.05, 1 - niveauVise * 0.01),
  bonusMax: 0.5,
  efficacite: 50,
  bonus: (mithril: number) => 0.5 * (1 - Math.exp(-Math.max(0, mithril) / 50)),
  probaCap: 0.99,
  procaFinale: (niveauVise: number, mithril: number) =>
    Math.min(0.99, Math.max(0.05, 1 - niveauVise * 0.01) + 0.5 * (1 - Math.exp(-Math.max(0, mithril) / 50))),
  /** Multiplicateur appliqué à la stat principale d'une branche selon son niveau de trempage. */
  multiplier: (niveau: number) => {
    if (niveau <= 0) return 1;
    const decay = 1 / (1 + niveau / 100);
    return 1 + 0.05 * niveau * decay;
  },
  /** Sur un échec, on retombe de N niveaux (clamp à 0). */
  failurePenalty: 10,
  /** Plafond de tentatives par visite à l'autel. */
  maxAttemptsPerVisit: 3,
  /**
   * Mithril optimal pour atteindre le cap 99% sur ce niveau visé.
   * - Si la proba de base est déjà ≥ 99% : 0 mithril.
   * - Si le cap est inatteignable (niveau trop haut) : saturation pratique
   *   (~230 mithril, soit 99% du bonus max — au-delà, < 0.01% par mithril).
   * - Sinon : valeur exacte qui amène pile à 99%.
   */
  optimalMithril: (niveauVise: number): number => {
    const pBase = Math.max(0.05, 1 - niveauVise * 0.01);
    const needed = 0.99 - pBase;
    if (needed <= 0) return 0;
    const inner = 1 - 2 * needed;
    if (inner <= 0) {
      // Cap inatteignable — bonus max = 0.5. Vise 99% du bonus.
      return 230;
    }
    return Math.ceil(-50 * Math.log(inner));
  },
} as const;

/** Quelle stat est amplifiée par le trempage d'une branche. "inverse" = stat où plus bas = mieux (fireRateMs). */
export const TREMPAGE_STAT: Record<WeaponKind, Record<string, { stat: string; inverse?: boolean }>> = {
  sword: {
    speed: { stat: "rotationSpeed" },
    range: { stat: "length" },
    damage: { stat: "damage" },
  },
  bow: {
    cadence: { stat: "fireRateMs", inverse: true },
    pierce: { stat: "damage" },
    multi: { stat: "damage" },
  },
  fireWand: {
    inferno: { stat: "damage" },
    brasier: { stat: "burnDps" },
    lancers: { stat: "fireRateMs", inverse: true },
  },
};

/** Description d'une vague d'instance. */
export interface InstanceWaveSpec {
  kind: "minor" | "major";
  count: number;
  hp: number;
  damage: number;
  speed: number;
  mithril: number;
  radius: number;
}

/**
 * Stats d'un mob idle selon les kills cumulés. Difficulté linéaire croissante.
 *  - tier = floor(kills / difficultyTierEvery), clamp à maxDifficultyTier.
 *  - hp / speed / spawnRate multipliés selon leurs taux par tier.
 *
 * Le HP est entier (mob.hp arrondi). Speed/spawnRate restent fractionnaires
 * pour préserver une variation douce.
 */
export function idleMobStats(totalKills: number): { hp: number; speed: number; spawnRate: number; tier: number } {
  const raw = Math.floor(Math.max(0, totalKills) / BALANCE.mob.difficultyTierEvery);
  const tier = Math.min(BALANCE.mob.maxDifficultyTier, raw);
  return {
    hp: Math.max(1, Math.round(BALANCE.mob.hp * (1 + tier * BALANCE.mob.hpPerTier))),
    speed: BALANCE.mob.speed * (1 + tier * BALANCE.mob.speedPerTier),
    spawnRate: BALANCE.mob.spawnRatePerSec * (1 + tier * BALANCE.mob.spawnRatePerTier),
    tier,
  };
}

/**
 * Calcule la spec de la vague `idx` (1-indexed).
 * Vagues majeures : tous les 6 (v6, v12, v18, ...).
 * Mineures entre, scaling par "ère" de 5 vagues.
 * À partir de l'ère 4 (v19+), scaling exponentiel.
 */
export function instanceWaveSpec(idx: number): InstanceWaveSpec {
  const isMajor = idx % 6 === 0;

  if (isMajor) {
    const tier = idx / 6;
    const hp = 100 * Math.pow(2.5, tier - 1);
    const damage = 2 + (tier - 1);
    const mithril = Math.round(25 * Math.pow(2, tier - 1));
    return {
      kind: "major",
      count: 1,
      hp,
      damage,
      speed: 40,
      mithril,
      radius: 28,
    };
  }

  const minorTier = Math.floor((idx - 1) / 6) + 1;
  const posInTier = ((idx - 1) % 6) + 1;
  const hpRanges: ReadonlyArray<[number, number]> = [
    [10, 20],
    [30, 50],
    [70, 120],
  ];
  const baseRange = hpRanges[minorTier - 1];
  const hpRange: [number, number] = baseRange
    ? baseRange
    : [70 * Math.pow(1.4, minorTier - 3), 120 * Math.pow(1.4, minorTier - 3)];
  const t = (posInTier - 1) / 4;
  const hp = Math.round(hpRange[0] + t * (hpRange[1] - hpRange[0]));
  const damage = minorTier <= 3 ? [1, 2, 3][minorTier - 1] : Math.ceil(3 * Math.pow(1.1, minorTier - 3));
  const speed = minorTier <= 3 ? [50, 55, 60][minorTier - 1] : 60;
  const mithril = minorTier <= 3 ? [1, 2, 4][minorTier - 1] : Math.ceil(4 * Math.pow(1.25, minorTier - 3));
  return {
    kind: "minor",
    count: 8 + minorTier * 2,
    hp,
    damage,
    speed,
    mithril,
    radius: 16,
  };
}

export const BRANCH_ICON: Record<WeaponKind, Record<string, string>> = {
  sword: {
    speed: "⚡",
    range: "🗡️",
    damage: "💥",
  },
  bow: {
    cadence: "🎯",
    pierce: "➤",
    multi: "🎆",
  },
  fireWand: {
    inferno: "💥",
    brasier: "🔥",
    lancers: "✨",
  },
};
