extends Node
## État du jeu et simulation. Une seule activité à la fois : la tour ou un métier.
## Toute la simulation passe par tick(), ce qui sert aussi pour le hors-ligne et les tests.

signal changed
signal message(text: String)

const STEP := 0.5   # pas maximal de simulation, en secondes

# --- Vie en cours (perdue à la réincarnation) --------------------------------
var hero_class: String = ""
var level: int = 1
var xp: float = 0.0
var stat_points: int = 0
var alloc: Dictionary = {}          # points de niveau répartis
var trained: Dictionary = {}        # points gagnés par Entraînement
var training_target: String = "strength"
var auto_points: bool = true        # répartit seul les points (2 stat principale, 1 Vitalité)
var training_progress: float = 0.0
var gold: float = 0.0
var weapons: Dictionary = {}        # type -> rang
var weapon: String = ""
var floor_n: int = 1
var max_floor: int = 1
var enemy_index: int = 0
var enemy_hp: float = 0.0
var hero_hp: float = 0.0
var deaths_on_floor: int = 0
var retreating: bool = false
var activity: String = "tower"
var recipe: String = "berry_stew"
var inventory: Dictionary = {}      # ingrédients et plats
var dish: String = ""
var dish_left: float = 0.0

# --- Permanent ---------------------------------------------------------------
var skills: Dictionary = {}         # id -> {"level": int, "xp": float}
var essence: int = 0
var tree: Dictionary = {}
var record_floor: int = 1
var reincarnations: int = 0

var _attack_t := 0.0
var _enemy_t := 0.0
var _skill_t := 0.0
var _rng := RandomNumberGenerator.new()
var quiet := false                  # coupe les messages pendant le hors-ligne


func _ready() -> void:
	new_game()


func new_game() -> void:
	skills = {}
	for id in Balance.SKILLS:
		skills[id] = {"level": 1, "xp": 0.0}
	tree = {}
	for id in Balance.TREE:
		tree[id] = 0
	essence = 0
	record_floor = 1
	reincarnations = 0
	_reset_life()


func _reset_life() -> void:
	hero_class = ""
	level = 1
	xp = 0.0
	stat_points = 0
	alloc = {}
	trained = {}
	for s in Balance.STATS:
		alloc[s] = 0
		trained[s] = 0
	training_progress = 0.0
	gold = 0.0
	weapons = {}
	weapon = ""
	floor_n = 1
	if tree.get("momentum", 0) > 0:
		floor_n = max(1, int(record_floor * 0.2))
	max_floor = floor_n
	enemy_index = 0
	deaths_on_floor = 0
	retreating = false
	activity = "tower"
	inventory = {}
	dish = ""
	dish_left = 0.0
	_spawn_enemy()
	hero_hp = max_hp()
	changed.emit()


func choose_class(id: String) -> void:
	if not Balance.CLASSES.has(id):
		return
	hero_class = id
	var w: String = Balance.CLASSES[id].weapon
	weapons[w] = 1
	weapon = w
	hero_hp = max_hp()
	_say("[Classe choisie : %s]" % Balance.CLASSES[id].name)
	changed.emit()


func _process(delta: float) -> void:
	if hero_class != "":
		tick(delta)


func tick(delta: float) -> void:
	if hero_class == "":
		return
	var left := delta
	while left > 0.0:
		var dt: float = min(left, STEP)
		left -= dt
		_step(dt)
	changed.emit()


func _step(dt: float) -> void:
	if dish != "":
		dish_left -= dt
		if dish_left <= 0.0:
			dish = ""
	if dish == "":
		_auto_eat()
	if activity == "tower":
		_combat(dt)
	else:
		hero_hp = max_hp()
		_skill(dt)


# --- Stats dérivées ----------------------------------------------------------

func stat(s: String) -> int:
	var v: int = Balance.BASE_STAT + alloc.get(s, 0) + trained.get(s, 0)
	if hero_class != "" and Balance.CLASSES[hero_class].main == s:
		v += Balance.CLASS_MAIN_BONUS
	return v


func skill_level(id: String) -> int:
	return skills[id].level


func active_synergies() -> Array:
	var out := []
	for syn in Balance.SYNERGIES:
		if skill_level(syn.skill) >= syn.level and (syn.weapon == "" or syn.weapon == weapon):
			out.append(syn)
	return out


