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
  radius: number;
  speed: number;
}

export interface Sword {
  /** Angle courant de la lame (rad). */
  angle: number;
  /** Dernier hit par mob (clé = mob.id, valeur = timestamp ms). */
  lastHits: Map<number, number>;
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
}

export interface World {
  ctx: CombatContext;
  player: Player;
  sword: Sword;
  mobs: Mob[];
  particles: Particle[];
  popups: Popup[];
  /** Amplitude courante du screen shake (px). */
  screenShake: number;
  /** Temps restant à figer (ms). Si > 0, on skip le tick. */
  hitStopMs: number;
  /** Accumulateur pour le spawn (en "mobs fractionnaires"). */
  spawnAccum: number;
  /** Compteur pour les IDs de mobs. */
  nextId: number;
  /** Taille du viewport (mise à jour au resize). */
  viewport: { w: number; h: number };
  /** Horloge interne du jeu (ms). Pour cooldowns. */
  nowMs: number;
}

export interface TickHooks {
  onKill: () => void;
}
