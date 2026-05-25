# Chill Warriors — Pack Bouclier v0.1

> Livrable de session. Contient : (1) système de submersion, (2) arbre de l'arme bouclier mis à jour, (3) donjon du Sanctuaire en Ruine, (4) template générique de donjon d'arme, (5) première fiche d'arbre de famille — "1-main défensive".

---

## 1. Système de Submersion (transversal — idle + instance)

Nouveau système global. Remplace l'absence de menace en mode idle. Ne crée pas de game over.

### Mécanique de base

```
ÉTAT NORMAL
  → la jauge de submersion monte de +1 par hit subi (contact mob → perso)
  → la jauge décroît automatiquement de -2/s quand aucun mob ne touche le perso
  → seuil de stun : 100 points
  → UI : jauge visible sous le compteur kills/HP, change de couleur :
      0-49%   : blanc
      50-79%  : ambre
      80-99%  : rouge clignotant

STUN (atteinte 100% submersion)
  → durée : 10s
  → armes du perso à 50% efficacité (vitesse de tir / rotation / cadence)
  → aucun XP gagné pendant le stun
  → aucun mithril gagné pendant le stun (en instance)
  → visuel : overlay gris léger sur l'écran, étoiles confuses au-dessus du perso
  → la jauge reste à 100 pendant toute la durée

FIN DE STUN (après 10s)
  → ONDE DE CHOC automatique
  → rayon : 300px depuis le perso
  → knockback : pousse tous les mobs au bord de l'onde
  → dégâts : 0 (base) — peut être augmenté par l'arbre de famille
  → visuel : onde concentrique blanche/dorée qui pulse
  → reset jauge à 0
  → ouvre fenêtre d'immunité

IMMUNITÉ POST-STUN (5s)
  → la jauge ne peut pas monter
  → le perso ne peut pas être à nouveau stun
  → visuel : léger halo doré autour du perso
  → après 5s : retour à l'état normal
```

### Constantes dans `balance.ts`

```ts
submersion: {
  thresholdStun: 100,
  hitContribution: 1,         // +1 par contact mob/perso (mob avec contact = +1/s)
  decayPerSec: 2,             // -2/s quand pas de contact
  stunDurationMs: 10000,
  stunWeaponEfficiency: 0.5,  // armes à 50% pendant stun
  endOfStunWaveRadius: 300,
  endOfStunWaveDamage: 0,
  endOfStunWaveKnockback: 250,
  immunityDurationMs: 5000,
},
```

### Implications

- **En mode idle** : le joueur peut se faire stun s'il laisse les vagues le déborder. Pertinent surtout aux hauts tiers de difficulté (40+) où les mobs deviennent denses.
- **En instance** : pertinent dès les premières vagues. Le bouclier excelle, les armes purement offensives doivent kill assez vite.
- **Pour la branche Riposte du bouclier** : tous ses paliers gagnent un sens partout (idle + instance), parce que la submersion existe partout.

---

## 2. Arbre du Bouclier (mise à jour intégrale)

**Identité de l'arme** : Anti-submersion. Empêche les mobs de se rapprocher / les punit / contrôle la zone autour du perso.

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

**Comportement de base** : à chaque cycle de `bashCooldownMs`, tous les mobs dans `bashRadius` autour du perso prennent `bashDamage` et sont repoussés de `knockbackForce` px. Pas de projectile, pas de rotation.

### Branche FORTERESSE (zone de contrôle)

**Identité** : Empêcher les mobs de s'approcher. Anti-submersion par exclusion.

| Tier | Coût | Stats | Effet spécial | Visuel |
|------|------|-------|---------------|--------|
| 1 | 15 | bashRadius → 70, knockback → 50 | — | Onde visible au bash |
| 2 | 75 | bashRadius → 95, knockback → 75 | — | Onde plus marquée |
| 3 | 350 | bashRadius → 130, knockback → 110 | — | Anneau de force pulsé |
| 4 | 1500 | bashRadius → 170, knockback → 160 | **Bash continu** : poussage permanent à faible force | Onde de pression continue |
| 5 | 6000 | bashRadius → 220, knockback → 240 | **Citadelle** : aucun mob ne peut entrer dans le rayon (mur invisible) | Dôme de lumière translucide |

