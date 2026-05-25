/**
 * SOURCE DE VÉRITÉ UNIQUE pour tous les chiffres du jeu.
 *
 * Structure :
 *  - weapons.X.base       → stats par défaut tier 0
 *  - weapons.X.branches.Y → 5 tiers + 5 seuils de kills par voie
 *
 * Doc humaine des paliers : `design/SWORD_TREE.md`, `design/WEAPON_TREES.md`.
 */

export const WEAPONS = ["sword", "bow"] as const;
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
};

/** Couleur d'accent globale par arme (titre, bordure de la section HUD). */
export const WEAPON_TINT: Record<WeaponKind, string> = {
  sword: "#dde3f0",
  bow: "#ffe18a",
};

/** Label compact pour le HUD. */
export const WEAPON_LABEL: Record<WeaponKind, string> = {
  sword: "ÉPÉE",
  bow: "ARC",
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
};

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
};
