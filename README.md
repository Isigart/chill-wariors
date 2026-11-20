# Rising Idle

Incremental de build de héros en **Godot 4.3+** (GDScript, rendu Compatibility, format portrait pour mobile).
On grimpe une tour infinie ; ce qu'on fait entre deux montées (s'entraîner, cueillir, cuisiner) façonne un héros qui ne ressemble à aucun autre.
Concept complet : document « Rising idle : concept de la tour infinie ».

## Lancer
- Ouvrir le dossier dans Godot 4.3 ou plus récent, puis F5.
- Tests de la logique, sans fenêtre :
  `godot --headless --path . -s res://tests/run_tests.gd`

## Ce que contient le prototype
- **Classes** : Guerrier, Voleur, Mage, Rôdeur. Chacune a une stat principale, une arme et un métier naturel (+20 % d'XP).
- **Tour** : 5 ennemis par étage, un gardien tous les 10 étages, un biome tous les 25. Combat automatique dans les deux sens.
  À la mort on recommence l'étage ; après 3 morts on redescend farmer l'étage d'en dessous, et on retente dès que le héros change (niveau, arme, plat, stat).
- **Une activité à la fois** : la tour ou un métier.
- **Métiers** : Entraînement (or → stats), Cueillette (baies, herbes, champignons, truffes), Cuisine (4 plats qui donnent des bonus et sont mangés tout seuls). Minage, Forge et Alchimie sont annoncés.
- **Synergies** : paliers de métier qui s'activent selon l'arme (Cuisine 10 + couteau : +15 % critique et dégâts × 1,25 ; Cuisine 50 + couteau : dégâts × 3…). Elles se multiplient entre elles.
- **Armes** : 6 types à acheter, rangs d'amélioration (× 1,4 par rang).
- **Réincarnation** dès l'étage 30 : Essence = (étage max / 10)², on garde métiers, Essence et record. Arbre : Corps, Esprit, Destin, Élan.
- **Hors ligne** : l'activité continue à 100 % jusqu'à 12 h (+6 h par niveau de Destin), avec un rapport au retour.
- **Sauvegarde** JSON versionnée dans `user://save.json` (toutes les 15 s, à la fermeture et en arrière-plan).

## Organisation
- `scripts/autoload/balance.gd` : tout l'équilibrage et le contenu (classes, armes, recettes, synergies, courbes).
- `scripts/autoload/game_state.gd` : état et simulation (une seule fonction `tick()` pour le jeu, le hors-ligne et les tests).
- `scripts/autoload/save_manager.gd` : sauvegarde, migrations, rattrapage hors ligne.
- `scripts/ui/main.gd` : interface en 4 onglets, construite en code.
- `tests/run_tests.gd` : tests headless.

## Ancien jeu
Ce dépôt contenait *Chill Warriors* (jeu idle web Next.js, v0.10). Son code reste dans l'historique Git, au commit `425e849`.
