extends Control
## Interface du prototype, construite en code (lisible sans l'éditeur).
## Quatre onglets : Tour, Métiers, Héros, Réincarnation, plus le choix de classe
## et le rapport de retour hors ligne.

const BG := Color("15161d")
const ACCENT := Color("7fb2ff")

var _w := {}            # widgets à rafraîchir, par nom
var _log_lines: Array[String] = []
var _refresh_t := 0.0


func _ready() -> void:
	_build()
	GameState.changed.connect(func(): _refresh_t = 1.0)
	GameState.message.connect(_on_message)
	SaveManager.offline_report.connect(_show_report)
	if not SaveManager.last_report.is_empty():
		_show_report(SaveManager.last_report)
	_refresh()


func _process(delta: float) -> void:
	_refresh_t += delta
	if _refresh_t >= 0.1:
		_refresh_t = 0.0
		_refresh()


# --- Construction ------------------------------------------------------------

func _build() -> void:
	var bg := ColorRect.new()
	bg.color = BG
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + side, 24)
	add_child(margin)

	var col := _vbox(margin, 12)
	_w.header = _label(col, 30)
	_w.gold = _label(col, 26)

	var tabs := TabContainer.new()
	tabs.size_flags_vertical = Control.SIZE_EXPAND_FILL
	tabs.add_theme_font_size_override("font_size", 24)
	col.add_child(tabs)
	_build_tower(_tab(tabs, "Tour"))
	_build_skills(_tab(tabs, "Métiers"))
	_build_hero(_tab(tabs, "Héros"))
	_build_rebirth(_tab(tabs, "Réincarnation"))

	_w.log = _label(col, 20)
	_w.log.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_w.log.custom_minimum_size = Vector2(0, 150)
	_w.log.modulate = Color(1, 1, 1, 0.75)

	_build_class_picker()
	_build_report()


func _build_tower(p: VBoxContainer) -> void:
	_w.floor = _label(p, 28)
	_w.enemy_bar = _bar(p, Color("e0565b"))
	_w.enemy = _label(p, 20)
	_w.hero_bar = _bar(p, Color("5fd38d"))
	_w.combat = _label(p, 22)
	_w.climb = _button(p, "Grimper la tour", func(): GameState.set_activity("tower"))
	_w.retreat = _label(p, 20)
	_w.retreat.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_w.retry = _button(p, "Retenter l'étage", GameState.retry_climb)
	_w.dish = _label(p, 20)


func _build_skills(p: VBoxContainer) -> void:
	_w.skills = {}
	for id in Balance.SKILLS:
		var row := _hbox(p)
		var lab := _label(row, 22)
		lab.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var b := _button(row, "Pratiquer", GameState.set_activity.bind(id))
		b.custom_minimum_size.x = 190
		var bar := _bar(p, ACCENT)
		bar.custom_minimum_size.y = 10
		_w.skills[id] = {"label": lab, "button": b, "bar": bar}

	var tr := _hbox(p)
	_label(tr, 20).text = "Entraîner :"
	var opt := OptionButton.new()
	for s in Balance.STATS:
		opt.add_item(Balance.STAT_NAMES[s])
	opt.item_selected.connect(func(i): GameState.training_target = Balance.STATS[i])
	tr.add_child(opt)
	_w.train_opt = opt

	var cr := _hbox(p)
	_label(cr, 20).text = "Recette :"
	var ropt := OptionButton.new()
	for r in Balance.RECIPES:
		ropt.add_item(Balance.RECIPES[r].name)
	ropt.item_selected.connect(func(i): GameState.recipe = Balance.RECIPES.keys()[i])
	cr.add_child(ropt)
	_w.recipe_opt = ropt
	_w.recipe_info = _label(p, 18)
	_w.recipe_info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_w.inventory = _label(p, 20)
	_w.inventory.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART


