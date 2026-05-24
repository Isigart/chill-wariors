/**
 * SOURCE DE VÉRITÉ UNIQUE pour tous les chiffres du jeu.
 * Toute modif de feel passe par ici. Aucun magic number ailleurs.
 *
 * Itération v0.1 : tuner ces valeurs jusqu'à ce que regarder l'écran
 * pendant 30s soit satisfaisant. Si ça ne l'est pas, NE PAS toucher la
 * logique — toucher ces chiffres.
 */
export const BALANCE = {
  player: {
    radius: 18,
  },

  sword: {
    /** Longueur du pivot au bout de la lame (px). */
    length: 90,
    /** Épaisseur visuelle + tolérance de collision (px). */
    width: 14,
    /** Vitesse de rotation (rad/s). */
    rotationSpeed: 4.5,
    /** Dégâts par hit. */
    damage: 1,
    /** Anti multi-hit du même mob pendant une rotation (ms). */
    hitCooldownMs: 250,
  },

  mob: {
    /** Mobs spawnés par seconde. */
    spawnRatePerSec: 2.0,
    /** Vitesse de déplacement (px/s). */
    speed: 60,
    /** Rayon de collision et de rendu. */
    radius: 12,
    /** HP de base. */
    hp: 1,
    /** Distance de spawn = (min(w,h)/2) * spawnDistance. */
    spawnDistance: 1.2,
  },

  juice: {
    /** Amplitude initiale du screen shake déclenché à chaque kill (px). */
    screenShakeOnKill: 3,
    /** Décroissance du screen shake (unités/s). */
    screenShakeDecay: 8,
    /** Durée de la pause du temps à chaque kill (ms). */
    hitStopOnKillMs: 35,
    /** Nb de particules générées par kill. */
    particlesPerKill: 8,
    /** Durée de vie d'une particule (ms). */
    particleLifeMs: 400,
    /** Vitesse initiale d'une particule (px/s). */
    particleSpeed: 180,
    /** Durée de vie d'un popup "+1" (ms). */
    popupLifeMs: 600,
    /** Distance verticale parcourue par le popup avant fade (px). */
    popupRise: 40,
  },
} as const;