## Produit de tous les multiplicateurs d'une clé (synergies, plat, arbre).
func mult(key: String) -> float:
	var m := 1.0
	for syn in active_synergies():
		m *= syn.get(key, 1.0)
	if dish != "":
		m *= Balance.RECIPES[dish].buff.get(key, 1.0)
	if key == "damage" or key == "hp":
		m *= pow(1.25, tree.get("body", 0))
	if key == "gold":
		m *= pow(1.2, tree.get("fate", 0))
	return m


func hit_damage() -> float:
	if weapon == "":
		return 1.0
	var w: Dictionary = Balance.WEAPONS[weapon]
	var base: float = w.dmg * pow(Balance.WEAPON_RANK_MULT, weapons[weapon] - 1)
	return base * (1.0 + stat(w.stat) * Balance.STAT_DAMAGE_PER_POINT) * mult("damage")


func attack_speed() -> float:
	var s: float = Balance.WEAPONS[weapon].speed if weapon != "" else 1.0
	return s * (1.0 + stat("agility") * 0.01) * mult("speed")


func crit_chance() -> float:
	var c: float = Balance.BASE_CRIT + stat("luck") * Balance.CRIT_PER_LUCK
	for syn in active_synergies():
		c += syn.get("crit", 0.0)
	return min(c, 1.0)


## Dégâts moyens d'un coup, critiques compris (combat déterministe).
func avg_hit() -> float:
	return hit_damage() * (1.0 + crit_chance() * (Balance.CRIT_DAMAGE - 1.0))


func dps() -> float:
	return avg_hit() * attack_speed()


func max_hp() -> float:
	return Balance.hero_max_hp(stat("vitality"), level) * mult("hp")


# --- Tour --------------------------------------------------------------------

func _spawn_enemy() -> void:
	enemy_hp = Balance.enemy_hp(floor_n)


func _combat(dt: float) -> void:
	var regen := 0.0
	if dish != "":
		regen = Balance.RECIPES[dish].buff.get("regen", 0.0)
	hero_hp = min(max_hp(), hero_hp + max_hp() * regen * dt)
	_attack_t += dt
	var interval := 1.0 / attack_speed()
	while _attack_t >= interval:
		_attack_t -= interval
		enemy_hp -= avg_hit()
		if enemy_hp <= 0.0:
			_on_enemy_killed()
			_enemy_t = 0.0
	_enemy_t += dt
	while _enemy_t >= Balance.ENEMY_ATTACK_INTERVAL:
		_enemy_t -= Balance.ENEMY_ATTACK_INTERVAL
		hero_hp -= Balance.enemy_attack(floor_n) * Balance.damage_reduction(stat("vitality"))
		if hero_hp <= 0.0:
			_on_death()
			return


func _on_enemy_killed() -> void:
	gold += Balance.enemy_gold(floor_n) * mult("gold")
	add_xp(Balance.enemy_xp(floor_n))
	enemy_index += 1
	hero_hp = min(max_hp(), hero_hp + max_hp() * Balance.HEAL_BETWEEN_ENEMIES)
	if enemy_index >= Balance.ENEMIES_PER_FLOOR:
		enemy_index = 0
		if not retreating:
			if Balance.is_boss(floor_n):
				_say("[Gardien de l'étage %d vaincu]" % floor_n)
			floor_n += 1
			deaths_on_floor = 0
			if floor_n > max_floor:
				max_floor = floor_n
				if floor_n % 5 == 0 or Balance.is_boss(floor_n):
					_say("[Étage %d atteint]" % floor_n)
			if floor_n > record_floor:
				record_floor = floor_n
			hero_hp = max_hp()
	_spawn_enemy()


func _on_death() -> void:
	deaths_on_floor += 1
	enemy_index = 0
	hero_hp = max_hp()
	_spawn_enemy()
	if deaths_on_floor >= Balance.DEATHS_BEFORE_RETREAT and floor_n > 1 and not retreating:
		retreating = true
		floor_n -= 1
		deaths_on_floor = 0
		_spawn_enemy()
		_say("Mort trois fois : le héros redescend à l'étage %d pour s'entraîner." % floor_n)


## Après un changement (niveau, arme, plat...), le héros retente l'étage bloquant.
func retry_climb() -> void:
	if retreating:
		retreating = false
		floor_n += 1
		enemy_index = 0
		deaths_on_floor = 0
		_spawn_enemy()
		hero_hp = max_hp()