### Branche AURA (DPS passif de zone)

**Identité** : Tuer les mobs avant qu'ils ne s'amassent. Anti-submersion par attrition.

| Tier | Coût | Stats | Effet spécial | Visuel |
|------|------|-------|---------------|--------|
| 1 | 15 | auraRadius → 80, auraDps → 1 | Aura passive active | Halo bleuté autour du perso |
| 2 | 75 | auraRadius → 110, auraDps → 3 | — | Halo plus visible, particules |
| 3 | 350 | auraRadius → 150, auraDps → 8 | — | Aura crépitante, éclairs visibles |
| 4 | 1500 | auraRadius → 200, auraDps → 20 | **Stun** : 5% chance par tick de stun 200ms les mobs | Flash blanc sur mobs stun |
| 5 | 6000 | auraRadius → 260, auraDps → 50 | **Tempête statique** : éclairs auto vers mobs random toutes les 100ms | Foudres permanentes, perso comme un Tesla |

### Branche RIPOSTE (contre-attaque)

**Identité** : Le contact avec le perso est puni. Anti-submersion par dissuasion.

**Note** : grâce au système de submersion, cette branche fonctionne désormais partout (idle + instance), pas juste en instance.

| Tier | Coût | Stats | Effet spécial | Visuel |
|------|------|-------|---------------|--------|
| 1 | 15 | bashDamage → 5 | — | Flash blanc au bash |
| 2 | 75 | bashDamage → 12, bashCooldownMs → 700 | — | Bash plus visible, screen shake léger |
| 3 | 350 | bashDamage → 30, bashCooldownMs → 600 | **Reflect** : 25% des hits qui auraient incrémenté la jauge de submersion sont annulés ET renvoyés en dégâts au mob | Flash de déviation sur reflect |
| 4 | 1500 | bashDamage → 70, bashCooldownMs → 500 | **Punition** : un mob qui touche le perso a 30% chance d'être instakill (dans la limite de HP × 5) — la jauge ne monte pas pour ce hit | Explosion blanche sur mob puni |
| 5 | 6000 | bashDamage → 200, bashCooldownMs → 400 | **Sentence divine** : à chaque kill par bash, un éclair fend le ciel et frappe 3 mobs random sur l'écran | Éclairs verticaux, screen shake fort |

---

## 3. Donjon du Bouclier — "Le Sanctuaire en Ruine"

### Pitch

> Un ancien temple médiéval, voûtes brisées, vitraux fendus, autels couverts de poussière. Les moines qui y prient sont assiégés par une horde de profanateurs armés de fronde et de gourdins. Le perso, bouclier en main, doit aller de salle en salle protéger les survivants jusqu'à atteindre le sanctuaire central.

### Format général

- **6 salles** au total (5 + boss).
- **Durée cible** : 4-6 minutes pour un run réussi.
- Réservé à l'arme **bouclier** uniquement (vérification à l'entrée).
- Récompense : déblocage permanent du bouclier + 50 mithril bonus à la complétion.

### Mécanique commune à toutes les salles

À l'entrée de chaque salle :

1. Vue d'ensemble de la salle (1-2s de "découverte" — tu vois les PNJ à défendre, les portails d'arrivée des projectiles, les chemins des mêlée).
2. **Choix de placement** : un curseur apparaît, le joueur clique où il veut planter le perso. Pas de déplacement après ce clic (cohérent avec "perso fixe").
3. Démarrage de la salle. Le combat se joue à l'observation.
4. La salle est validée quand **tous les ennemis sont morts** ET **au moins X PNJ ont survécu** (X varie par salle, voir détail).
5. Si tous les PNJ meurent → run échoué, autel apparaît quand même (récup le mithril gagné), mais pas de déblocage du bouclier.

### Détail des salles

