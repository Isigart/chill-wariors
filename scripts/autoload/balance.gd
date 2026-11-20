extends Node
## Tout l'équilibrage du jeu au même endroit. Changer un chiffre ici suffit
## pour retoucher une courbe, sans chercher dans le reste du code.

# --- Héros -------------------------------------------------------------------
const BASE_STATS := {
	"strength": 5,   # dégâts
	"vitality": 5,   # PV (sert plus tard au combat à double sens)
	"agility": 5,    # vitesse d'attaque
	"luck": 1,       # bonus d'or et de critiques
}
const STAT_POINTS_PER_LEVEL := 3

## XP nécessaire pour passer du niveau `level` au suivant.
static func xp_to_next(level: int) -> float:
	return floorf(20.0 * pow(1.18, level - 1))

## Dégâts par coup.
static func hero_damage(stats: Dictionary, level: int) -> float:
	return 2.0 + stats.strength * 1.5 + level * 0.5

## Coups par seconde.
static func hero_attack_speed(stats: Dictionary) -> float:
	return 1.0 + stats.agility * 0.04

## Multiplicateur d'or.
static func gold_multiplier(stats: Dictionary) -> float:
	return 1.0 + stats.luck * 0.05

# --- Monstres et étages ------------------------------------------------------
const KILLS_PER_STAGE := 10

static func monster_hp(stage: int) -> float:
	return floorf(10.0 * pow(1.15, stage - 1))

static func monster_gold(stage: int) -> float:
	return ceilf(2.0 * pow(1.12, stage - 1))

static func monster_xp(stage: int) -> float:
	return ceilf(3.0 * pow(1.10, stage - 1))

# --- Entraînement (or -> stats) ---------------------------------------------
## Coût en or du prochain point d'entraînement d'une stat déjà entraînée `bought` fois.
static func train_cost(bought: int) -> float:
	return floorf(10.0 * pow(1.25, bought))

# --- Hors-ligne --------------------------------------------------------------
const OFFLINE_CAP_SECONDS := 8 * 3600
const OFFLINE_EFFICIENCY := 0.5