func _build_hero(p: VBoxContainer) -> void:
	_w.hero = _label(p, 24)
	_w.xp_bar = _bar(p, ACCENT)
	_w.points = _label(p, 22)
	_w.stats = {}
	for s in Balance.STATS:
		var row := _hbox(p)
		var lab := _label(row, 22)
		lab.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var b := _button(row, "+1", GameState.spend_stat_point.bind(s))
		b.custom_minimum_size.x = 90
		_w.stats[s] = {"label": lab, "button": b}
	p.add_child(HSeparator.new())
	_w.weapon = _label(p, 22)
	_w.upgrade = _button(p, "", GameState.upgrade_weapon)
	_w.weapons = {}
	var grid := GridContainer.new()
	grid.columns = 2
	p.add_child(grid)
	for id in Balance.WEAPONS:
		var b := _button(grid, "", func(): _weapon_pressed(id))
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		_w.weapons[id] = b
	p.add_child(HSeparator.new())
	_w.synergies = _label(p, 18)
	_w.synergies.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART


func _build_rebirth(p: VBoxContainer) -> void:
	_w.rebirth_info = _label(p, 22)
	_w.rebirth_info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_w.rebirth = _button(p, "", GameState.reincarnate)
	p.add_child(HSeparator.new())
	_w.tree = {}
	for id in Balance.TREE:
		var b := _button(p, "", GameState.buy_tree.bind(id))
		b.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		b.custom_minimum_size.y = 80
		_w.tree[id] = b
	p.add_child(HSeparator.new())
	_button(p, "Effacer la sauvegarde et tout recommencer", SaveManager.wipe)


func _build_class_picker() -> void:
	var panel := PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	var style := StyleBoxFlat.new()
	style.bg_color = BG
	panel.add_theme_stylebox_override("panel", style)
	add_child(panel)
	var m := MarginContainer.new()
	for side in ["left", "right", "top", "bottom"]:
		m.add_theme_constant_override("margin_" + side, 40)
	panel.add_child(m)
	var v := _vbox(m, 20)
	_label(v, 34).text = "[Choisis ta classe]"
	_w.picker_sub = _label(v, 20)
	_w.picker_sub.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	for id in Balance.CLASSES:
		var c: Dictionary = Balance.CLASSES[id]
		var b := _button(v, "%s\n%s" % [c.name, c.desc], GameState.choose_class.bind(id))
		b.custom_minimum_size.y = 110
		b.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_w.picker = panel


func _build_report() -> void:
	var panel := PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.custom_minimum_size = Vector2(620, 0)
	panel.position = Vector2(50, 300)
	var style := StyleBoxFlat.new()
	style.bg_color = Color("232634")
	style.border_color = ACCENT
	style.set_border_width_all(3)
	style.set_corner_radius_all(8)
	style.set_content_margin_all(24)
	panel.add_theme_stylebox_override("panel", style)
	add_child(panel)
	var v := _vbox(panel, 16)
	_w.report_text = _label(v, 22)
	_w.report_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_button(v, "Continuer", func(): panel.hide())
	panel.hide()
	_w.report = panel


# --- Rafraîchissement --------------------------------------------------------