func add_xp(amount: float) -> void:
	xp += amount
	while xp >= Balance.hero_xp_to_next(level):
		xp -= Balance.hero_xp_to_next(level)
		level += 1
		var pts := Balance.STAT_POINTS_PER_LEVEL
		for syn in active_synergies():
			pts += syn.get("stat_points", 0)
		stat_points += pts
		_say("[Niveau %d] +%d points de stat" % [level, pts])
		if auto_points:
			_auto_spend()
		retry_climb()


# --- Métiers -----------------------------------------------------------------

func set_activity(id: String) -> void:
	if id != "tower" and (not Balance.SKILLS.has(id) or Balance.SKILLS[id].get("soon", false)):
		return
	activity = id
	_skill_t = 0.0
	_attack_t = 0.0
	_enemy_t = 0.0
	if id == "tower":
		retry_climb()
		_spawn_enemy()
		enemy_index = 0
	changed.emit()


func _skill(dt: float) -> void:
	_skill_t += dt
	var interval: float = Balance.SKILLS[activity].interval
	while _skill_t >= interval:
		_skill_t -= interval
		if not _do_action(activity):
			_say("%s impossible : retour à la tour." % Balance.SKILLS[activity].name)
			set_activity("tower")
			return


func _do_action(id: String) -> bool:
	var lvl := skill_level(id)
	match id:
		"training":
			var cost := Balance.training_cost(lvl)
			if gold < cost:
				return false
			gold -= cost
			training_progress += Balance.training_progress(lvl)
			while training_progress >= Balance.TRAINING_PROGRESS_PER_POINT:
				training_progress -= Balance.TRAINING_PROGRESS_PER_POINT
				trained[training_target] += 1
		"gathering":
			var item := _gather_roll(lvl)
			inventory[item] = inventory.get(item, 0) + 1 + int(lvl / 20)
		"cooking":
			var r: Dictionary = Balance.RECIPES[recipe]
			if lvl < r.level:
				return false
			for ing in r.needs:
				if inventory.get(ing, 0) < r.needs[ing]:
					return false
			for ing in r.needs:
				inventory[ing] -= r.needs[ing]
			inventory[recipe] = inventory.get(recipe, 0) + 1
		_:
			return false
	_add_skill_xp(id, Balance.skill_action_xp(lvl))
	return true


func _gather_roll(lvl: int) -> String:
	var pool := []
	var total := 0
	for e in Balance.GATHER_TABLE:
		if lvl >= e.level:
			pool.append(e)
			total += e.weight
	var r := _rng.randi_range(1, total)
	for e in pool:
		r -= e.weight
		if r <= 0:
			return e.item
	return pool[0].item


func _add_skill_xp(id: String, amount: float) -> void:
	var m := pow(1.25, tree.get("mind", 0))
	if hero_class != "" and Balance.CLASSES[hero_class].skill == id:
		m *= Balance.NATURAL_SKILL_XP_MULT
	var sk: Dictionary = skills[id]
	sk["xp"] += amount * m
	while sk["level"] < Balance.SKILL_MAX_LEVEL and sk["xp"] >= Balance.skill_xp_to_next(sk["level"]):
		sk["xp"] -= Balance.skill_xp_to_next(sk["level"])
		sk["level"] += 1
		_say("[%s niveau %d]" % [Balance.SKILLS[id].name, sk["level"]])
		for syn in Balance.SYNERGIES:
			if syn.skill == id and syn.level == sk["level"]:
				_say("Synergie débloquée : %s" % syn.desc)


# --- Plats, armes, stats -----------------------------------------------------

func eat(id: String) -> bool:
	if inventory.get(id, 0) <= 0 or not Balance.RECIPES.has(id):
		return false
	inventory[id] -= 1
	dish = id
	dish_left = Balance.RECIPES[id].minutes * 60.0 * mult("dish_duration")
	retry_climb()
	changed.emit()
	return true


func _auto_eat() -> void:
	var best := ""
	for id in Balance.RECIPES:
		if inventory.get(id, 0) > 0 and (best == "" or Balance.RECIPES[id].level > Balance.RECIPES[best].level):
			best = id
	if best != "":
		eat(best)


func spend_stat_point(s: String) -> bool:
	if stat_points <= 0 or not alloc.has(s):
		return false
	stat_points -= 1
	alloc[s] += 1
	retry_climb()
	changed.emit()
	return true


