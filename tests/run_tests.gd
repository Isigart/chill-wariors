extends SceneTree
## Tests headless de la logique :
##   godot --headless --path . -s res://tests/run_tests.gd

var _failed := 0


func _initialize() -> void:
	# Laisse les autoloads se charger avant de tester.
	process_frame.connect(_run, CONNECT_ONE_SHOT)


func _run() -> void:
	var gs = root.get_node("GameState")
	var sm = root.get_node("SaveManager")
	var bal = root.get_node("Balance")

	gs.reset()
	gs.tick(60.0)
	_check(gs.gold > 0.0, "une minute de combat rapporte de l'or")
	_check(gs.total_kills > 0, "le héros tue des monstres")

	gs.reset()
	gs.add_xp(bal.xp_to_next(1))
	_check(gs.level == 2, "assez d'XP fait monter de niveau")
	_check(gs.stat_points == bal.STAT_POINTS_PER_LEVEL, "monter de niveau donne des points")
	var str_before: int = gs.stats.strength
	_check(gs.spend_stat_point("strength") and gs.stats.strength == str_before + 1, "un point augmente la stat")

	gs.reset()
	_check(not gs.train("agility"), "pas d'entraînement sans or")
	gs.gold = 1000.0
	var cost: float = gs.train_cost("agility")
	_check(gs.train("agility") and gs.gold == 1000.0 - cost, "l'entraînement coûte de l'or")
	_check(gs.train_cost("agility") > cost, "le coût augmente")

	gs.reset()
	gs.tick(600.0)
	_check(gs.stage > 1, "dix minutes font passer des étages")

	var snapshot: Dictionary = gs.to_dict()
	sm.save_game()
	gs.reset()
	sm.load_game()
	var loaded: Dictionary = gs.to_dict()
	# Les flottants passent par du texte JSON : on tolère un écart infime.
	_check(is_equal_approx(loaded.gold, snapshot.gold) and is_equal_approx(loaded.xp, snapshot.xp), "l'or et l'XP survivent à la sauvegarde")
	loaded.erase("gold"); loaded.erase("xp"); snapshot.erase("gold"); snapshot.erase("xp")
	_check(loaded == snapshot, "sauvegarde puis chargement restituent le reste de l'état")

	gs.reset()
	var off: Dictionary = gs.apply_offline(3600.0)
	_check(off.gold > 0.0 and gs.gold == off.gold, "les gains hors-ligne s'appliquent")
	var capped: Dictionary = gs.apply_offline(1e9)
	_check(capped.seconds == bal.OFFLINE_CAP_SECONDS, "le hors-ligne est plafonné")

	sm.wipe()
	print("\n%s" % ("TOUS LES TESTS PASSENT" if _failed == 0 else "%d ÉCHEC(S)" % _failed))
	quit(1 if _failed > 0 else 0)


func _check(ok: bool, what: String) -> void:
	print(("  ok   " if ok else "  FAIL ") + what)
	if not ok:
		_failed += 1