func _refresh() -> void:
	var gs := GameState
	_w.picker.visible = gs.hero_class == ""
	if gs.hero_class == "":
		_w.picker_sub.text = "Ce choix oriente ton début de partie, pas ton destin. Réincarnations : %d" % gs.reincarnations
		return
	var cls: Dictionary = Balance.CLASSES[gs.hero_class]
	_w.header.text = "%s niv. %d   ·   Étage %d   (record %d)" % [cls.name, gs.level, gs.floor_n, gs.record_floor]
	_w.gold.text = "Or : %s    Essence : %d" % [_fmt(gs.gold), gs.essence]

	# Tour
	var boss := Balance.is_boss(gs.floor_n)
	_w.floor.text = "Étage %d · %s%s" % [gs.floor_n, Balance.biome(gs.floor_n), "  ·  GARDIEN" if boss else ""]
	_w.enemy_bar.max_value = Balance.enemy_hp(gs.floor_n)
	_w.enemy_bar.value = max(gs.enemy_hp, 0.0)
	_w.enemy.text = "Ennemi %d/%d   PV %s   attaque %s" % [gs.enemy_index + 1, Balance.ENEMIES_PER_FLOOR,
		_fmt(max(gs.enemy_hp, 0.0)), _fmt(Balance.enemy_attack(gs.floor_n))]
	_w.hero_bar.max_value = gs.max_hp()
	_w.hero_bar.value = max(gs.hero_hp, 0.0)
	_w.combat.text = "PV %s / %s    Dégâts/s %s    Critique %d %%" % [_fmt(gs.hero_hp), _fmt(gs.max_hp()),
		_fmt(gs.dps()), int(gs.crit_chance() * 100)]
	_w.climb.disabled = gs.activity == "tower"
	_w.climb.text = "En train de grimper" if gs.activity == "tower" else "Grimper la tour"
	_w.retreat.visible = gs.retreating
	_w.retry.visible = gs.retreating
	_w.retreat.text = "Bloqué à l'étage %d : le héros farme l'étage %d. Change d'arme, mange un plat ou monte un métier, il retentera tout seul." % [gs.floor_n + 1, gs.floor_n]
	if gs.dish != "":
		_w.dish.text = "Plat actif : %s (%s)" % [Balance.RECIPES[gs.dish].name, _duration(gs.dish_left)]
	else:
		_w.dish.text = "Aucun plat actif"

	# Métiers
	for id in Balance.SKILLS:
		var info: Dictionary = Balance.SKILLS[id]
		var row: Dictionary = _w.skills[id]
		var lvl := gs.skill_level(id)
		var natural := " ★" if cls.skill == id else ""
		row.label.text = "%s%s  niv. %d" % [info.name, natural, lvl]
		row.bar.max_value = Balance.skill_xp_to_next(lvl)
		row.bar.value = gs.skills[id].xp
		if info.get("soon", false):
			row.button.text = "Bientôt"
			row.button.disabled = true
		else:
			row.button.disabled = gs.activity == id
			row.button.text = "En cours" if gs.activity == id else "Pratiquer"
	var r: Dictionary = Balance.RECIPES[gs.recipe]
	var needs := []
	for ing in r.needs:
		needs.append("%d %s" % [r.needs[ing], Balance.ITEM_NAMES[ing]])
	_w.recipe_info.text = "%s (Cuisine %d) : %s. Séance d'entraînement : %s or." % [r.name, r.level,
		", ".join(needs), _fmt(Balance.training_cost(gs.skill_level("training")))]
	var inv := []
	for id in gs.inventory:
		if gs.inventory[id] > 0:
			var name: String = Balance.ITEM_NAMES.get(id, Balance.RECIPES.get(id, {}).get("name", id))
			inv.append("%s ×%d" % [name, gs.inventory[id]])
	_w.inventory.text = "Sac : " + (", ".join(inv) if not inv.is_empty() else "vide")

	# Héros
	_w.hero.text = "%s niveau %d" % [cls.name, gs.level]
	_w.xp_bar.max_value = Balance.hero_xp_to_next(gs.level)
	_w.xp_bar.value = gs.xp
	_w.points.text = "Points de stat : %d" % gs.stat_points
	for s in Balance.STATS:
		var extra: int = gs.trained[s]
		_w.stats[s].label.text = "%s  %d%s" % [Balance.STAT_NAMES[s], gs.stat(s), "  (+%d entraîné)" % extra if extra > 0 else ""]
		_w.stats[s].button.disabled = gs.stat_points <= 0
	var w: Dictionary = Balance.WEAPONS[gs.weapon]
	_w.weapon.text = "Arme : %s rang %d  (%s par coup)" % [w.name, gs.weapons[gs.weapon], _fmt(gs.hit_damage())]
	_w.upgrade.text = "Améliorer l'arme : %s or" % _fmt(gs.upgrade_cost())
	_w.upgrade.disabled = gs.gold < gs.upgrade_cost()
	for id in Balance.WEAPONS:
		var b: Button = _w.weapons[id]
		var wn: String = Balance.WEAPONS[id].name
		if gs.weapons.has(id):
			b.text = "%s (rang %d)%s" % [wn, gs.weapons[id], " ✓" if gs.weapon == id else ""]
			b.disabled = gs.weapon == id
		else:
			b.text = "Acheter %s : %s or" % [wn, _fmt(Balance.WEAPON_PRICE)]
			b.disabled = gs.gold < Balance.WEAPON_PRICE
	var syn := []
	for s in gs.active_synergies():
		syn.append("• " + s.desc)
	_w.synergies.text = "Synergies actives :\n" + ("\n".join(syn) if not syn.is_empty() else "aucune pour l'instant")

	# Réincarnation
	var gain := Balance.essence_for(gs.max_floor)
	_w.rebirth_info.text = "Réincarnations : %d. Tu gardes tes métiers, ton Essence et ton record. Possible dès l'étage %d (cette vie : %d)." % [
		gs.reincarnations, Balance.REINCARNATION_MIN_FLOOR, gs.max_floor]
	_w.rebirth.text = "Se réincarner : +%d Essence" % gain
	_w.rebirth.disabled = not gs.can_reincarnate()
	for id in Balance.TREE:
		var t: Dictionary = Balance.TREE[id]
		var lv: int = gs.tree[id]
		var b: Button = _w.tree[id]
		if lv >= t.max:
			b.text = "%s %d/%d : %s (max)" % [t.name, lv, t.max, t.desc]
			b.disabled = true
		else:
			var cost := Balance.tree_cost(id, lv)
			b.text = "%s %d/%d : %s\nCoût : %d Essence" % [t.name, lv, t.max, t.desc, cost]
			b.disabled = gs.essence < cost


