# Chill Warriors — Design Brief

Idle game PWA. Document de référence pour le développement. À tenir à jour.

## 1. Pitch

Idle observable où tu joues un perso fixe au centre de l'écran. Des vagues infinies de mobs arrivent, tes armes équipées les massacrent en autonomie. Toi tu regardes, tu upgrades, tu choisis. Pas de mouvement, pas de skill manuel, pas de mort. Tu kill, ça monte, c'est satisfaisant.

L'identité : chill, solo, sans enjeux. Pas d'équilibrage compétitif, pas de FOMO, pas de pression. Tous les builds "marchent". Le but n'est pas que ce soit juste, c'est que ce soit bon à ressentir.

Hook identitaire : "Le seul idle où ton style de jeu devient ta classe au fil du temps."

## 2. Boucle de jeu

```
Combat auto (vague en cours)
        ↓
Kills → XP arme + XP famille d'arme
        ↓
Paliers débloqués → choix dans l'arbre interne / arbre de famille
        ↓
Transformations visuelles + mécaniques de l'arme
        ↓
Vague suivante (ou grind de la vague actuelle si elle ne passe pas)
```

- Pas de zones, pas de niveaux de map. Progression purement verticale via les vagues.
- Pas de mort, pas de game over. Si tu bloques sur une vague, tu la grind jusqu'à passer.
- Pas de prestige, pas de reset. Run unique infinie. Tout ce qui est débloqué l'est pour toujours.

## 3. Mécaniques principales

### 3.1 Perso

- Un seul perso, fixe au centre. Pas de classes, pas de personnalisation au début.
- Pas de stats propres au début (HP éventuellement plus tard pour les instances).
- Le perso est juste un point d'ancrage pour les armes.

### 3.2 Combat