func _auto_spend() -> void:
	if hero_class == "":
		return
	var main: String = Balance.WEAPONS[weapon].stat if weapon != "" else Balance.CLASSES[hero_class].main
	while stat_points > 0:
		var spent := 0
		for k in alloc:
			spent += alloc[k]
		var s := "vitality" if spent % 3 == 2 else main
		stat_points -= 1
		alloc[s] += 1


func buy_weapon(id: String) -> bool:
	if weapons.has(id) or gold < Balance.WEAPON_PRICE:
		return false
	gold -= Balance.WEAPON_PRICE
	weapons[id] = 1
	equip(id)
	return true


func equip(id: String) -> bool:
	if not weapons.has(id):
		return false
	weapon = id
	retry_climb()
	changed.emit()
	return true


func upgrade_cost() -> float:
	return Balance.weapon_upgrade_cost(weapons.get(weapon, 1))


func upgrade_weapon() -> bool:
	if weapon == "" or gold < upgrade_cost():
		return false
	gold -= upgrade_cost()
	weapons[weapon] += 1
	retry_climb()
	changed.emit()
	return true


# --- Réincarnation -----------------------------------------------------------

func can_reincarnate() -> bool:
	return max_floor >= Balance.REINCARNATION_MIN_FLOOR


func reincarnate() -> bool:
	if not can_reincarnate():
		return false
	var gain := Balance.essence_for(max_floor)
	essence += gain
	reincarnations += 1
	_reset_life()
	_say("[Réincarnation %d] +%d Essence" % [reincarnations, gain])
	return true


func buy_tree(id: String) -> bool:
	if not tree.has(id) or tree[id] >= Balance.TREE[id].max:
		return false
	var cost := Balance.tree_cost(id, tree[id])
	if essence < cost:
		return false
	essence -= cost
	tree[id] += 1
	changed.emit()
	return true


# --- Hors ligne --------------------------------------------------------------

func offline_cap() -> float:
	return (Balance.OFFLINE_BASE_HOURS + 6.0 * tree.get("fate", 0)) * 3600.0


## Joue `seconds` secondes d'un coup (plafonnées) et renvoie le rapport.
func simulate_offline(seconds: float) -> Dictionary:
	var t: float = clamp(seconds, 0.0, offline_cap())
	var before := {"floor": max_floor, "level": level, "gold": gold, "skills": {}, "inv": inventory.duplicate()}
	for id in skills:
		before.skills[id] = skill_level(id)
	quiet = true
	tick(t)
	quiet = false
	var report := {"seconds": t, "floors": max_floor - before.floor, "levels": level - before.level,
		"gold": gold - before.gold, "skills": {}, "items": {}}
	for id in skills:
		if skill_level(id) > before.skills[id]:
			report.skills[id] = skill_level(id) - before.skills[id]
	for id in inventory:
		var d: int = inventory[id] - before.inv.get(id, 0)
		if d != 0:
			report.items[id] = d
	return report


func _say(text: String) -> void:
	if not quiet:
		message.emit(text)


# --- Sauvegarde --------------------------------------------------------------

const SAVED := ["hero_class", "level", "xp", "stat_points", "alloc", "trained", "training_target", "auto_points",
	"training_progress", "gold", "weapons", "weapon", "floor_n", "max_floor", "enemy_index",
	"enemy_hp", "hero_hp", "deaths_on_floor", "retreating", "activity", "recipe", "inventory",
	"dish", "dish_left", "skills", "essence", "tree", "record_floor", "reincarnations"]


func to_dict() -> Dictionary:
	var d := {}
	for k in SAVED:
		var v = get(k)
		d[k] = v.duplicate(true) if v is Dictionary else v
	return d


func from_dict(d: Dictionary) -> void:
	new_game()
	for k in SAVED:
		if not d.has(k):
			continue
		var cur = get(k)
		var v = d[k]
		if cur is int:
			set(k, int(v))
		elif cur is float:
			set(k, float(v))
		elif cur is Dictionary and v is Dictionary:
			set(k, _merge_ints(cur, v))
		else:
			set(k, v)
	changed.emit()


## JSON transforme les entiers en flottants : on les remet en entiers
## quand la valeur par défaut est un entier.
func _merge_ints(base: Dictionary, loaded: Dictionary) -> Dictionary:
	var out := base.duplicate(true)
	for k in loaded:
		var v = loaded[k]
		if v is Dictionary:
			out[k] = _merge_ints(base.get(k, {}), v)
		elif v is float and (base.get(k) is int or (not base.has(k) and v == floorf(v))):
			out[k] = int(v)
		else:
			out[k] = v
	return out
