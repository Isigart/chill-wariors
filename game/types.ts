import type { EffectiveBowStats, EffectiveFireWandStats, EffectiveSwordStats } from "./progression";
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
  /** Burn DoT (baguette brasier). */
  burnUntilMs: number;
  burnDps: number;
  /** Pour propagation T4 brasier : on doit savoir si le mob meurt EN feu. */
  burnPropagationRadius: number;
}

export interface Sword {
  angle: number;
  lastHits: Map<number, number>;
  hitsThisRotation: Set<number>;
  effective: EffectiveSwordStats;
  lastShockwaveAngle: number;
}

export interface Bow {
  lastShotAt: number;
  effective: EffectiveBowStats;
}

export interface FireWand {
  lastShotAt: number;
  effective: EffectiveFireWandStats;
}

/** Projectile de la baguette. Explose à l'impact OU à portée max. */
export interface FireProjectile {
  id: number;
  pos: Vec2;
  vel: Vec2;
  /** Cible visée (pour le clampage à la portée max). */
  targetPos: Vec2;
  damage: number;
  explosionRadius: number;
  burnDurationMs: number;
  burnDps: number;
  spawnedAt: number;
  /** Distance maximale parcourue (sinon explose à portée). */
  maxDistance: number;
  traveled: number;
  isHoming: boolean;
  homingTargetId: number | null;
  isMeteor: boolean;
  meteorElevation: number; // altitude au-dessus du sol (px). Décroît jusqu'à 0.
  secondaryWave?: { delayMs: number; ratio: number };
  groundFire?: { durationMs: number; radius: number; dps: number };
  burnPropagationRadius?: number;
}

/** Patch de feu au sol (T5 brasier). */
export interface GroundFire {
  pos: Vec2;
  radius: number;
  dps: number;
  ageMs: number;
  lifeMs: number;
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
  fireWand: FireWand;
  mobs: Mob[];
  arrows: Arrow[];
  fireProjectiles: FireProjectile[];
  groundFires: GroundFire[];
  /** Explosions programmées (T4 inferno : 2e onde différée). */
  pendingExplosions: Array<{ atMs: number; pos: Vec2; damage: number; radius: number }>;
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