#### Salle 1 — "Le Parvis" (intro / tutoriel)

**Layout** : couloir simple en ligne droite. 2 PNJ (moines) au fond. Projectiles arrivent depuis l'entrée à un rythme lent (1 toutes les 2s).

**Ennemis** : 0 mêlée. Juste les frondeurs au loin (invisibles, hors écran, lancent des projectiles).

**Objectif** : protéger les 2 PNJ pendant 30s. Tous les projectiles doivent être bloqués par le bouclier.

**Condition de victoire** : 30s écoulées + 2/2 PNJ vivants.

**Apprentissage** : le joueur comprend que **bash bloque les projectiles** au passage de la rotation/aura.

#### Salle 2 — "La Nef"

**Layout** : grande pièce ouverte. 4 PNJ alignés au fond. Projectiles depuis 2 ouvertures latérales.

**Ennemis** : 5 mêlée arrivent par vagues (3 puis 2). Vitesse moyenne, peu de HP.

**Objectif** : 4 PNJ à protéger, projectiles + mêlée combinés.

**Condition de victoire** : tous les mêlée morts + au moins 3/4 PNJ vivants.

**Apprentissage** : le joueur comprend que **les mêlée collés au bouclier prennent des dégâts continus** (effet "épines"). Bonne position = près des PNJ pour bloquer les projectiles, mais avec assez d'angle pour que les mêlée viennent toucher le bouclier.

#### Salle 3 — "Le Cloître"

**Layout** : pièce circulaire avec 3 PNJ au centre. Projectiles arrivent depuis 3 directions différentes simultanément.

**Ennemis** : 4 mêlée plus rapides + 2 archers proches qui tirent par-dessus.

**Objectif** : positionnement critique — un seul placement doit gérer 3 angles de projectiles.

**Condition de victoire** : tous ennemis morts + 2/3 PNJ vivants.

**Apprentissage** : le joueur teste vraiment le rayon de bash. Une Forteresse à T2+ aide énormément.

#### Salle 4 — "La Chapelle"

**Layout** : longue salle étroite. 1 seul PNJ central à protéger ABSOLUMENT (un grand prêtre, hyper vulnérable).

**Ennemis** : 8 mêlée qui chargent en vague continue + projectiles intermittents.

**Objectif** : tenir le bouclier juste devant le prêtre pendant 45s. Submersion garantie si pas de gestion.

**Condition de victoire** : 45s + 1/1 PNJ vivant.

**Apprentissage** : test du stress de submersion. Un joueur bien équipé Aura tient. Un build pur Forteresse repousse. Un build Riposte punit. *Tous les builds peuvent passer la salle, mais différemment.*

#### Salle 5 — "Le Transept"

**Layout** : grande salle à 4 entrées (croix). 4 PNJ aux 4 coins (un par bras de croix).

**Ennemis** : projectiles depuis les 4 entrées + 10 mêlée qui arrivent par vagues alternées.

**Objectif** : impossible de protéger les 4 PNJ avec un seul placement. Le joueur doit choisir lequel sacrifier.

**Condition de victoire** : tous ennemis morts + 2/4 PNJ vivants.

**Apprentissage** : décision tactique. Apprentissage que le succès ne nécessite pas la perfection — 2/4 suffit.

#### Salle 6 (BOSS) — "Le Sanctuaire"

**Layout** : grande salle ouverte avec un grand autel central. Le PNJ-Patriarche (très vulnérable) y est attaché.

**Mécanique boss** :

- Phase 1 (0-30s) : projectiles depuis 6 directions à rythme modéré + 5 mêlée par vague.
- Phase 2 (30-60s) : projectiles depuis 4 directions à rythme rapide + 8 mêlée par vague + apparition de **Champions** (mêlée tankys 50 HP).
- Phase 3 (60s+) : tous angles simultanément + frénésie. Tient jusqu'à 90s totales.

**Pas de boss "entité"**. Le boss = la salle elle-même. Toute l'identité est dans la simultanéité.