func _weapon_pressed(id: String) -> void:
	if GameState.weapons.has(id):
		GameState.equip(id)
	else:
		GameState.buy_weapon(id)


func _on_message(text: String) -> void:
	_log_lines.push_front(text)
	if _log_lines.size() > 6:
		_log_lines.resize(6)
	_w.log.text = "\n".join(_log_lines)


func _show_report(rep: Dictionary) -> void:
	var lines := ["[Rapport d'absence : %s]" % _duration(rep.seconds)]
	if rep.floors > 0:
		lines.append("Étages franchis : +%d" % rep.floors)
	if rep.levels > 0:
		lines.append("Niveaux du héros : +%d" % rep.levels)
	if rep.gold > 0.0:
		lines.append("Or : +%s" % _fmt(rep.gold))
	for id in rep.skills:
		lines.append("%s : +%d niveau(x)" % [Balance.SKILLS[id].name, rep.skills[id]])
	for id in rep.items:
		if rep.items[id] > 0:
			var name: String = Balance.ITEM_NAMES.get(id, Balance.RECIPES.get(id, {}).get("name", id))
			lines.append("%s : +%d" % [name, rep.items[id]])
	if lines.size() == 1:
		lines.append("Rien de neuf cette fois.")
	_w.report_text.text = "\n".join(lines)
	_w.report.show()


# --- Petits outils -----------------------------------------------------------

func _tab(tabs: TabContainer, title: String) -> VBoxContainer:
	var scroll := ScrollContainer.new()
	scroll.name = title
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	tabs.add_child(scroll)
	var m := MarginContainer.new()
	m.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	for side in ["left", "right", "top", "bottom"]:
		m.add_theme_constant_override("margin_" + side, 12)
	scroll.add_child(m)
	return _vbox(m, 12)


func _vbox(parent: Node, sep: int) -> VBoxContainer:
	var v := VBoxContainer.new()
	v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	v.add_theme_constant_override("separation", sep)
	parent.add_child(v)
	return v


func _hbox(parent: Node) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 12)
	parent.add_child(h)
	return h


func _label(parent: Node, font_size: int) -> Label:
	var l := Label.new()
	l.add_theme_font_size_override("font_size", font_size)
	parent.add_child(l)
	return l


func _button(parent: Node, text: String, cb: Callable) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(0, 60)
	b.add_theme_font_size_override("font_size", 22)
	b.pressed.connect(cb)
	parent.add_child(b)
	return b


func _bar(parent: Node, color: Color) -> ProgressBar:
	var b := ProgressBar.new()
	b.custom_minimum_size = Vector2(0, 22)
	b.show_percentage = false
	var fill := StyleBoxFlat.new()
	fill.bg_color = color
	b.add_theme_stylebox_override("fill", fill)
	parent.add_child(b)
	return b


## Notation courte : 1,2 k, 3,4 M, 5,6 Md...
static func _fmt(n: float) -> String:
	var suffixes := ["", " k", " M", " Md", " T", " Qa", " Qi", " Sx", " Sp", " Oc"]
	var i := 0
	while absf(n) >= 1000.0 and i < suffixes.size() - 1:
		n /= 1000.0
		i += 1
	if i == 0:
		return str(int(n))
	return ("%.1f%s" % [n, suffixes[i]]).replace(".", ",")


static func _duration(sec: float) -> String:
	var s := int(sec)
	var h := s / 3600
	var m := (s % 3600) / 60
	if h > 0:
		return "%d h %02d" % [h, m]
	if m > 0:
		return "%d min" % m
	return "%d s" % s
