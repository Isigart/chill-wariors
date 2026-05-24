import type { EffectiveSwordStats } from "./progression";

export type Vec2 = { x: number; y: number };

/**
 * Contexte de combat — prévu dès maintenant pour brancher les
 * "instances" plus tard sans réécrire la logique de combat.
 */
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
}

export interface Sword {
  /** Angle courant de la lame (rad). */
  angle: number;
  /** Dernier hit par mob (clé = mob.id, valeur = timestamp ms). */
  lastHits: Map<number, number>;
  /** Mobs déjà touchés DURANT la rotation courante (pour double-hit qui les ignore). */
  hitsThisRotation: Set<number>;
  /** Stats effectives calculées (recachées sur tier change). */
  effective: EffectiveSwordStats;
  /** Angle où on a effectué le dernier déclenchement d'onde (vitesse T4/T5). */
  lastShockwaveAngle: number;
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
  /** Taille de police (px). Par défaut 20. Crit / explosion la doublent. */
  size?: number;
}

/** Onde de choc émise par les paliers vitesse T4/T5. */
export interface Shockwave {
  pos: Vec2;
  radius: number;
  ageMs: number;
  lifeMs: number;
}

export interface World {
  ctx: CombatContext;
  player: Player;
  sword: Sword;
  mobs: Mob[];
  particles: Particle[];
  popups: Popup[];
  trail: SwordTrailPoint[];
  shockwaves: Shockwave[];
  /** Position de la pointe ~50ms en arrière (palier portée T4/T5). */
  phantomTrail: Array<{ tip: Vec2; pivot: Vec2; ts: number }>;
  /** Accumulateur de spawn (mobs fractionnaires). */
  spawnAccum: number;
  /** Amplitude courante du screen shake (px). */
  screenShake: number;
  /** Flash global blanc bref (ms restants). */
  flashMs: number;
  /** Temps restant à figer (ms). */
  hitStopMs: number;
  /** Dernière fois (nowMs) où un hit-stop a été déclenché. Cooldown global. */
  lastHitStopAt: number;
  nextId: number;
  viewport: { w: number; h: number };
  /** Horloge interne (ms). */
  nowMs: number;
}

export interface TickHooks {
  onKill: () => void;
}