**Condition de victoire** : tenir 90s + Patriarche vivant.

**Récompense de complétion** :

- **Bouclier débloqué définitivement** dans le roster du joueur.
- 50 mithril bonus.
- Le joueur peut maintenant équiper le bouclier dans le mode idle et déclencher des Clefs de Mine via lui.

### Échec du donjon

Si la condition d'une salle échoue (trop de PNJ morts) :

- Pas de "game over" — le run est échoué mais on continue jusqu'à la fin du donjon avec les autres salles (apprentissage).
- À la fin, l'autel apparaît, le joueur récupère le mithril collecté, mais **le bouclier reste verrouillé**.
- La Clef d'arme **est consommée** (acté : clef à usage unique).
- Pour réessayer, le joueur doit re-drop une Clef du Sanctuaire (drop garanti au tier 20 idle, mais s'il l'a raté, il doit attendre le tier suivant ou bien on prévoit un système de re-drop).

**Recommandation** : la clef d'arme doit pouvoir re-drop si on rate. Soit elle se redrop au tier suivant (tier 25 par ex.), soit on accepte un drop rare en idle comme filet de sécurité. À trancher plus tard.

---

## 4. Template Générique de Donjon d'Arme

Extrait du donjon du bouclier, généralisable à toutes les futures armes débloquables.

### Format type

- **5 à 6 salles** (5 + 1 boss-room).
- **Durée cible** : 4-6 minutes.
- **Réservé à l'arme thématique** (entrée bloquée pour les autres armes).
- **Récompense** : déblocage permanent de l'arme + ~50 mithril bonus.

### Structure de salle commune

Chaque salle suit ce gabarit :

1. **Phase de découverte** (1-2s) : le joueur voit la salle, comprend ses contraintes.
2. **Phase de placement** : le joueur clique où il pose son perso (cohérent avec "perso fixe" — pas de mouvement après clic).
3. **Phase de combat** : observation pure, le joueur regarde son build/placement fonctionner.
4. **Phase de validation** : conditions de victoire spécifiques.

### Variables par arme

Ce qui change d'un donjon à l'autre :

- **Objectif de salle** : varie selon ce que l'arme valorise.
  - Bouclier : défendre des PNJ contre projectiles.
  - Arc : abattre des cibles à distance avant qu'elles n'atteignent un point.
  - Baguette de feu : brûler des zones à temps avant qu'elles ne se rétablissent.
  - Grimoire : "marquer" des cibles que les spectres doivent achever (le perso ne tue pas directement).
- **Type de placement** : varie selon l'arme.
  - Bouclier : placement central pour couvrir les angles de projectiles.
  - Arc : placement avec ligne de vue dégagée vers les cibles.
  - Baguette : placement à distance des explosions pour ne pas se prendre les retours.
  - Grimoire : placement central pour que les spectres aient un rayon d'action.
- **Type de boss** : pas un "monstre tanky", mais **une salle finale plus dense** qui pousse les limites de la mécanique.

### Squelette de fichier `INSTANCE_<ARME>_DUNGEON.md`

À créer pour chaque arme débloquable. Format :

```markdown
# Donjon de [ARME] — "[NOM POÉTIQUE]"

## Pitch narratif
[2-3 phrases]

## Récompense
- Arme débloquée
- X mithril bonus

## Salle 1 — [Nom]
- Layout : ...
- Objectif : ...
- Ennemis : ...
- Condition de victoire : ...
- Apprentissage : ...

## Salle 2 — [Nom]
[...]

## Salle 6 (BOSS) — [Nom]
[3 phases]
```

---

## 5. Arbre de Famille — "1-main Défensive"

### Pitch identitaire

> La famille 1-main défensive est celle des **maîtres de la submersion**. Pas seulement la subir, mais la *transformer en arme*. Plus tu es expérimenté à te faire stun, plus ton corps apprend à canaliser le chaos pour le retourner contre tes ennemis.

### Activation

