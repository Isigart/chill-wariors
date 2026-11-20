extends Node
## État du jeu et boucle principale : le héros frappe le monstre de l'étage,
## chaque victoire rapporte or et XP, 10 victoires ouvrent l'étage suivant.

signal changed
signal leveled_up(new_level: int)
signal stage_cleared(new_stage: int)

var gold: float = 0.0
var level: int = 1
var xp: float = 0.0
var stat_points: int = 0
var stats: Dictionary = {}
var trained: Dictionary = {}   # nombre d'entraînements achetés par stat
var stage: int = 1
var max_stage: int = 1
var kills_in_stage: int = 0
var monster_hp_left: float = 0.0
var total_kills: int = 0

var _attack_timer: float = 0.0


func _ready() -> void:
	reset()


func reset() -> void:
	gold = 0.0
	level = 1
	xp = 0.0
	stat_points = 0
	stats = Balance.BASE_STATS.duplicate()
	trained = {}
	for s in stats:
		trained[s] = 0
	stage = 1
	max_stage = 1
	kills_in_stage = 0
	total_kills = 0
	_spawn_monster()
	changed.emit()


func _process(delta: float) -> void:
	tick(delta)


## Avance la simulation de `delta` secondes. Séparé de _process pour les tests.
func tick(delta: float) -> void:
	_attack_timer += delta
	var interval := 1.0 / Balance.hero_attack_speed(stats)
	var hit := false
	while _attack_timer >= interval:
		_attack_timer -= interval
		_hit(Balance.hero_damage(stats, level))
		hit = true
	if hit:
		changed.emit()


func _hit(damage: float) -> void:
	monster_hp_left -= damage
	if monster_hp_left <= 0.0:
		_on_kill()


func _on_kill() -> void:
	total_kills += 1
	gold += Balance.monster_gold(stage) * Balance.gold_multiplier(stats)
	add_xp(Balance.monster_xp(stage))
	kills_in_stage += 1
	if kills_in_stage >= Balance.KILLS_PER_STAGE:
		kills_in_stage = 0
		stage += 1
		max_stage = max(max_stage, stage)
		stage_cleared.emit(stage)
	_spawn_monster()


func _spawn_monster() -> void:
	monster_hp_left = Balance.monster_hp(stage)


func add_xp(amount: float) -> void:
	xp += amount
	while xp >= Balance.xp_to_next(level):
		xp -= Balance.xp_to_next(level)
		level += 1
		stat_points += Balance.STAT_POINTS_PER_LEVEL
		leveled_up.emit(level)


# --- Actions du joueur -------------------------------------------------------

func spend_stat_point(stat: String) -> bool:
	if stat_points <= 0 or not stats.has(stat):
		return false
	stat_points -= 1
	stats[stat] += 1
	changed.emit()
	return true


func train_cost(stat: String) -> float:
	return Balance.train_cost(trained.get(stat, 0))


func train(stat: String) -> bool:
	if not stats.has(stat):
		return false
	var cost := train_cost(stat)
	if gold < cost:
		return false
	gold -= cost
	trained[stat] += 1
	stats[stat] += 1
	changed.emit()
	return true


# --- Chiffres dérivés --------------------------------------------------------

func dps() -> float:
	return Balance.hero_damage(stats, level) * Balance.hero_attack_speed(stats)


func kills_per_second() -> float:
	return dps() / Balance.monster_hp(stage)


## Applique les gains d'une absence de `seconds` secondes, à l'étage actuel.
## Renvoie un résumé pour l'afficher au joueur.
func apply_offline(seconds: float) -> Dictionary:
	var t: float = clamp(seconds, 0.0, Balance.OFFLINE_CAP_SECONDS)
	var kills: float = floorf(kills_per_second() * t * Balance.OFFLINE_EFFICIENCY)
	var g: float = kills * Balance.monster_gold(stage) * Balance.gold_multiplier(stats)
	var x: float = kills * Balance.monster_xp(stage)
	var level_before := level
	gold += g
	add_xp(x)
	total_kills += int(kills)
	changed.emit()
	return {"seconds": t, "kills": kills, "gold": g, "xp": x, "levels": level - level_before}


# --- Sauvegarde --------------------------------------------------------------

func to_dict() -> Dictionary:
	return {
		"gold": gold, "level": level, "xp": xp, "stat_points": stat_points,
		"stats": stats, "trained": trained, "stage": stage, "max_stage": max_stage,
		"kills_in_stage": kills_in_stage, "total_kills": total_kills,
	}


func from_dict(d: Dictionary) -> void:
	reset()
	gold = float(d.get("gold", 0.0))
	level = int(d.get("level", 1))
	xp = float(d.get("xp", 0.0))
	stat_points = int(d.get("stat_points", 0))
	for s in stats:
		stats[s] = int(d.get("stats", {}).get(s, stats[s]))
		trained[s] = int(d.get("trained", {}).get(s, 0))
	stage = int(d.get("stage", 1))
	max_stage = int(d.get("max_stage", stage))
	kills_in_stage = int(d.get("kills_in_stage", 0))
	total_kills = int(d.get("total_kills", 0))
	_spawn_monster()
	changed.emit()