- Auto-battle observable. Le joueur ne contrôle rien pendant le combat.
- Tick rapide : chaque arme attaque selon sa propre cadence (vitesse de rotation pour l'épée, cooldown pour les projectiles…).
- Pas de skills manuels, pas d'ultimates déclenchables. Idle pur.

### 3.3 Armes & loadout

Le joueur choisit son loadout parmi :

- 2 armes 1-main (deux comportements en parallèle, polyvalence)
- 1 arme 2-mains (focus extrême, hits massifs, arbre plus profond)

Switch libre : le joueur peut changer d'arme à tout moment. Chaque arme garde sa propre progression accumulée.

Plus tard, via la maîtrise de famille, des configurations cassées deviennent possibles (ex. dual 2-mains).

### 3.4 Familles d'armes (4)

1. 1-main (mêlée rapide, polyvalente)
2. Distance (projectiles, portée)
3. 2-mains (mêlée lourde, dégâts massifs)
4. Magique (sorts, AoE, effets)

Chaque famille a son propre arbre de maîtrise méta, indépendant des arbres internes des armes.

### 3.5 Progression à deux niveaux

**Arbre interne (par arme)** — modèle "training mode"

Chaque arme individuelle a son propre arbre de skill multi-branches. Exemple pour l'épée tournoyante :

- Branche vitesse : la rotation accélère, anneau cinétique, ondes
- Branche portée : la lame s'allonge, faux, lame fantôme, pierce
- Branche dégâts : chiffres rouges, crits, explosions

5 paliers (T1→T5) par voie. Détail tier-par-tier dans `design/SWORD_TREE.md`.

**Le joueur entraîne UNE seule voie à la fois.** Les kills nourrissent uniquement la voie entraînée. Le joueur switch de voie quand il veut, sans coût, via un HUD non-bloquant de 3 boutons en bas d'écran.

**Cumulatif, sans regret, sans respec.** Les 3 voies peuvent être maxées si on farme assez. Pas de choix exclusif, pas de sacrifice, pas de palier qui en bloque d'autres. Un palier débloqué l'est pour toujours.

**Auto-unlock** : quand la jauge atteint le seuil d'un tier, ce tier débloque automatiquement — pas de validation manuelle, pas de modal. Flash bref sur le bouton concerné pour signaler.

Les paliers doivent être des transformations visibles, pas juste des "+10%". Ex. "ton épée est désormais en feu", "ton épée fait 3× la taille du perso", "ton épée laisse une traînée", "ta lame traverse les mobs sans s'arrêter".

Les paliers doivent être des transformations visibles, pas juste des "+10%". Ex. "ton épée est désormais en feu", "ton épée fait 3× la taille du perso", "ton épée laisse une traînée", "une lame fantôme apparaît à 180°".

**Arbre de famille (méta)**

Chaque famille a son arbre méta, alimenté par les kills des armes de cette famille (les kills d'une 2-mains font monter la maîtrise 2-mains).

- Progression rapide au début, lente ensuite (courbe classique du genre).
- Maîtrises gardées en permanence une fois débloquées.
- Premiers paliers : petits perks transverses (genre +5% de vitesse globale pour la famille).
- Branche finale = transgression de règle. Exemple : maîtrise 2-mains à fond → débloque le dual 2-mains. Chaque famille aura sa transgression ultime (à définir : voie 1-main → triple wield ou clones miroir ? voie distance → tourelle stationnaire ? voie magique → sorts auto-castés indépendants des armes ?).

### 3.6 Déblocage des armes

- 3 armes de base disponibles dès le départ. Une par famille de base (1-main, distance, 2-mains, magique — à décider laquelle est gardée pour plus tard). Probablement : épée 1-main, arc distance, hache 2-mains.
- Les autres armes se débloquent via les futures instances de défi. Chaque instance est thématiquement liée à l'arme qu'elle débloque.

### 3.7 Économie & chiffres

- Pas d'équilibrage formel. Les chiffres peuvent exploser : k → M → B → T → notation aa/ab/ac…
- Pas de monnaie premium au lancement. Pas d'IAP. Pas de gemmes.
- Une seule ressource au début : l'XP d'arme (et l'XP de famille, dérivée). Le gold sera ajouté si une vraie économie d'upgrade s'avère utile, sinon non.

### 3.8 Instances (futur, hors v1)

Mode opt-in, équilibré, où la tension et la friction vivent.

- Chaque instance débloque une arme nouvelle (thématique).
- Les stats sont recalibrées dans le contexte instance (pas les chiffres folie du mode idle).
- Sessions plus longues, planifiées (20 min+) vs sessions chill du mode principal (2–5 min).

À prévoir dès maintenant dans le code : un concept de contexte de combat (`{ mode: 'idle' | 'instance', modifiers: {...} }`) pour pouvoir brancher les instances plus tard sans tout réécrire.

### 3.9 Offline progression

À implémenter plus tard. Cap initial 8h, augmentable plus tard via paliers de maîtrise.

## 4. Philosophie de game feel

**Ce qui est sacré**

- Le juice visuel. Screen shake, particules, hit-stop, number popups, flashs, traînées, glow. Sans ça, un gros chiffre n'est pas satisfaisant.
- Le son. Thwack gras au kill, montées de gamme au level up, explosions sonores aux paliers cachés.
- Les paliers de transformation visuelle. Pas "+10%", mais "ton épée est en feu maintenant".
- Le rythme de progression. À quelle fréquence un nouveau palier débloque, à quelle fréquence un nouveau zéro s'ajoute au compteur. C'est ça le vrai tuning d'un idle.

**Ce qui n'existe pas**

- Pas d'équilibrage compétitif.
- Pas de "meilleur build".
- Pas de punition pour avoir mal choisi.
- Pas de FOMO, pas de timer, pas de daily quest agressive.
- Pas de notif push relous.

## 5. Stack technique

- Next.js 14 (App Router) + TypeScript + Tailwind
- Zustand pour le game state (pas Context — re-render à chaque tick = mort)
- Canvas 2D pour le rendu de combat (SVG si on reste très simple au début)
- `requestAnimationFrame` pour le game loop, calculs déterministes (pour pouvoir rejouer le temps offline plus tard)
- localStorage pour la save au début, IndexedDB si ça grossit
- PWA : différée — pas nécessaire pour v0.x
- Cloud save : plus tard, Supabase ou Vercel KV
- Pas d'anti-triche. Jeu solo, on s'en fout.

**Organisation du code**

- Tout le tuning numérique centralisé dans `lib/balance.ts`. Aucun magic number ailleurs. Coefficients faciles à tweaker sans toucher la logique.
- Logique de combat séparée du rendu (`game/` vs `components/`).
- Le store Zustand est la source de vérité unique pour l'état du jeu.

## 6. Roadmap

**v0.1 — Le tick** (objectif : valider le feel de base, 1–2 sessions de dev)

- [ ] Scaffold Next.js + TS + Tailwind + Zustand
- [ ] Canvas plein écran, perso au centre (emoji ou cercle)
- [ ] Une seule arme : épée tournoyante. Rotation à vitesse fixe, hitbox circulaire
- [ ] Mobs basiques : spawn aux bords, marchent vers le perso à vitesse constante
- [ ] Collision épée/mob → mob meurt, +1 kill, popup de dégâts, particule
- [ ] Compteur de kills en haut de l'écran
- [ ] Juice : hit-stop, screen shake léger, particules

Critère de validation : si regarder l'écran pendant 30 secondes est satisfaisant, on continue. Sinon on itère sur le feel avant tout le reste.

**v0.2 — Première arme complète**

- [ ] Vague 1 (spawn limité, fin de vague), vague 2 (plus de mobs), etc.
- [ ] XP sur l'épée tournoyante
- [ ] Premier palier d'évolution avec 3 branches (vitesse / portée / dégâts), 1er palier de chaque
- [ ] Choix de branche → transformation visuelle immédiate
- [ ] Save localStorage basique

**v0.3 — Le loadout**

- [ ] Deuxième arme (ex. arc — famille distance) avec son propre arbre
- [ ] UI de loadout : 2× 1-main OU 1× 2-mains
- [ ] Switch d'arme en jeu
- [ ] Troisième arme (ex. hache 2-mains)

**v0.4 — Familles & méta**

- [ ] Arbre de famille pour les 3 familles débloquées
- [ ] XP de famille calculée à partir des kills
- [ ] Premiers paliers de maîtrise (perks transverses)
- [ ] (Plus tard, vague 500+) première transgression ultime débloquable

**v0.5 — Polish & juice**

- [ ] Sons (thwack, level up, palier)
- [ ] Notation des grands nombres (k/M/B…)
- [ ] Particules avancées, traînées, glow
- [ ] Pause / settings de base

**v1.0 — Releasable**

- [ ] PWA (manifest, service worker, installable)
- [ ] Offline progression (cap 8h)
- [ ] Onboarding (3 écrans max)
- [ ] Export/import save manuel
- [ ] Polish visuel global

**v1.5+ — Post-launch**

- [ ] Mode instances (équilibré, thématique, débloquant des armes)
- [ ] Cloud save
- [ ] Achievements
- [ ] Vœux / défis auto-imposés (cosmétiques)

## 7. Risques connus

**Le risque "tout débloqué, plus rien à choisir"**

Plusieurs choix cumulés vont tous dans le sens "pas de friction" : switch libre, arbre cumulatif, pas de prestige, maîtrises permanentes. Pris ensemble, après quelques dizaines d'heures, le joueur risque d'avoir tout, partout, en permanence. Le sentiment de progression s'aplatit.

Mitigations prévues :

- Paliers ultimes vraiment lointains (vague 500+ pour la première transgression, 2000+ pour la deuxième famille maîtrisée).
- Les instances comme contenu frais ajouté par-dessus — c'est le vrai endgame.
- Plus tard, des vœux / défis auto-imposés pour donner du sens à se contraindre quand tout est débloqué.

Pas un blocage. Juste à garder en tête.

**Le risque "feel pas satisfaisant"**

Sans équilibrage formel, le game feel devient tout. Si l'épée tournoyante n'est pas plaisante à regarder dès le v0.1, aucun système au-dessus ne sauvera le jeu. D'où l'obsession sur le juice dès le premier tick.

## 8. Décisions encore ouvertes

À trancher au fil du dev, pas bloquant pour v0.1 :

- Les 3 transgressions ultimes restantes (1-main / distance / magique).
- Le style visuel exact (flat minimal vs emoji stylisé vs autre). Pixel art exclu (trop coûteux en solo).
- Présence ou non d'une économie de gold. Probablement non au début.
- Combien de paliers dans un arbre de famille (granularité à tester).
- Cadence de spawn des vagues et formule de scaling de difficulté (à tuner via `balance.ts`).