L'arbre de famille s'alimente des **kills cumulés de toutes les armes 1-main défensives équipées**. Pour l'instant, seul le bouclier compte. Quand d'autres armes 1-main défensives seront ajoutées, leurs kills compteront aussi.

L'arbre s'ouvre **dès qu'une arme 1-main défensive est équipée pour la première fois** (donc dès que le bouclier est débloqué via son donjon).

### Structure générale

- **3 branches** de progression parallèle, comme les arbres d'arme.
- **5 paliers par branche** — mais coûts **multipliés par 10** par rapport aux arbres d'arme (un arbre de famille est un investissement long terme).
  - Coûts : **150 / 750 / 3500 / 15000 / 60000** kills.
- **Au sommet de l'arbre** : la **TRANSGRESSION**, palier ultime qui dépasse les 3 branches.
  - Coût : **150 000 kills** (équivalent à monter le bouclier de 0 à T5 sur 3 voies, plus 4-5 trempages).
  - Identité : règle du jeu cassée, expérience transformée.

### Les 3 branches

Toutes les branches travaillent autour du système de submersion.

#### Branche RÉSILIENCE (la jauge monte moins vite)

**Identité** : "Tes ennemis te touchent, mais ton corps absorbe le chaos."

| Tier | Coût | Effet | Visuel |
|------|------|-------|--------|
| 1 | 150 | Décroissance auto de la jauge : -2/s → -4/s | Particules ambrées qui s'évaporent du perso |
| 2 | 750 | hitContribution : +1 par hit → +0.7 par hit | Légère résistance visible aux impacts |
| 3 | 3500 | Seuil de stun : 100 → 130 (plus haute marge) | Aura grise stabilisante |
| 4 | 15000 | Décroissance auto : -4/s → -8/s | Le perso "exhale" les hits |
| 5 | 60000 | hitContribution : +0.7 → +0.4 (presque immunisé) | Aura argentée permanente |

#### Branche RÉACTION (l'onde de fin de stun gagne en puissance)

**Identité** : "Quand tu reviens à toi, tout ce qui t'a fait tomber explose."

| Tier | Coût | Effet | Visuel |
|------|------|-------|--------|
| 1 | 150 | Onde : rayon 300 → 400px | Onde plus visible |
| 2 | 750 | Onde inflige des dégâts (= 50 × niveau total des armes équipées) | Onde colorée selon l'arme |
| 3 | 3500 | Onde knockback 250 → 400px | Onde violente, mobs envoyés loin |
| 4 | 15000 | Onde inflige aussi un **DoT au sol** : zone de 200px qui brûle pendant 5s (10 dps) | Sol fissuré et lumineux après l'onde |
| 5 | 60000 | Onde devient **récurrente** : 3 vagues successives à 1s d'intervalle, chacune avec ses propres dégâts/knockback | Triple éclat, écran qui pulse 3 fois |

#### Branche DISCIPLINE (immunité post-stun étendue, perso en mode "ascendant")

**Identité** : "Après le chaos, tu deviens intouchable. Tu *règnes*."

| Tier | Coût | Effet | Visuel |
|------|------|-------|--------|
| 1 | 150 | Durée d'immunité post-stun : 5s → 8s | Halo doré post-stun |
| 2 | 750 | Pendant l'immunité : armes à 120% efficacité (vitesse + dégâts +20%) | Le perso "rayonne" |
| 3 | 3500 | Durée immunité : 8s → 15s + armes à 150% pendant cette durée | Aura plus intense |
| 4 | 15000 | Pendant l'immunité : tous les kills donnent 2× XP | Particules dorées sur chaque kill |
| 5 | 60000 | Durée immunité : 15s → 30s + armes à 200% + 2× XP + 2× mithril | Le perso devient *littéralement* un astre — luminosité aveuglante, fond d'écran modifié |

### TRANSGRESSION (palier ultime)

**Coût** : 150 000 kills sur la famille 1-main défensive (cumulés toutes armes confondues).

**Nom** : *"L'Apothéose du Martyr"*

