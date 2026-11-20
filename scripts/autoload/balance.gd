extends Node
## Tout l'équilibrage et le contenu du jeu au même endroit.
## Règle du concept : un bonus trop généreux vaut mieux qu'un bonus imperceptible.

const STATS := ["strength", "vitality", "agility", "intelligence", "luck"]
const STAT_NAMES := {
	"strength": "Force", "vitality": "Vitalité", "agility": "Agilité",
	"intelligence": "Intelligence", "luck": "Chance",
}
const BASE_STAT := 5
const STAT_POINTS_PER_LEVEL := 3

# --- Classes -----------------------------------------------------------------
const CLASSES := {
	"warrior": {"name": "Guerrier", "main": "strength", "weapon": "sword", "skill": "forge",
		"desc": "Encaisse, frappe fort. Force, épée."},
	"rogue": {"name": "Voleur", "main": "agility", "weapon": "daggers", "skill": "cooking",
		"desc": "Frappe vite, critiques. Agilité, dagues. Cuisine naturelle."},
	"mage": {"name": "Mage", "main": "intelligence", "weapon": "staff", "skill": "alchemy",
		"desc": "Gros dégâts, fragile. Intelligence, bâton."},
	"ranger": {"name": "Rôdeur", "main": "agility", "weapon": "bow", "skill": "gathering",
		"desc": "Attaque avant d'être touché. Agilité, arc. Cueillette naturelle."},
}
const CLASS_MAIN_BONUS := 5          # points de départ en plus dans la stat principale
const NATURAL_SKILL_XP_MULT := 1.2   # métier naturel : +20 % d'XP

# --- Armes -------------------------------------------------------------------
## dmg : dégâts de base, speed : coups/s, stat : stat qui fait monter les dégâts.
const WEAPONS := {
	"sword": {"name": "Épée", "dmg": 6.0, "speed": 1.0, "stat": "strength"},
	"daggers": {"name": "Dagues", "dmg": 3.0, "speed": 1.8, "stat": "agility"},
	"staff": {"name": "Bâton", "dmg": 9.0, "speed": 0.8, "stat": "intelligence"},
	"bow": {"name": "Arc", "dmg": 4.0, "speed": 1.3, "stat": "agility"},
	"knife": {"name": "Couteau", "dmg": 3.5, "speed": 1.5, "stat": "agility"},
	"hammer": {"name": "Marteau", "dmg": 11.0, "speed": 0.7, "stat": "strength"},
}
const WEAPON_PRICE := 60.0
const WEAPON_RANK_MULT := 1.4        # chaque rang d'amélioration : dégâts × 1,4

static func weapon_upgrade_cost(rank: int) -> float:
	return floorf(100.0 * pow(3.2, rank - 1))

# --- Héros -------------------------------------------------------------------
static func hero_xp_to_next(level: int) -> float:
	return floorf(25.0 * pow(1.13, level - 1))

const STAT_DAMAGE_PER_POINT := 0.08  # +8 % de dégâts par point de la stat de l'arme
const BASE_CRIT := 0.05
const CRIT_PER_LUCK := 0.005
const CRIT_DAMAGE := 2.0

static func hero_max_hp(vitality: int, level: int) -> float:
	return 50.0 + vitality * 12.0 + level * 4.0

static func damage_reduction(vitality: int) -> float:
	return 100.0 / (100.0 + vitality * 4.0)

# --- Tour --------------------------------------------------------------------
const ENEMIES_PER_FLOOR := 5
const BOSS_EVERY := 10
const BOSS_HP_MULT := 10.0
const ENEMY_ATTACK_INTERVAL := 1.5
const DEATHS_BEFORE_RETREAT := 3
const HEAL_BETWEEN_ENEMIES := 0.15

static func is_boss(floor_n: int) -> bool:
	return floor_n % BOSS_EVERY == 0

static func enemy_hp(floor_n: int) -> float:
	return 20.0 * pow(1.12, floor_n) * (BOSS_HP_MULT if is_boss(floor_n) else 1.0)

static func enemy_attack(floor_n: int) -> float:
	return 3.0 * pow(1.115, floor_n) * (3.0 if is_boss(floor_n) else 1.0)

static func enemy_gold(floor_n: int) -> float:
	return 3.0 * pow(1.10, floor_n) * (10.0 if is_boss(floor_n) else 1.0)

static func enemy_xp(floor_n: int) -> float:
	return 4.0 * pow(1.10, floor_n) * (10.0 if is_boss(floor_n) else 1.0)

const BIOMES := ["Forêt", "Cavernes", "Ruines", "Cieux", "Abîme"]
static func biome(floor_n: int) -> String:
	return BIOMES[min(int((floor_n - 1) / 25), BIOMES.size() - 1)]

