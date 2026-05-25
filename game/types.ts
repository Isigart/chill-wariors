import type { EffectiveBowStats, EffectiveSwordStats } from "./progression";
import type { WeaponKind } from "@/lib/balance";

export type Vec2 = { x: number; y: number };

export type CombatContext = {
  mode: "idle" | "instance";
  modifiers: Record<string, number>;
};

export interface Player {
  pos: Vec2;
}

export interface Mob {
  id: number;
  pos: Vec2;
  hp: number;
  maxHp: number;
  radius: number;
  speed: number;
  /** Affaiblissement temporaire (perforation T4) : multiplicateur de dégâts. */
  weakenedUntilMs: number;
  weakenMultiplier: number;
}

export interface Sword {
  angle: number;
  lastHits: Map<number, number>;
  hitsThisRotation: Set<number>;
  effective: EffectiveSwordStats;
  lastShockwaveAngle: number;
}

export interface Bow {
  /** nowMs du dernier tir effectif. */
  lastShotAt: number;
  effective: EffectiveBowStats;
}

/** Tir programmé (utile pour doubleTap : 2e volée différée). */
export interface PendingShot {
  atMs: number;
}

/** Projectile tiré par l'arc. */
export interface Arrow {
  id: number;
  pos: Vec2;
  vel: Vec2;
  damage: number;
  pierceRemaining: number;
  hitMobIds: Set<number>;
  spawnedAt: number;
  ttlMs: number;
  homing: boolean;
  homingTargetId: number | null;
  beam: boolean;
  visualTrailColor: string;
  weakeningOnPierce?: { multiplier: number; durationMs: number };
}

export interface SwordTrailPoint {
  tip: Vec2;
  pivot: Vec2;
  ageMs: number;
}

export interface Particle {
  pos: Vec2;
  vel: Vec2;
  lifeMs: number;
  ageMs: number;
  color: string;
}

export interface Popup {
  pos: Vec2;
  text: string;
  lifeMs: number;
  ageMs: number;
  color: string;
  size?: number;
}

export interface Shockwave {
  pos: Vec2;
  radius: number;
  ageMs: number;
  lifeMs: number;
}

export interface World {
  ctx: CombatContext;
  player: Player;
  /** Arme actuellement active. Seules les armes équipées tickent. */
  equipped: WeaponKind;
  sword: Sword;
  bow: Bow;
  mobs: Mob[];
  arrows: Arrow[];
  pendingShots: PendingShot[];
  particles: Particle[];
  popups: Popup[];
  trail: SwordTrailPoint[];
  shockwaves: Shockwave[];
  phantomTrail: Array<{ tip: Vec2; pivot: Vec2; ts: number }>;
  spawnAccum: number;
  screenShake: number;
  flashMs: number;
  hitStopMs: number;
  lastHitStopAt: number;
  nextId: number;
  viewport: { w: number; h: number };
  nowMs: number;
}

export interface TickHooks {
  onKill: () => void;
}