**Effet** : Tu peux désormais **déclencher manuellement le stun** via un bouton dédié (cooldown 30s entre chaque déclenchement). Le stun déclenché manuellement saute la phase "armes à 50%" — il n'a que l'onde de fin de stun (renforcée par tes paliers de la branche RÉACTION), suivi de l'immunité (renforcée par DISCIPLINE).

Concrètement : **le joueur peut désormais déclencher une vague de stun à volonté tous les 30s**, transformant la submersion en *capacité offensive contrôlée*. Le martyr involontaire devient un berserker conscient.

**Visuel** : nouvelle UI — bouton "Apothéose" en bas de l'écran, cooldown circulaire, animation d'invocation à la mort/réveil quand le joueur clique.

**Identité narrative** : "Le perso a tellement maîtrisé la submersion qu'il en a fait sa volonté. Il choisit son chaos."

---

## 6. Implications globales

### Changements requis dans `balance.ts`

1. Nouvel objet `submersion` (constantes du système).
2. Mise à jour du `shield` (effets de Riposte qui réfèrent la submersion).
3. Nouvelle structure `families` pour l'arbre de famille :

```ts
families: {
  oneHandDefensive: {
    branches: {
      resilience: { thresholds: [150, 750, 3500, 15000, 60000], tiers: [...] },
      reaction:   { thresholds: [150, 750, 3500, 15000, 60000], tiers: [...] },
      discipline: { thresholds: [150, 750, 3500, 15000, 60000], tiers: [...] },
    },
    transgression: { threshold: 150000, ... },
  },
},
```

4. Nouveau slot dans `lib/store.ts` :

```ts
familyProgression: {
  oneHandDefensive: {
    kills: 0,                  // cumul global de cette famille
    tiers: { resilience: 0, reaction: 0, discipline: 0 },
    transgressionUnlocked: false,
  },
}
```

### Changements requis dans le code combat

- `game/tick.ts` : nouveau système de submersion à appliquer à chaque frame quand le perso est en contact avec un mob.
- Nouvelle entité `SubmersionState` dans le `World` : `{ value: number, stunUntil: number, immunityUntil: number }`.
- Quand `stunUntil` est dépassé → déclencher l'onde + reset jauge + set `immunityUntil`.
- L'onde elle-même applique knockback à tous les mobs dans `endOfStunWaveRadius`.

### Nouveau composant UI

- `SubmersionGauge` : jauge en bas du perso, change de couleur selon le niveau.
- `StunOverlay` : overlay gris discret pendant le stun.
- `ImmunityHalo` : halo doré pendant l'immunité post-stun.
- (Plus tard, post-transgression) `ApotheosisButton` : bouton de déclenchement manuel.

### Nouveau composant `DungeonRoom`

- Pour gérer le donjon du bouclier (et les futurs).
- Affiche la salle, les PNJ, les portails de projectiles, l'UI de placement.
- Logique d'attente du clic de placement avant de démarrer la salle.

### Nouveau type d'entité

- **PNJ allié** : statique, vulnérable, avec ses propres HP. Ne combat pas. Si tous les PNJ d'une salle meurent → échec de la salle.

---

## 7. Roadmap d'implémentation suggérée

Vu la taille du chantier, je suggère ce découpage :

### v0.9 — Le système de submersion (chantier transversal)

1. Système de submersion en mode idle (jauge, stun, onde, immunité).
2. UI : `SubmersionGauge`, `StunOverlay`, `ImmunityHalo`.
3. Tests : le joueur peut se faire stun en idle aux hauts tiers de difficulté.

### v0.10 — Le bouclier (sans donjon encore)

