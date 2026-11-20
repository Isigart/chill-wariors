extends Node
## Sauvegarde JSON versionnée dans user://, auto-save périodique,
## et rattrapage du temps passé hors ligne au chargement.

signal offline_report(report: Dictionary)

const SAVE_PATH := "user://save.json"
const SAVE_VERSION := 2
const AUTOSAVE_SECONDS := 15.0
const MIN_OFFLINE_SECONDS := 30.0

var _timer: float = 0.0
var last_report: Dictionary = {}


func _ready() -> void:
	load_game()


func _process(delta: float) -> void:
	_timer += delta
	if _timer >= AUTOSAVE_SECONDS:
		_timer = 0.0
		save_game()


func _notification(what: int) -> void:
	# Fermeture de la fenêtre ou passage en arrière-plan sur mobile.
	if what == NOTIFICATION_WM_CLOSE_REQUEST or what == NOTIFICATION_APPLICATION_PAUSED:
		save_game()
	elif what == NOTIFICATION_APPLICATION_RESUMED:
		_catch_up(_read_saved_at())


func save_game() -> void:
	var data := {
		"version": SAVE_VERSION,
		"saved_at": Time.get_unix_time_from_system(),
		"state": GameState.to_dict(),
	}
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f == null:
		push_error("Sauvegarde impossible : %s" % FileAccess.get_open_error())
		return
	f.store_string(JSON.stringify(data, "", false, true))


func load_game() -> void:
	var data := _read()
	if data.is_empty():
		return
	GameState.from_dict(data.get("state", {}))
	_catch_up(float(data.get("saved_at", 0.0)))


func _catch_up(saved_at: float) -> void:
	if saved_at <= 0.0 or GameState.hero_class == "":
		return
	var away := Time.get_unix_time_from_system() - saved_at
	if away >= MIN_OFFLINE_SECONDS:
		last_report = GameState.simulate_offline(away)
		offline_report.emit(last_report)
		save_game()


func _read_saved_at() -> float:
	return float(_read().get("saved_at", 0.0))


func _read() -> Dictionary:
	if not FileAccess.file_exists(SAVE_PATH):
		return {}
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(SAVE_PATH))
	if typeof(parsed) != TYPE_DICTIONARY:
		push_warning("Sauvegarde illisible, on repart de zéro.")
		return {}
	return _migrate(parsed)


func wipe() -> void:
	if FileAccess.file_exists(SAVE_PATH):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_PATH))
	GameState.new_game()


## Fait évoluer une ancienne sauvegarde vers le format courant.
## Ajouter une étape `if v < N:` à chaque changement de format.
func _migrate(data: Dictionary) -> Dictionary:
	var v := int(data.get("version", 0))
	if v < 2:
		return {}   # prototype jetable d'avant le concept : on repart de zéro
	return data
