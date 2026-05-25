# Chill Warriors — Récap design v0.8 (session de tranchage)

> Document de référence consolidant les décisions design prises en session. Mise à jour des fiches existantes (`GAME_DESIGN.md`, `INSTANCE_MINE_OF_MITHRIL.md`, `WEAPON_TREES.md`) à faire suivre ce doc.

---

## 1. Décisions tranchées — Pile A (bloquantes v0.8 beta)

| # | Décision | Statut |
|---|---|---|
| A1 | Drop des Clefs de Mine : **0.5% pur RNG** sur tous les mobs idle | acté |
| A2 | Gating du drop : **1 arme entièrement maxée T5/T5/T5** | acté |
| A3 | Paliers visuels de trempage v0.8 beta : **T10 (glow) + T50 (halo)** uniquement | acté |

## 2. Décisions tranchées — Pile B (structurantes v0.9+)

| # | Décision | Statut |
|---|---|---|
| B1 | Instances thématiques d'arme = **petits donjons puzzle** avec boss final, réservés à l'arme correspondante | acté |
| B2 | Arbre de famille : **bonus passifs + transgression au sommet** (les deux) | acté |
| B3 | Économie : **mithril uniquement, ressource universelle** | acté |
| B4 | Tempo difficulté idle : **patterns de vagues variés** (horde dense / élite isolé / mix) → certaines armes brillent sur certains patterns | acté |
| B5 | PWA / offline progression : **à installer en v0.8** | acté |
| B6 | Cloud save : **local uniquement maintenant, Supabase plus tard quand utile** | acté |

## 3. Décisions tranchées — Pile C (esthétique long terme)

| # | Décision | Statut |
|---|---|---|
| C1 | Notation grands nombres : **custom aa/ab/ac...** au-delà du milliard (style idle clicker) | acté |
| C2 | Hit-stop : **garder le poids des hits, atténuer le flash** | acté |
| C3 | Direction sonore : **reporter**, pas urgent | acté |
| C4 | Design des mobs : **cercles abstraits bien juicés** (minimalisme assumé) | acté |
| C5 | Style visuel : **garder le squelette actuel, basculer la palette en médiéval fantasy** (or terni, rouge brique, vert mousse, bleu minuit) — pas de pixel art | acté |
| C6 | Monétisation : **tip jar / donations volontaires** | acté |

---

## 4. Architecture des ressources et accès — synthèse

### Les deux types de clefs