4. Implémentation du bouclier comme arme équipable (mais débloquée d'office en mode dev pour tests).
5. Branches Forteresse / Aura / Riposte avec leurs paliers.
6. Tuning du feel : le bouclier doit être *visiblement différent* des armes offensives.

### v0.11 — Le donjon du Sanctuaire

7. Système générique de donjon (rooms, placement, PNJ).
8. Les 6 salles du Sanctuaire en Ruine.
9. Clef du Sanctuaire (drop garanti tier 20 idle).
10. Récompense : déblocage du bouclier en jeu normal.

### v0.12 — Arbre de famille défensive

11. Système d'arbre de famille (kills cumulés, branches, paliers).
12. UI dédiée pour l'arbre de famille (nouveau panneau).
13. Effets des 3 branches Résilience / Réaction / Discipline.

### v0.13 — Transgression (Apothéose)

14. Mécanique de déclenchement manuel.
15. UI du bouton Apothéose.
16. Tests d'équilibrage end-game.

Chaque jalon est testable indépendamment. La plus grosse pièce est probablement v0.9 (submersion transversale) parce qu'elle impacte tous les modes du jeu.

---

## 8. Risques et points d'attention

### Le risque "submersion frustrante en idle"

Si la jauge monte trop vite en idle (haute tier), le joueur va se sentir piégé. **Tuner** la décroissance et la contribution avec soin. Recommandation : la submersion en mode idle ne devrait jamais arriver avant le **tier 30** au minimum sans build défensif. C'est une menace de fin-de-progression idle, pas un piège constant.

### Le risque "trop d'UI"

On a déjà : jauge HP (instance), compteur kills, compteur mithril, jauge XP de branche, jauge clefs, jauges arbres de famille... Et maintenant submersion. **L'UI mobile** va devenir difficile. Prévoir un **mode compact** où certaines jauges fusionnent ou se masquent quand elles sont à 0.

### Le risque "déséquilibre du bouclier"

Vu que le bouclier excelle anti-submersion ET que la submersion est partout, on pourrait craindre qu'il devienne *meta* en idle. Pas grave en soi (pas d'équilibrage), mais le joueur qui découvre le bouclier va peut-être abandonner les autres armes. **Mitigation** : les patterns de vagues variés (déjà actés) garantissent que d'autres armes brillent sur d'autres situations (un build full Aura ne tue pas vite, donc inefficace sur "élite isolé tanky").

### Le risque "donjon trop long"

6 salles + boss = potentiellement 6 minutes de placement + observation. Si une salle dure 90s + transitions, ça monte vite. **Tuner** les durées de salle pour viser 30-60s chacune en moyenne, et 90s sur le boss.

### Le système de PNJ qui meurent

Quand un PNJ meurt, le joueur ressent-il un échec ou un soulagement ("ouf, je peux ignorer ce coin maintenant") ? **Concept clé** : un PNJ qui meurt doit donner une sensation de perte. Visuel marquant (animation de chute, son distinct, peut-être pénalité de mithril ?). Sinon la mécanique perd son enjeu.

---

## 9. Hors-scope explicite de ce livrable

- Implémentation des sons (reportée comme acté).
- Animations détaillées des PNJ alliés (silhouettes simples suffisent pour v0.11).
- Autres familles que défensive (à voir au cas par cas plus tard).
- Donjons des autres armes (template fourni, contenu à designer).
- Boss à plusieurs phases narratives (notre boss = salle dense, pas entité — peut évoluer plus tard).

---

## 10. Questions encore ouvertes

1. **Que se passe-t-il si le joueur rate le donjon ?** La Clef du Sanctuaire est consommée. Doit-on prévoir un drop garanti au tier suivant ou un re-drop possible ?
2. **Combien de PNJ exactement par salle ?** Les chiffres proposés sont indicatifs, à tuner après tests.
3. **Visuel des PNJ alliés** : silhouettes de moines / icônes / cercles "PNJ" simples ? Le donjon doit avoir une atmosphère, pas être abstrait.
4. **Les projectiles dans le donjon — sont-ils visibles depuis l'origine ou apparaissent-ils au bord de la salle ?** Préfèrer visible (le joueur anticipe).
5. **L'Apothéose et le déclenchement manuel** : cohérent avec "idle observable" ? C'est la seule mécanique active de tout le jeu hors instances. À assumer.

Ces questions ne bloquent pas l'implémentation mais sont à trancher au moment du code.
