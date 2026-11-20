# Rising Idle

Incremental de build de héros, en **Godot 4.3+** (GDScript, rendu Compatibility, format portrait pour mobile).

## Lancer
- Ouvrir le dossier dans Godot 4.3 ou plus récent, puis F5.
- Tests de la logique, sans fenêtre :
  `godot --headless --path . -s res://tests/run_tests.gd`

## Ce que fait le prototype
- Le héros combat seul : chaque monstre vaincu rapporte de l'**or** et de l'**XP**, 10 monstres font passer à l'**étage** suivant (monstres plus durs, meilleures récompenses).
- **Niveaux** : chaque niveau donne 3 points à répartir entre Force (dégâts), Agilité (vitesse d'attaque), Chance (or) et Vitalité (prévue pour le combat à double sens).
- **Entraînement** : dépenser de l'or pour +1 dans une stat, coût croissant.
- **Sauvegarde** JSON versionnée dans `user://save.json` (auto toutes les 15 s, à la fermeture et en arrière-plan), avec **gains hors-ligne** (50 %, plafonnés à 8 h).

## Organisation
- `scripts/autoload/balance.gd` : tout l'équilibrage (courbes, coûts, plafonds).
- `scripts/autoload/game_state.gd` : état et boucle de jeu.
- `scripts/autoload/save_manager.gd` : sauvegarde, migrations, hors-ligne.
- `scripts/ui/main.gd` : écran unique, construit en code.
- `tests/run_tests.gd` : tests headless.

## Ancien jeu
Ce dépôt contenait *Chill Warriors* (jeu idle web Next.js, v0.10). Son code reste dans l'historique Git, au commit `425e849`.
