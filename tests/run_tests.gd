extends SceneTree
## Tests headless de la logique :
##   godot --headless --path . -s res://tests/run_tests.gd

var _failed := 0
var gs
var sm


func _initialize() -> void:
	# Laisse les autoloads se charger avant de tester.
	process_frame.connect(_run, CONNECT_ONE_SHOT)


func _run() -> void:
	gs = root.get_node("GameState")
	sm = root.get_node("SaveManager")
	var bal = root.get_node("Balance")

	print("Classe et tour")
	gs.new_game()
	_check(gs.hero_class == "", "on commence sans classe")
	gs.tick(60.0)
	_check(gs.gold == 0.0, "rien ne tourne avant le choix de classe")
	gs.choose_class("rogue")
	_check(gs.weapon == "daggers" and gs.stat("agility") == 10, "le Voleur part avec dagues et +5 Agilité")
	gs.tick(120.0)
	_check(gs.gold > 0.0 and gs.floor_n > 1, "deux minutes de tour rapportent or et étages")
	_check(gs.level > 1 and gs.alloc.agility > 0, "les ennemis font monter de niveau, points répartis tout seuls")
	_check(gs.alloc.agility >= gs.alloc.vitality * 2 - 2, "répartition auto : deux points d'arme pour un de Vitalité")

	print("Mort et repli")
	gs.new_game()
	gs.choose_class("mage")
	gs.floor_n = 60
	gs.max_floor = 60
	gs._spawn_enemy()
	gs.tick(120.0)
	_check(gs.retreating and gs.floor_n == 59, "trois morts au même étage : on redescend d'un étage")
	_check(gs.max_floor == 60, "mourir ne fait perdre aucun étage atteint")
	gs.retry_climb()
	_check(not gs.retreating and gs.floor_n == 60, "retenter remonte à l'étage bloquant")

	print("Métiers")
	gs.new_game()
	gs.choose_class("rogue")
	gs.set_activity("gathering")
	gs.tick(300.0)
	_check(gs.inventory.get("berry", 0) > 0, "la cueillette remplit le sac")
	_check(gs.skill_level("gathering") > 1, "la cueillette monte de niveau")
	gs.recipe = "berry_stew"
	gs.set_activity("cooking")
	gs.tick(20.0)
	_check(gs.dish == "berry_stew", "un plat cuisiné est mangé tout seul")
	var dmg_buffed: float = gs.hit_damage()
	gs.dish = ""
	_check(dmg_buffed > gs.hit_damage(), "le plat augmente les dégâts")
	gs.inventory.clear()
	gs.set_activity("cooking")
	gs.tick(10.0)
	_check(gs.activity == "tower", "sans ingrédients, le héros retourne à la tour")
	gs.gold = 1000.0
	gs.training_target = "luck"
	gs.set_activity("training")
	gs.tick(120.0)
	_check(gs.trained.luck > 0 and gs.gold < 1000.0, "l'entraînement transforme l'or en stats")

	print("Synergie cuisine 10 + couteau")
	gs.new_game()
	gs.choose_class("rogue")
	gs.gold = 1000.0
	gs.buy_weapon("knife")
	var crit_before: float = gs.crit_chance()
	gs.skills.cooking.level = 10
	_check(gs.crit_chance() >= crit_before + 0.15, "cuisine 10 avec couteau : +15 % de critique")
	gs.equip("daggers")
	_check(gs.crit_chance() == crit_before, "la synergie ne marche qu'avec le couteau")

	print("Réincarnation")
	gs.new_game()
	gs.choose_class("warrior")
	_check(not gs.reincarnate(), "pas de réincarnation avant l'étage 30")
	gs.max_floor = 50
	gs.record_floor = 50
	gs.skills.cooking.level = 20
	gs.gold = 5000.0
	_check(gs.reincarnate(), "réincarnation possible à l'étage 50")
	_check(gs.essence == 25, "étage 50 donne 25 Essence")
	_check(gs.skill_level("cooking") == 20 and gs.gold == 0.0 and gs.hero_class == "", "on garde les métiers, on perd l'or, on rechoisit sa classe")
	_check(gs.buy_tree("body") and gs.tree.body == 1, "l'Essence achète l'arbre")
	gs.choose_class("warrior")
	var dmg_body: float = gs.hit_damage()
	gs.tree.body = 0
	_check(dmg_body > gs.hit_damage() * 1.2, "Corps augmente les dégâts")

	print("Hors ligne")
	gs.new_game()
	gs.choose_class("ranger")
	var rep: Dictionary = gs.simulate_offline(3600.0 * 100)
	_check(rep.seconds == bal.OFFLINE_BASE_HOURS * 3600.0, "le hors ligne est plafonné à 12 h")
	_check(rep.floors > 10 and rep.gold > 0.0, "12 h hors ligne font monter la tour")
	print("    (12 h hors ligne depuis zéro : étage %d, niveau %d)" % [gs.max_floor, gs.level])

	print("Sauvegarde")
	gs.set_activity("gathering")
	gs.tick(200.0)
	var snapshot: Dictionary = gs.to_dict()
	sm.save_game()
	gs.new_game()
	sm.load_game()
	var loaded: Dictionary = gs.to_dict()
	_check(_same(loaded, snapshot), "sauvegarde puis chargement restituent l'état")
	_check(typeof(loaded.skills.gathering.level) == TYPE_INT, "les niveaux restent des entiers")

	sm.wipe()
	print("\n%s" % ("TOUS LES TESTS PASSENT" if _failed == 0 else "%d ÉCHEC(S)" % _failed))
	quit(1 if _failed > 0 else 0)


## Égalité profonde qui tolère l'arrondi des flottants passés par JSON.
func _same(a, b) -> bool:
	if a is Dictionary and b is Dictionary:
		if a.size() != b.size():
			return false
		for k in a:
			if not b.has(k) or not _same(a[k], b[k]):
				print("      diff sur ", k, " : ", a[k], " / ", b.get(k))
				return false
		return true
	if (a is float or a is int) and (b is float or b is int):
		return is_equal_approx(float(a), float(b))
	return a == b


func _check(ok: bool, what: String) -> void:
	print(("  ok   " if ok else "  FAIL ") + what)
	if not ok:
		_failed += 1
