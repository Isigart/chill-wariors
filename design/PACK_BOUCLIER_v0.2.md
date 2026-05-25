# Chill Warriors — Pack Bouclier v0.2 (final)

> Version finale du design bouclier après session complète. Remplace `PACK_BOUCLIER_v0.1.md` (renommé en deprecated). Contient :
>
> 1. Système de submersion (transversal) — **implémenté en v0.9**
> 2. Arbre interne du bouclier (mis à jour)
> 3. Mini-jeux d'arme — nouveau système permanent
> 4. Articulation mini-jeu / autel de trempage
> 5. Mini-jeu pong du bouclier (déblocage + paliers de trempage)
> 6. Arbre de famille "1-main défensive" avec transgression (Apothéose)
> 7. Identité visuelle du bouclier en idle (cadre, à compléter)

---

## 1. Système de Submersion (transversal idle + instance + mini-jeux)

### Mécanique de base

```
ÉTAT NORMAL
  → jauge monte de +1 par hit subi (contact mob → perso)
  → décroît automatiquement de -2/s quand aucun mob ne touche
  → seuil de stun : 100 points
  → UI : jauge visible sous le perso
      0-49%   : blanc
      50-79%  : ambre
      80-99%  : rouge clignotant

STUN (à 100%)
  → durée : 10s
  → armes à 50% efficacité
  → aucun XP / mithril gagné
  → overlay gris léger, étoiles confuses au-dessus du perso

FIN DE STUN
  → ONDE DE CHOC automatique
  → rayon : 300px
  → knockback : 250px sur tous les mobs touchés
  → dégâts : 0 (base) — amplifiable via arbre de famille
  → reset jauge à 0
  → ouvre fenêtre d'immunité

IMMUNITÉ POST-STUN (5s)
  → jauge bloquée à 0
  → halo doré autour du perso
  → après 5s : retour normal
```

### Constantes (à mettre dans `balance.ts`)

```ts
submersion: {
  thresholdStun: 100,
  hitContribution: 1,
  decayPerSec: 2,
  stunDurationMs: 10000,
  stunWeaponEfficiency: 0.5,
  endOfStunWaveRadius: 300,
  endOfStunWaveDamage: 0,
  endOfStunWaveKnockback: 250,
  immunityDurationMs: 5000,
},
```

### Implications

- Le bouclier est *anti-submersion par essence*. Toute son identité tourne là-dessus.
- L'arbre de famille défensive est *bâti autour* de la transformation de la submersion en arme.

---

## 2. Arbre interne du Bouclier

