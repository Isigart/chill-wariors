extends Node
## Sauvegarde JSON versionnée dans user://, auto-save périodique,
## et calcul des gains hors-ligne au chargement.

signal offline_gains(summary: Dictionary)

const SAVE_PATH := "user://save.json"
const SAVE_VERSION := 1
const AUTOSAVE_SECONDS := 15.0

var _timer: float = 0.0
var last_offline: Dictionary = {}


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
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var text := FileAccess.get_file_as_string(SAVE_PATH)
	var parsed = JSON.parse_string(text)
	if typeof(parsed) != TYPE_DICTIONARY:
		push_warning("Sauvegarde illisible, on repart de zéro.")
		return
	var data: Dictionary = _migrate(parsed)
	GameState.from_dict(data.get("state", {}))
	var away := Time.get_unix_time_from_system() - float(data.get("saved_at", 0.0))
	if away > 60.0:
		last_offline = GameState.apply_offline(away)
		offline_gains.emit(last_offline)


func wipe() -> void:
	if FileAccess.file_exists(SAVE_PATH):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_PATH))
	GameState.reset()


## Fait évoluer une ancienne sauvegarde vers le format courant.
## Ajouter une étape `if v < N:` à chaque changement de format.
func _migrate(data: Dictionary) -> Dictionary:
	var v := int(data.get("version", 0))
	if v < 1:
		data["version"] = 1
	return data
