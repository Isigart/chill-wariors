/**
 * SOURCE DE VÉRITÉ UNIQUE pour tous les chiffres du jeu.
 * Toute modif de feel passe par ici. Aucun magic number ailleurs.
 *
 * Structure :
 *  - sword.base       → stats par défaut tier 0
 *  - sword.branches.X → 5 tiers + 5 seuils de kills (cumulés sur la branche)
 *
 * Chaque tier expose `stats` (overrides numériques) et `effects` (flags
 * mécaniques consommés par game/effects.ts) + `visual` (flags consommés
 * par game/render.ts). Voir design/SWORD_TREE.md pour la doc humaine.
 */

export const BRANCHES = ["speed", "range", "damage"] as const;
export type Branch = (typeof BRANCHES)[number];

export interface TierStatOverride {
  rotationSpeed?: number;
  length?: number;
  width?: number;
  damage?: number;
  hitCooldownMs?: number;
}

export interface TierEffects {
  knockbackPx?: number;
  doubleHitPerRotation?: boolean;
  pierce?: boolean;
  critChance?: number;
  critMultiplier?: number;
  explosionRadius?: number;
  explosionDamageRatio?: number;
  hitStopMultiplier?: number;
  screenShakeMultiplier?: number;
  zoneDamagePerSec?: number;   // dégâts continus dans l'anneau (vitesse T5)
  popupColor?: string;
}

export interface TierVisual {
  trail?: number;              // intensité du trail (0..1)
  ring?: "none" | "translucent" | "dense";
  shockwaveOnRotation?: boolean;
  orbitalParticles?: boolean;
  curved?: boolean;
  trailColor?: string;
  phantomDelayMs?: number;
  goldenBlade?: boolean;
  redTint?: number;            // 0..1
  whiteFlashOnCrit?: boolean;
  permanentFire?: boolean;
  explosionVisible?: boolean;
}

export interface Tier {
  label: string;
  stats: TierStatOverride;
  effects?: TierEffects;
  visual?: TierVisual;
}

export const BALANCE = {
  player: {
    radius: 18,
  },

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
          {
            label: "Tournoiement",
            stats: { rotationSpeed: 6.0, hitCooldownMs: 200 },
            visual: { trail: 0.3 },
          },
          {
            label: "Tournoiement +",
            stats: { rotationSpeed: 8.0, hitCooldownMs: 150 },
            visual: { trail: 0.6 },
          },
          {
            label: "Anneau translucide",
            stats: { rotationSpeed: 12.0, hitCooldownMs: 100 },
            visual: { trail: 0.85, ring: "translucent" },
          },
          {
            label: "Onde de rotation",
            stats: { rotationSpeed: 15.0, hitCooldownMs: 80 },
            effects: { knockbackPx: 50 },
            visual: { trail: 0.95, ring: "translucent", shockwaveOnRotation: true },
          },
          {
            label: "Aura cinétique",
            stats: { rotationSpeed: 18.0, hitCooldownMs: 60 },
            effects: { knockbackPx: 80, zoneDamagePerSec: 4 },
            visual: { trail: 1, ring: "dense", shockwaveOnRotation: true, orbitalParticles: true },
          },
        ] satisfies Tier[],
      },
      range: {
        thresholds: [15, 75, 350, 1500, 6000] as const,
        tiers: [
          {
            label: "Allonge",
            stats: { length: 115 },
          },
          {
            label: "Lame épaisse",
            stats: { length: 150, width: 18 },
          },
          {
            label: "Faux ambrée",
            stats: { length: 220, width: 24 },
            visual: { curved: true, trailColor: "#ffb84a" },
          },
          {
            label: "Lame fantôme",
            stats: { length: 260, width: 24 },
            effects: { doubleHitPerRotation: true },
            visual: { curved: true, trailColor: "#ffb84a", phantomDelayMs: 50 },
          },
          {
            label: "Faux dorée",
            stats: { length: 320, width: 24 },
            effects: { pierce: true },
            visual: { curved: true, trailColor: "#ffb84a", phantomDelayMs: 50, goldenBlade: true },
          },
        ] satisfies Tier[],
      },
      damage: {
        thresholds: [15, 75, 350, 1500, 6000] as const,
        tiers: [
          {
            label: "Tranchant",
            stats: { damage: 2 },
            effects: { popupColor: "#ffe18a" },
          },
          {
            label: "Brutal",
            stats: { damage: 5 },
            effects: { popupColor: "#ff9a3d", hitStopMultiplier: 1.4 },
          },
          {
            label: "Brisure",
            stats: { damage: 15 },
            effects: { popupColor: "#ff5a5a", screenShakeMultiplier: 2 },
            visual: { redTint: 0.6 },
          },
          {
            label: "Coup critique",
            stats: { damage: 25 },
            effects: { popupColor: "#ff5a5a", critChance: 0.2, critMultiplier: 3 },
            visual: { redTint: 0.6, whiteFlashOnCrit: true },
          },
          {
            label: "Cataclysme",
            stats: { damage: 60 },
            effects: {
              popupColor: "#ff5a5a",
              critChance: 0.3,
              critMultiplier: 5,
              explosionRadius: 80,
              explosionDamageRatio: 0.5,
            },
            visual: { redTint: 0.6, whiteFlashOnCrit: true, permanentFire: true, explosionVisible: true },
          },
        ] satisfies Tier[],
      },
    },
  },

  mob: {
    spawnRatePerSec: 2.0,
    speed: 60,
    radius: 12,
    hp: 1,
    /** Mult sur hypot(w,h)/2 — garantit hors-écran. */
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
} as const;

/** Couleur d'accent par branche, utilisée HUD/render. */
export const BRANCH_TINT: Record<Branch, string> = {
  speed: "#7fd0ff",
  range: "#9be4a3",
  damage: "#ff8a3d",
};

/** Label court (HUD compact). */
export const BRANCH_SHORT: Record<Branch, string> = {
  speed: "VITESSE",
  range: "PORTÉE",
  damage: "DÉGÂTS",
};
