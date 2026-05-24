import type { EffectiveSword } from "./skills";

export type Vec2 = { x: number; y: number };

/**
 * Contexte de combat — prévoir dès maintenant pour brancher les
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
  /** Niveau courant (1-indexed). */
  level: number;
  /** XP accumulé DANS le niveau courant (reset à 0 au level up). */
  xp: number;
  /** Stats effectives = base × multiplicateurs des skills acquises. */
  effective: EffectiveSword;
}

/** Cycle de vie d'une vague. */
export type WavePhase = "spawning" | "cleaning" | "rest";

export interface Wave {
  index: number;
  phase: WavePhase;
  /** Mobs encore à spawner pour cette vague. */
  remainingToSpawn: number;
  /** Budget de spawn fractionnaire (accumulateur). */
  spawnAccum: number;
  /** ms restantes en phase 'rest'. */
  restMs: number;
}

/** Trace courte de la lame pour le rendu (mode visuel "trail"). */
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
}

export interface World {
  ctx: CombatContext;
  player: Player;
  sword: Sword;
  wave: Wave;
  mobs: Mob[];
  particles: Particle[];
  popups: Popup[];
  trail: SwordTrailPoint[];
  /** Amplitude courante du screen shake (px). */
  screenShake: number;
  /** Flash global blanc bref (ms restants). Pour level up. */
  flashMs: number;
  /** Temps restant à figer (ms). Si > 0, on skip le tick. */
  hitStopMs: number;
  nextId: number;
  viewport: { w: number; h: number };
  /** Horloge interne (ms). Pour cooldowns. */
  nowMs: number;
}

export interface TickHooks {
  onKill: () => void;
  onLevelUp: (newLevel: number) => void;
  onWaveCleared: (clearedIndex: number) => void;
}