**Identité** : pulse défensif périodique, omnidirectionnel, équipable seul (pas d'offhand).

**Stats de base** :

```ts
shield: {
  base: {
    bashRadius: 50,
    bashCooldownMs: 800,
    bashDamage: 2,
    auraRadius: 0,
    auraDps: 0,
    knockbackForce: 30,
  },
}
```

**Comportement de base** : toutes les 800ms, pulse circulaire de 50px qui inflige 2 dmg + 30px knockback aux mobs touchés. Le bouclier a une **présence visuelle permanente** autour du perso (à définir en section 7), même entre les pulses.

### Branche FORTERESSE (zone de contrôle)

| Tier | Coût | Stats | Effet spécial |
|------|------|-------|---------------|
| 1 | 15 | bashRadius → 70, knockback → 50 | — |
| 2 | 75 | bashRadius → 95, knockback → 75 | — |
| 3 | 350 | bashRadius → 130, knockback → 110 | — |
| 4 | 1500 | bashRadius → 170, knockback → 160 | **Bash continu** : poussage permanent à faible force |
| 5 | 6000 | bashRadius → 220, knockback → 240 | **Citadelle** : aucun mob ne peut entrer dans le rayon |

### Branche AURA (DPS passif de zone)

| Tier | Coût | Stats | Effet spécial |
|------|------|-------|---------------|
| 1 | 15 | auraRadius → 80, auraDps → 1 | Aura passive active |
| 2 | 75 | auraRadius → 110, auraDps → 3 | — |
| 3 | 350 | auraRadius → 150, auraDps → 8 | — |
| 4 | 1500 | auraRadius → 200, auraDps → 20 | **Stun** : 5% chance/tick stun 200ms les mobs |
| 5 | 6000 | auraRadius → 260, auraDps → 50 | **Tempête statique** : éclairs auto toutes les 100ms |

### Branche RIPOSTE (contre-attaque, anti-submersion)

| Tier | Coût | Stats | Effet spécial |
|------|------|-------|---------------|
| 1 | 15 | bashDamage → 5 | — |
| 2 | 75 | bashDamage → 12, cooldown → 700 | — |
| 3 | 350 | bashDamage → 30, cooldown → 600 | **Reflect** : 25% des hits qui auraient incrémenté la jauge de submersion sont annulés ET renvoyés au mob |
| 4 | 1500 | bashDamage → 70, cooldown → 500 | **Punition** : un mob qui touche le perso a 30% chance d'être instakill (cap HP×5), pas de submersion sur ce hit |
| 5 | 6000 | bashDamage → 200, cooldown → 400 | **Sentence divine** : chaque kill par bash → éclair frappe 3 mobs random |

---

## 3. Système des Mini-jeux d'arme (nouveau, transversal)

### Pitch conceptuel

Chaque arme du jeu (qu'elle soit starter ou débloquable) a **un mini-jeu thématique unique** qui exprime *l'esprit* de l'arme (pas son fonctionnement). C'est un mode de jeu à part, court (1-3 min), à ambiance arcade, qui partage la palette médiéval fantasy du jeu mais peut avoir sa propre présentation/UI.

### Trois usages du mini-jeu

**(1) Déblocage d'une arme** (mini-jeu accessible via Clef d'arme unique)
- Difficulté de base.
- Réussite = arme débloquée définitivement.
- Échec = clef consommée, arme non débloquée. À retenter au prochain drop de clef.

**(2) Boost de trempage** (mini-jeu accessible quand le joueur tente un palier de trempage de l'arme)
- Difficulté scalée selon le palier visé.
- Réussite = **+15% de proba** au prochain tirage d'autel.
- Échec = pas de bonus, mais **mithril conservé** (non punitif).
- Bonus **non stockable** (consommé au prochain tirage).

**(3) Plus tard, événements ponctuels possibles** : objectifs hebdomadaires, défis communautaires, etc. À voir.

### Cadre formel

- **Durée** : 1 à 3 minutes par run.
- **Format** : arcade, boucle qui s'intensifie.
- **Palette** : médiéval fantasy globale (or terni, rouge brique, etc.) mais présentation libre.
- **Mécanique** : simple et reconnaissable sans clonage (pong-like, breakout-like, tower defense-like…).
- **Difficulté paramétrique** : un seul mini-jeu par arme, avec paramètres qui scalent selon le contexte (déblocage / palier trempage 25 / palier 75 / palier 200…).
- **Conditions de victoire/défaite** : claires, mesurables, lisibles instantanément.

### Architecture suggérée

```ts
type MiniGame = {
  id: string;                       // 'shield_pong', 'bow_archery', etc.
  weapon: WeaponId;
  baseParams: MiniGameParams;
  difficultyScaler: (paliersTrempage: number) => MiniGameParams;
};

type MiniGameParams = {
  duration: number;
  // spécifique au mini-jeu : speed, count, etc.
};

type MiniGameResult = 'success' | 'failure';
```

Le mini-jeu est lancé dans son propre composant React (`MiniGameRunner.tsx`), qui prend en input l'arme + les params, et émet un événement `onComplete(result)`. Le routage entre idle / instance / autel / mini-jeu se fait via le store global (`currentMode`).

---

## 4. Articulation Mini-jeu / Autel de Trempage

```
Joueur veut tremper une arme (palier N+1)
  ↓
  ┌─ Optionnel : faire le mini-jeu de l'arme
  │   ├─ Difficulté = scalée selon N+1
  │   ├─ Succès → bonus +15% stocké (consommé au prochain tirage)
  │   └─ Échec → pas de bonus, mithril intact, peut retenter ou aller directement à l'autel
  │
  └─ Aller à l'autel
      ├─ Injecter mithril (optionnel, softcap +50%)
      ├─ Appliquer bonus mini-jeu (si présent, +15%)
      ├─ Proba finale = base(N+1) + bonusMithril + bonusMiniGame [cap 99%]
      ├─ Tirage RNG
      ├─ Succès → palier +1, effet stat appliqué
      └─ Échec → mithril perdu, palier -10 (clamp 0), bonus mini-jeu consommé
```

### Exemple chiffré

Joueur veut tremper l'épée à palier 50 sur la branche vitesse.

- **Proba de base palier 50** : 50% (formule 100% - N×1%)
- **Sans préparation** : tente à 50%. Echec → perd 10 niveaux.
- **Avec 100 mithril injectés** : +43% via softcap → 93%. Très safe.
- **Avec 100 mithril + mini-jeu réussi** : +43% + 15% = +58% → cap 99%. Quasi-garanti.
- **Avec mini-jeu réussi seul (pas de mithril)** : 50% + 15% = 65%. Améliore sans investir mithril.

Le joueur arbitre selon son stock de mithril, sa confiance dans le mini-jeu, et son appétit pour le risque.

---

## 5. Mini-jeu du Bouclier — "Le Rempart"

### Pitch

> Un mini-jeu à l'esprit du pong médiéval. Le joueur défend des PNJ alignés au fond d'un cloître contre une pluie de projectiles. Le perso est un *bouclier vivant* qui peut se positionner pour intercepter les missiles. Plus le run avance, plus les missiles deviennent rapides, nombreux, et variés.

### Mécanique

- **Layout** : zone rectangulaire vue de dessus. PNJ alignés au fond. Le joueur contrôle le bouclier (cercle/disque visible) le long d'une ligne horizontale au premier plan.
- **Contrôle** : 2 boutons gauche/droite (ou drag sur mobile) pour déplacer le bouclier. Une seule dimension de mouvement.
- **Missiles** : tombent depuis le haut, à différentes positions, à différentes vitesses. Au contact du bouclier → repoussés (point pour le joueur). Au contact d'un PNJ → PNJ blessé/tué.
- **Mêlée bonus** (à partir de la moitié du run) : ennemis qui descendent en marchant. Au contact du bouclier, ils prennent des dégâts d'épines. S'ils dépassent → ils foncent sur les PNJ.

### Conditions de réussite

- **Succès** : au moins **X% des PNJ vivants** à la fin du timer.
- **Échec** : moins de X% des PNJ vivants, ou tous morts avant la fin.

Le seuil X dépend du contexte :

| Contexte | Durée | PNJ | Missiles/sec | Seuil succès |
|----------|-------|-----|--------------|--------------|
| Déblocage | 1 min 30s | 4 | 0.5 → 2 (rampe) | 75% (3/4 PNJ) |
| Palier trempage 25 | 2 min | 5 | 1 → 3 | 80% (4/5 PNJ) |
| Palier trempage 75 | 2 min 30s | 6 | 1.5 → 4 + biais | 85% (5/6) |
| Palier trempage 150 | 3 min | 8 | 2 → 5 + missiles homing | 90% (7/8) |
| Palier trempage 250+ | 3 min | 10 | scaling continu | 95% (9/10) |

### Paramètres techniques

```ts
shieldPongParams: {
  duration: number;          // en secondes
  pnjCount: number;
  missileRatePerSec: number; // taux à 0 (intro)
  missileRateAtEnd: number;  // taux à fin (rampe linéaire ou expo)
  missileSpeed: number;
  hasMelee: boolean;
  hasHomingMissiles: boolean;
  successThreshold: number;  // % PNJ survivants requis
}
```

### Identité visuelle du mini-jeu

- **Décor** : intérieur d'un cloître médiéval. Voûtes, colonnes, vitraux teintés.
- **PNJ** : silhouettes de moines en prière, statiques, vulnérables.
- **Bouclier joueur** : représentation visuelle du bouclier équipé du joueur (palette du palier de trempage actuel — un joueur très trempé a un bouclier qui *brille* dans le mini-jeu aussi).
- **Missiles** : flèches enflammées, pierres lancées, javelots — variations selon la difficulté.
- **Mêlée** : silhouettes encapuchonnées (profanateurs).
- **UI** : timer en haut, jauge "PNJ survivants" sur les côtés, score de missiles bloqués.

### Conditions d'accès au mini-jeu

- **Déblocage** : Clef du Cloître (drop garanti tier 20 idle).
- **Boost trempage** : libre, accessible depuis l'autel quand le joueur tente un palier de trempage du bouclier.

---

## 6. Arbre de Famille — "1-main Défensive"

### Pitch identitaire

> La famille 1-main défensive est celle des **maîtres de la submersion**. Pas seulement la subir, mais la *transformer en arme*. Plus tu es expérimenté, plus ton corps apprend à canaliser le chaos pour le retourner contre tes ennemis.

### Activation et progression

- Alimentée par les **kills cumulés de toutes les armes 1-main défensives équipées**. Aujourd'hui : bouclier uniquement.
- Coûts × 10 par rapport aux arbres d'arme : **150 / 750 / 3500 / 15000 / 60000** kills par palier.
- **Transgression** au sommet : **150 000 kills cumulés**.

### Branche RÉSILIENCE (résistance à la submersion)

| Tier | Coût | Effet |
|------|------|-------|
| 1 | 150 | Décroissance jauge : -2/s → -4/s |
| 2 | 750 | hitContribution : +1 → +0.7 |
| 3 | 3500 | Seuil stun : 100 → 130 |
| 4 | 15000 | Décroissance : -4/s → -8/s |
| 5 | 60000 | hitContribution : +0.7 → +0.4 |

### Branche RÉACTION (puissance de l'onde de fin de stun)

| Tier | Coût | Effet |
|------|------|-------|
| 1 | 150 | Onde : rayon 300 → 400px |
| 2 | 750 | Onde inflige dégâts (= 50 × niveau total armes équipées) |
| 3 | 3500 | Onde knockback 250 → 400px |
| 4 | 15000 | DoT au sol : zone 200px qui brûle 5s (10 dps) |
| 5 | 60000 | Onde récurrente : 3 vagues à 1s d'intervalle |

### Branche DISCIPLINE (immunité post-stun renforcée)

| Tier | Coût | Effet |
|------|------|-------|
| 1 | 150 | Durée immunité : 5s → 8s |
| 2 | 750 | Pendant immunité : armes à 120% efficacité |
| 3 | 3500 | Immunité : 8s → 15s + armes 150% |
| 4 | 15000 | Pendant immunité : kills donnent 2× XP |
| 5 | 60000 | Immunité : 15s → 30s + armes 200% + 2× XP + 2× mithril |

### TRANSGRESSION — "L'Apothéose du Martyr"

- **Coût** : 150 000 kills famille défensive cumulés.
- **Effet** : **déclenchement manuel du stun à volonté**, cooldown 30s.
  - Le stun déclenché manuellement saute la phase "armes à 50%".
  - Il déclenche directement l'onde (avec tous les paliers RÉACTION) suivie de l'immunité (avec tous les paliers DISCIPLINE).
- **UI** : bouton "Apothéose" en bas de l'écran avec cooldown circulaire.
- **Identité narrative** : le perso a maîtrisé la submersion au point d'en faire sa volonté.

C'est la première mécanique active du jeu hors mini-jeu/instance. À assumer comme rupture méritée.

---

## 7. Identité visuelle du Bouclier en Idle

> **Section à compléter en session suivante.** Les 4 questions clés (forme de base, couleur dominante, motif/élément central, code couleur par branche) restent ouvertes au moment de la rédaction de ce doc.

### Cadre actuel acté

- **Forme de base** : à définir (cercle au sol / anneau orbital / forme tenue / aura sphérique).
- **Couleur de base** : à définir (bleu acier / or terni / blanc ivoire / gris ardoise).
- **Motif central** : à définir (symbolique / fonctionnel / textural / minimaliste).
- **Code couleur par branche** : à définir (séparer Forteresse/Aura/Riposte ou pas).
- **Palette globale** : médiéval fantasy (or terni, rouge brique, vert mousse, bleu minuit) — pas néon.

### Principes à respecter

- Le bouclier a une **présence visuelle permanente** (le joueur voit l'arme équipée même entre deux pulses).
- Chaque palier d'arme doit **modifier visiblement** la présence (le joueur voit immédiatement la transformation après un palier débloqué).
- Les paliers visuels de trempage T10 et T50 du bouclier (déjà actés en pile A) **amplifient** cette identité sans la remplacer.

---

## 8. Roadmap d'implémentation

### v0.9 — Système de submersion (transversal) — ✅ FAIT

1. Mécanique de submersion en idle (jauge, stun, onde, immunité).
2. UI : jauge, overlay stun, halo immunité.
3. Tests : se faire stun au tier 30+ idle sans build défensif.

### v0.10 — Bouclier équipable (sans donjon ni mini-jeu)

4. Bouclier débloqué en mode dev pour tests.
5. 3 branches Forteresse / Aura / Riposte avec les 15 paliers.
6. Identité visuelle de base (section 7 à finaliser avant).
7. Tuning du feel.

### v0.11 — Architecture mini-jeux

8. Composant `MiniGameRunner` générique.
9. Routage `currentMode: 'idle' | 'instance' | 'altar' | 'minigame'`.
10. Système de difficulté paramétrique.

### v0.12 — Mini-jeu Pong "Le Rempart"

11. Implémentation du mini-jeu.
12. Calibration de la difficulté.
13. Clef du Cloître (drop tier 20).
14. Récompense : déblocage bouclier.

### v0.13 — Intégration mini-jeu/autel

15. Modification de l'autel pour proposer "jouer le mini-jeu d'abord ?".
16. Stockage du bonus +15% (non stockable, consommé au prochain tirage).
17. UI : afficher le bonus actif quand présent.

### v0.14 — Arbre de famille défensive

18. Système d'arbre de famille (kills cumulés, UI dédiée).
19. 3 branches Résilience / Réaction / Discipline.
20. Effets actifs en jeu.

### v0.15 — Apothéose (transgression)

21. Bouton manuel de déclenchement stun.
22. Cooldown.
23. Tests endgame.

---

## 9. Risques et points d'attention

### Le mini-jeu doit être bon à jouer

C'est l'élément le plus risqué du système. Si le mini-jeu est ennuyeux ou frustrant, *toute* la mécanique de boost de trempage devient inutilisée. **Itérer le feel** du mini-jeu avant tout le reste. Si le pong du bouclier n'est pas plaisant à jouer en 1 minute, retravailler.

### La difficulté scalée doit rester satisfaisante

À très haut palier (200+), le mini-jeu devient extrême. **S'assurer qu'il reste réussissable** par un joueur skillé. Sinon, ça devient une mécanique "que les hardcore peuvent toucher", ce qui contredit la philo "satisfaisant pour tout le monde".

### Le rythme global mode idle / mini-jeu / mode idle

Le joueur va alterner. Si chaque trempage demande un mini-jeu, le rythme du jeu devient haché. Le joueur doit pouvoir **choisir d'ignorer le mini-jeu** sans perte significative. Le +15% est important mais pas vital — c'est ce qui rend le système opt-in plutôt qu'obligatoire.

### L'UI devient riche

Jauges multiples (kills, XP, mithril, clefs, submersion, immunité, bonus mini-jeu), boutons d'actions (Apothéose), modes de jeu différents. **Prévoir un audit UI** à la fin du dev pour s'assurer que tout est lisible, surtout sur mobile.

### Le bouclier risque d'être *meta* anti-submersion en idle

Tant que d'autres armes 1-main défensives ne sont pas introduites, le bouclier monopolise l'arbre de famille défensive. Pas grave, mais à surveiller — peut-être prévoir une 2e arme défensive simple plus tôt que prévu (genre un gantelet à pointes ?) pour rendre l'arbre vivant.

---

## 10. Questions ouvertes

1. Section 7 (identité visuelle bouclier en idle) à compléter en session suivante.
2. Re-drop des Clefs d'arme après échec du mini-jeu de déblocage : drop garanti au tier suivant ? Drop rare en idle ? À trancher.
3. Visuel exact des PNJ dans le pong (moines, silhouettes, icônes) : à décider quand on attaquera le mini-jeu.
4. Format des autres mini-jeux d'armes (arc, baguette, grimoire) : à designer ultérieurement, chacun étant une session à part entière.
5. Cohérence du système Apothéose avec l'identité "idle observable" : à valider en jeu réel, possible à ajuster.