# --- Métiers -----------------------------------------------------------------
const SKILLS := {
	"training": {"name": "Entraînement", "interval": 3.0},
	"gathering": {"name": "Cueillette", "interval": 3.0},
	"cooking": {"name": "Cuisine", "interval": 4.0},
	"mining": {"name": "Minage", "interval": 3.0, "soon": true},
	"forge": {"name": "Forge", "interval": 5.0, "soon": true},
	"alchemy": {"name": "Alchimie", "interval": 4.0, "soon": true},
}
const SKILL_MAX_LEVEL := 99

static func skill_xp_to_next(level: int) -> float:
	return floorf(40.0 * pow(1.075, level))

## XP de métier gagnée par action.
static func skill_action_xp(level: int) -> float:
	return 10.0 + level * 1.5

## Entraînement : coût en or d'une séance, et progrès de stat gagné.
static func training_cost(level: int) -> float:
	return floorf(2.0 * pow(1.06, level))

const TRAINING_PROGRESS_PER_POINT := 10.0
static func training_progress(level: int) -> float:
	return 2.0 + level * 0.25

## Cueillette : ce qu'on peut trouver, par niveau requis.
const GATHER_TABLE := [
	{"item": "berry", "level": 1, "weight": 6},
	{"item": "herb", "level": 5, "weight": 4},
	{"item": "mushroom", "level": 12, "weight": 2},
	{"item": "truffle", "level": 30, "weight": 1},
]
const ITEM_NAMES := {
	"berry": "Baies", "herb": "Herbes", "mushroom": "Champignons", "truffle": "Truffes",
}

## Cuisine : recettes. buff = multiplicateurs appliqués tant que le plat est actif.
const RECIPES := {
	"berry_stew": {"name": "Ragoût de baies", "level": 1, "needs": {"berry": 2},
		"minutes": 30.0, "buff": {"damage": 1.15}},
	"herb_soup": {"name": "Soupe d'herbes", "level": 5, "needs": {"herb": 2},
		"minutes": 30.0, "buff": {"hp": 1.3, "regen": 0.02}},
	"forest_pie": {"name": "Tourte forestière", "level": 15, "needs": {"berry": 1, "herb": 1, "mushroom": 1},
		"minutes": 60.0, "buff": {"damage": 1.3, "hp": 1.3, "speed": 1.1}},
	"truffle_feast": {"name": "Festin à la truffe", "level": 35, "needs": {"truffle": 1, "mushroom": 2},
		"minutes": 120.0, "buff": {"damage": 1.8, "hp": 1.5, "gold": 1.5}},
}

# --- Synergies (métier + condition) ------------------------------------------
## Les effets se multiplient entre eux. weapon = "" : toujours active.
const SYNERGIES := [
	{"skill": "cooking", "level": 10, "weapon": "knife", "crit": 0.15, "damage": 1.25,
		"desc": "Cuisine 10 + couteau : +15 % de critique, dégâts × 1,25"},
	{"skill": "cooking", "level": 25, "weapon": "", "dish_duration": 2.0,
		"desc": "Cuisine 25 : les plats durent deux fois plus longtemps"},
	{"skill": "cooking", "level": 50, "weapon": "knife", "damage": 3.0,
		"desc": "Cuisine 50 + couteau : dégâts × 3"},
	{"skill": "gathering", "level": 10, "weapon": "bow", "speed": 1.15,
		"desc": "Cueillette 10 + arc : vitesse d'attaque × 1,15"},
	{"skill": "gathering", "level": 25, "weapon": "", "gold": 1.5,
		"desc": "Cueillette 25 : or × 1,5"},
	{"skill": "training", "level": 10, "weapon": "", "hp": 1.25,
		"desc": "Entraînement 10 : PV × 1,25"},
	{"skill": "training", "level": 25, "weapon": "", "stat_points": 1,
		"desc": "Entraînement 25 : +1 point de stat par niveau de héros"},
	{"skill": "training", "level": 50, "weapon": "hammer", "damage": 2.0,
		"desc": "Entraînement 50 + marteau : dégâts × 2"},
]

# --- Réincarnation -----------------------------------------------------------
const REINCARNATION_MIN_FLOOR := 30

static func essence_for(max_floor: int) -> int:
	return int(floor(pow(max_floor / 10.0, 2.0)))

## Nœuds de l'arbre. cost(n) = coût du niveau n+1.
const TREE := {
	"body": {"name": "Corps", "desc": "Dégâts et PV × 1,25 par niveau", "base": 3, "max": 50},
	"mind": {"name": "Esprit", "desc": "XP de métier × 1,25 par niveau", "base": 3, "max": 50},
	"fate": {"name": "Destin", "desc": "Hors ligne +6 h par niveau, or × 1,2", "base": 5, "max": 6},
	"momentum": {"name": "Élan", "desc": "Recommencer à 20 % de son record d'étage", "base": 10, "max": 1},
}

static func tree_cost(node: String, current_level: int) -> int:
	return TREE[node].base * (current_level + 1)

# --- Hors ligne --------------------------------------------------------------
const OFFLINE_BASE_HOURS := 12.0
const OFFLINE_STEP := 1.0   # pas de simulation en secondes