**Clef de Mine** (ressource récurrente)
- Drop continu en idle, 0.5% RNG, gated par 1 arme maxée T5/T5/T5.
- Réutilisable au sens du système (chaque clef = 1 entrée, mais d'autres droppent).
- Sert à entrer dans la **Mine de Runes/Mithril**, unique instance de farm du jeu.
- L'instance n'a pas de fin théorique : vagues + spike + scaling exponentiel → autel.

**Clef d'arme** (ressource unique narrative)
- Item *unique, à usage unique*.
- Drop **garanti aux paliers de difficulté idle** (tier 20 = clef bouclier, tier 30 = clef grimoire, etc. — à détailler).
- Sert à entrer dans le **donjon d'arme** correspondant.
- Le donjon est un petit puzzle thématique avec un boss final qui illustre le potentiel de l'arme.
- La complétion du donjon **débloque l'arme définitivement** dans le loadout.
- Une fois l'arme débloquée, le donjon est terminé. On n'y retourne pas.

### Une seule ressource

- **Mithril** : ressource universelle pour le trempage de toutes les armes.
- Seule source : la Mine de Runes/Mithril.
- Pas d'autre ressource type "gold idle" pour l'instant (reporté).

### Flow joueur global

```
Mode idle (XP de branche, paliers 1-5 par voie)
   ↓
   ↓ tier de difficulté monte → drop garanti de clefs d'arme aux paliers
   ↓ 1 arme atteinte T5/T5/T5 → drop possible de Clef de Mine (0.5%)
   ↓
   ├── Donjon d'arme (clef unique) → boss → arme débloquée
   │   ↓
   │   Retour mode idle, nouvelle arme disponible
   │
   └── Mine de Runes (Clef de Mine) → vagues + autel → trempage
       ↓
       Retour mode idle, arme amplifiée
```

Les deux modes coexistent. Le joueur peut choisir l'ordre selon son humeur : continuer à pousser le tier idle pour drop des clefs d'arme, ou farmer la mine pour tremper.

---

## 5. Précisions sur les patterns de vagues idle (B4)

Le tempo de difficulté ne sera plus uniforme. Les vagues idle alterneront entre profils types :

- **Horde dense** : beaucoup de mobs faibles, groupés. AoE (baguette) idéale, monocible (arc) galère.
- **Élite isolé** : peu de mobs mais très tanky et rapides. Monocible (arc) idéal, AoE perd en efficacité.
- **Mix** : la majorité, équilibré entre les deux.
- **Vague de rush** : mobs très rapides qui foncent au centre. L'épée tournoyante (AoE proche) brille.

Implications :
- Le **switch d'arme** doit rester libre et instantané en idle (déjà acté).
- Le joueur apprend à anticiper les patterns ("tier 30 = horde, je passe sur baguette").
- En instance, **arme fixe** : tu rentres avec ce que tu as, tu sors avec.

Tuning précis des patterns à détailler dans une note séparée quand on s'y attaquera (v0.9 probable).

---

## 6. Précisions sur les donjons d'arme (B1)

Format attendu pour chaque donjon d'arme :

- **Petit** : 5 à 10 vagues max, durée 3-5 min.
- **Thématique** : l'environnement et les ennemis évoquent l'arme (donjon du bouclier = couloir étroit avec ennemis qui chargent ; donjon du grimoire = arène ouverte avec ennemis dispersés appelant le swarm de spectres).
- **Puzzle/test** : une ou deux mécaniques spécifiques mettent en scène l'arme (le bouclier doit déclencher des dalles de pression en repoussant les ennemis dessus, par exemple).
- **Boss final** : illustre le potentiel haut niveau de l'arme. Difficile mais pas impossible avec une arme à T3-T4 sur ses voies.
- **Récompense** : l'arme elle-même + un peu de mithril en bonus.

Pas de farm dans les donjons d'arme. Une visite, une complétion, fini.

---

## 7. Palette médiéval fantasy — direction (C5)

Conserver la structure actuelle (cercles, halos, particules, flat dark) mais changer les couleurs :

| Élément | Avant (néon/tech) | Après (médiéval fantasy) |
|---|---|---|
| Background | Bleu nuit / charbon froid | Charbon chaud, terre, ardoise |
| Bordures UI | Cyan / violet néon | Or terni, bronze patiné |
| Mobs basiques | Rouge néon | Rouge brique, rouge sang sec |
| Épée trail | Bleu électrique | Argenté avec reflets dorés |
| Arc flèches | Vert/jaune néon | Bois brun, empennage ivoire |
| Baguette feu | Orange fluo | Rouge brasier + jaune chaud (vraie flamme) |
| Mithril/glow | Cyan brillant | Doré chaud, blanc ivoire |
| Particules positives | Vert citron | Or, ambre |
| Particules négatives | Rouge fluo | Rouge profond, rouge mat |
| HUD compteur kills | Vert phosphore | Crème, or pâle |

**Implémentation** : 1 session de tuning dans `tailwind.config.ts` (extension de palette) + `balance.ts` (couleurs de particules) + composants UI (bordures, fonds). Ordre de grandeur : 1-2 heures de polish total.

**Bonus optionnels à plus long terme** :
- Typo serif médiévale pour titres (Cinzel, IM Fell English).
- Textures subtiles parchemin/pierre sur fonds UI.
- Icônes silhouettes des armes (plutôt que cercles colorés).

---

## 8. Roadmap consolidée post-session

### v0.8 beta (chantier immédiat — Pile A)

- [ ] Drop des Clefs de Mine (0.5% RNG, gated par 1 arme T5/T5/T5)
- [ ] Paliers visuels de trempage T10 (glow) et T50 (halo)
- [ ] Palette médiéval fantasy (Pile C5)
- [ ] Hit-stop : atténuer le flash, garder le poids (Pile C2)

### v0.9 (chantier suivant — Pile B priorité haute)

- [ ] PWA / offline progression (Pile B5)
- [ ] Patterns de vagues variés en idle (Pile B4)
- [ ] Notation des grands nombres aa/ab/ac (Pile C1)
- [ ] Premier **donjon d'arme** (probablement bouclier, clef garantie au tier 20)
- [ ] Système de Clef d'arme (drop garanti aux paliers de difficulté)

### v1.0 (release)

- [ ] Tous les donjons d'arme des armes débloquables (bouclier, grimoire, et autres prévues)
- [ ] Arbre de famille méta complet (bonus passifs + transgression au sommet)
- [ ] Sons / direction sonore (Pile C3, à trancher au moment voulu)
- [ ] Tip jar / monétisation volontaire (Pile C6)

### Long terme

- [ ] Supabase cloud save (Pile B6, quand la PWA et le besoin multi-device l'imposent)
- [ ] Éventuels assets de polish (typo médiévale, textures, icônes silhouettes)

---

## 9. Points à surveiller / risques connus

### Le contenu des donjons d'arme

Chaque donjon d'arme demande du design spécifique : environnement, mécaniques, boss, équilibrage. Pour 4 armes débloquables (bouclier, grimoire, et 2 futures de chaque famille manquante), c'est 4 chantiers de design. À étaler intelligemment dans la roadmap.

### La courbe de mithril

Avec mithril universel, le joueur qui a maxé son épée à T5 peut farmer la mine ET tremper *immédiatement* l'épée, sans avoir débloqué les autres armes. Risque : il pousse l'épée à T50+ avant de toucher au bouclier. Pas dramatique (philo : "tous les builds viables, pas de meta") mais à observer.

### Le drop garanti des clefs d'arme aux paliers de difficulté

Cohérent avec le tempo idle (200 kills/tier). Mais il faut que les paliers soient choisis avec soin :
- Tier 20 = ~4000 kills idle = ~30 min de jeu. Trop tôt ?
- Tier 30 = ~6000 kills = ~45 min. OK.
- Tier 40 = ~8000 kills.
- Tier 50 (cap actuel) = ~10000 kills.

À ajuster en jeu. Peut-être pousser à tier 25 / 35 / 45 selon le ressenti.

### Les patterns de vagues

Introduire des patterns rompt la régularité actuelle. Risque que le joueur perçoive ça comme aléatoire/injuste s'il n'anticipe pas bien. Prévoir une **indication visible** du prochain pattern (genre "Vague suivante : Horde" affiché 3s avant).

---

## 10. Hors-scope explicite

- Multi-armes simultanées (loadout 2x 1-main ou 2-mains) — encore en attente.
- Cloud save Supabase — reporté.
- Pixel art / assets dessinés — pas du tout.
- Sons et musique — reportés.
- Cosmétiques payants / IAP — exclu.
- Leaderboards, achievements multi-joueurs — pas avant Supabase et au-delà.

---

*Document généré en session, à valider et merger avec les fiches existantes après relecture.*
