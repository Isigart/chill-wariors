extends Control
## Écran unique du prototype, construit en code pour rester lisible sans l'éditeur.

const STAT_LABELS := {
	"strength": "Force",
	"vitality": "Vitalité",
	"agility": "Agilité",
	"luck": "Chance",
}

var _gold: Label
var _hero: Label
var _xp_bar: ProgressBar
var _stage: Label
var _monster_bar: ProgressBar
var _points: Label
var _log: Label
var _stat_rows: Dictionary = {}


func _ready() -> void:
	_build()
	GameState.changed.connect(_refresh)
	GameState.leveled_up.connect(func(l): _say("Niveau %d ! +%d points de stats" % [l, Balance.STAT_POINTS_PER_LEVEL]))
	GameState.stage_cleared.connect(func(s): _say("Étage %d atteint" % s))
	if not SaveManager.last_offline.is_empty():
		_show_offline(SaveManager.last_offline)
	SaveManager.offline_gains.connect(_show_offline)
	_refresh()


func _build() -> void:
	var bg := ColorRect.new()
	bg.color = Color("1b1d26")
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + side, 32)
	add_child(margin)

	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 16)
	margin.add_child(col)

	_gold = _label(col, 40)
	_hero = _label(col, 28)
	_xp_bar = _bar(col, Color("6fa8ff"))
	_stage = _label(col, 28)
	_monster_bar = _bar(col, Color("e0565b"))

	col.add_child(HSeparator.new())
	_points = _label(col, 24)

	for stat in STAT_LABELS:
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 12)
		col.add_child(row)
		var name := _label(row, 24)
		name.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var plus := Button.new()
		plus.text = "+1 point"
		plus.custom_minimum_size = Vector2(150, 64)
		plus.pressed.connect(GameState.spend_stat_point.bind(stat))
		row.add_child(plus)
		var train := Button.new()
		train.custom_minimum_size = Vector2(200, 64)
		train.pressed.connect(GameState.train.bind(stat))
		row.add_child(train)
		_stat_rows[stat] = {"name": name, "plus": plus, "train": train}

	col.add_child(HSeparator.new())
	_log = _label(col, 22)
	_log.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_log.modulate = Color(1, 1, 1, 0.7)

	var spacer := Control.new()
	spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	col.add_child(spacer)

	var wipe := Button.new()
	wipe.text = "Recommencer (efface la sauvegarde)"
	wipe.custom_minimum_size = Vector2(0, 56)
	wipe.pressed.connect(SaveManager.wipe)
	col.add_child(wipe)


func _refresh() -> void:
	_gold.text = "Or : %s" % _fmt(GameState.gold)
	_hero.text = "Héros niv. %d   ·   %s dégâts/s" % [GameState.level, _fmt(GameState.dps())]
	_xp_bar.max_value = Balance.xp_to_next(GameState.level)
	_xp_bar.value = GameState.xp
	_stage.text = "Étage %d   ·   monstre %d/%d" % [GameState.stage, GameState.kills_in_stage + 1, Balance.KILLS_PER_STAGE]
	_monster_bar.max_value = Balance.monster_hp(GameState.stage)
	_monster_bar.value = GameState.monster_hp_left
	_points.text = "Points de stats : %d" % GameState.stat_points
	for stat in _stat_rows:
		var r: Dictionary = _stat_rows[stat]
		r.name.text = "%s  %d" % [STAT_LABELS[stat], GameState.stats[stat]]
		r.plus.disabled = GameState.stat_points <= 0
		var cost := GameState.train_cost(stat)
		r.train.text = "Entraîner  %s or" % _fmt(cost)
		r.train.disabled = GameState.gold < cost


func _show_offline(s: Dictionary) -> void:
	_say("Absent %s : %s monstres vaincus, +%s or, +%s XP" % [
		_duration(s.seconds), _fmt(s.kills), _fmt(s.gold), _fmt(s.xp)])


func _say(msg: String) -> void:
	if _log:
		_log.text = msg


func _label(parent: Node, font_size: int) -> Label:
	var l := Label.new()
	l.add_theme_font_size_override("font_size", font_size)
	parent.add_child(l)
	return l


func _bar(parent: Node, color: Color) -> ProgressBar:
	var b := ProgressBar.new()
	b.custom_minimum_size = Vector2(0, 24)
	b.show_percentage = false
	var fill := StyleBoxFlat.new()
	fill.bg_color = color
	b.add_theme_stylebox_override("fill", fill)
	parent.add_child(b)
	return b


static func _fmt(n: float) -> String:
	var suffixes := ["", "k", "M", "B", "T", "Qa", "Qi"]
	var i := 0
	while abs(n) >= 1000.0 and i < suffixes.size() - 1:
		n /= 1000.0
		i += 1
	if i == 0:
		return str(int(n)) if n >= 10.0 or n == floorf(n) else "%.1f" % n
	return "%.2f%s" % [n, suffixes[i]]


static func _duration(sec: float) -> String:
	var h := int(sec) / 3600
	var m := (int(sec) % 3600) / 60
	return "%dh%02d" % [h, m] if h > 0 else "%d min" % m
