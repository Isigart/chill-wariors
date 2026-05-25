# Chill Warriors — Arbres d'armes (catalogue v0.3+)

> Suite du `SWORD_TREE.md`. Même modèle : 3 branches × 5 paliers par arme, paliers 1-3 = montée propre, palier 4 = effet qualitatif nouveau, palier 5 = transformation finale.

Courbe d'XP par défaut : **15 / 75 / 350 / 1500 / 6000** kills.

---

## ARC — famille **distance** (starter)

**Identité** : projectiles à longue portée, tir automatique vers le mob le plus proche. L'arc ne tape pas en mêlée — il *cherche* des cibles. Build d'archer.

**Stats de base** :

```ts
bow: {
  base: {
    range: 400,              // portée max d'engagement (px)
    arrowSpeed: 350,         // vitesse du projectile (px/s)
    fireRateMs: 600,         // temps entre tirs
    damage: 1,
    arrowsPerShot: 1,        // nombre de flèches par tir
    pierceCount: 0,          // 0 = la flèche disparaît au premier hit
  },
}
```

**Comportement de base** : à chaque tick, si `fireRateMs` est écoulé depuis le dernier tir, l'arc cible le mob le plus proche dans `range` et tire une flèche en ligne droite vers sa position au moment du tir (pas de homing).

### Branche CADENCE (tirs rapides)

**Identité** : volume de feu, l'arc devient une mitrailleuse.

| Tier | Coût | Effet stat | Effet spécial | Visuel |
|------|------|-----------|---------------|--------|
| 1 | 15 | fireRateMs → 450 | — | Cadence visiblement plus rapide |
| 2 | 75 | fireRateMs → 320 | — | Flèches plus fines, trail jaune court |
| 3 | 350 | fireRateMs → 200 | — | Trail allongé, son de corde permanent |
| 4 | 1500 | fireRateMs → 130 | **Double-tap** : chaque tir lâche 2 flèches successives (30ms d'écart) | Effet "rafale" visuel |
| 5 | 6000 | fireRateMs → 80 | **Tempête de flèches** : flèches en continu, pluie qui couvre l'écran | Arc en plasma bleu, le carquois est visuellement épuisé en permanence |

### Branche PERFORATION (flèches qui traversent)

**Identité** : la flèche ne s'arrête plus, traverse les mobs, ramasse des kills en chaîne. Build "ligne droite mortelle".

| Tier | Coût | Effet stat | Effet spécial | Visuel |
|------|------|-----------|---------------|--------|
| 1 | 15 | pierceCount → 1 | La flèche traverse 1 mob avant disparition | Trail légèrement plus net |
| 2 | 75 | pierceCount → 3, damage → 2 | — | Flèches plus longues, trail blanc |
| 3 | 350 | pierceCount → 6, damage → 4 | — | Flèches lumineuses, mini flash à chaque traversée |
| 4 | 1500 | pierceCount → 10, damage → 8 | **Onde de choc** : chaque mob traversé prend +50% dmg supplémentaire les 200ms suivants | Onde de pression visible derrière la flèche |
| 5 | 6000 | pierceCount → ∞, damage → 20 | **Rayon perçant** : la flèche traverse TOUT l'écran et tous les mobs alignés | Faisceau de lumière dorée plutôt qu'une flèche, trail qui persiste 500ms |

### Branche MULTI-SHOT (volume)

**Identité** : plusieurs flèches par tir, en éventail. Build "couverture de zone".

| Tier | Coût | Effet stat | Effet spécial | Visuel |
|------|------|-----------|---------------|--------|
| 1 | 15 | arrowsPerShot → 2 (éventail 15°) | — | 2 flèches qui partent en V |
| 2 | 75 | arrowsPerShot → 3 (éventail 25°) | — | 3 flèches, éventail clair |
| 3 | 350 | arrowsPerShot → 5 (éventail 40°) | — | Volée visible, son distinct |
| 4 | 1500 | arrowsPerShot → 7 (éventail 60°) | **Tir homing** : 1 flèche sur 7 cherche activement une cible (homing léger) | La flèche homing a un trail rouge distinct |
| 5 | 6000 | arrowsPerShot → 12 (360°) | **Éventail total** : tir circulaire complet à chaque shoot, couvre tout l'écran | Cercle de flèches qui pulse depuis le perso, animation de tension de l'arc en arrière-plan |

---

## BAGUETTE DE FEU — famille **magique** (starter)

**Identité** : projectiles magiques à zone d'impact. Contrairement à l'arc qui tape ponctuel, la baguette fait des dégâts de **zone**. Build de mage AoE.

**Stats de base** :

```ts
fireWand: {
  base: {
    range: 320,
    projectileSpeed: 280,
    fireRateMs: 900,
    damage: 3,
    explosionRadius: 50,     // rayon de l'impact AoE
    burnDurationMs: 0,       // pas de burn de base
    burnDps: 0,
  },
}
```

**Comportement de base** : tire un projectile enflammé vers le mob le plus proche. À l'impact, **explose en zone** et touche tous les mobs dans `explosionRadius`. Cadence lente mais dégâts de zone.

### Branche INFERNO (puissance brute)

**Identité** : les explosions deviennent énormes et catastrophiques. Build "boom".

| Tier | Coût | Effet stat | Effet spécial | Visuel |
|------|------|-----------|---------------|--------|
| 1 | 15 | damage → 6, explosionRadius → 65 | — | Flammes plus vives à l'impact |
| 2 | 75 | damage → 12, explosionRadius → 85 | — | Particules de braises qui persistent |
| 3 | 350 | damage → 25, explosionRadius → 110 | — | Explosion stylisée, onde de chaleur visible |
| 4 | 1500 | damage → 50, explosionRadius → 140 | **Onde secondaire** : 200ms après l'impact, 2e explosion à 50% dmg | Double flash, fumée volumétrique |
| 5 | 6000 | damage → 120, explosionRadius → 180 | **Météore** : le projectile devient un météore qui tombe du ciel, dégâts énormes, screen shake max | Météore qui chute avec ombre au sol qui grandit avant impact |

### Branche BRASIER (DoT et burn)

**Identité** : les mobs touchés brûlent et meurent dans le temps. Build "sois patient et regarde l'écran cramer".

| Tier | Coût | Effet stat | Effet spécial | Visuel |
|------|------|-----------|---------------|--------|
| 1 | 15 | burnDurationMs → 1500, burnDps → 1 | Mobs touchés brûlent 1.5s | Petite flamme sur les mobs en feu |
| 2 | 75 | burnDurationMs → 2500, burnDps → 3 | — | Flammes plus grosses, lueur orange |
| 3 | 350 | burnDurationMs → 4000, burnDps → 8 | — | Flammes léchant entièrement les mobs |
| 4 | 1500 | burnDurationMs → 6000, burnDps → 20 | **Propagation** : un mob qui meurt en burning propage le feu aux mobs dans 60px | Effet de "réaction en chaîne" visible |
| 5 | 6000 | burnDurationMs → 10000, burnDps → 50 | **Enfer permanent** : le sol où une explosion a eu lieu reste en feu (zone de dégâts persistante) pendant 3s | Le sol garde des taches enflammées orange/rouge animées |

### Branche LANCERS (cadence et multi-cast)

**Identité** : la baguette tire plus vite et lance plusieurs projectiles. Build "sorcier frénétique".

| Tier | Coût | Effet stat | Effet spécial | Visuel |
|------|------|-----------|---------------|--------|
| 1 | 15 | fireRateMs → 700 | — | Baguette qui s'illumine en continu |
| 2 | 75 | fireRateMs → 550, projectileSpeed → 350 | — | Projectiles plus rapides |
| 3 | 350 | fireRateMs → 400 | **Double cast** : 1 tir sur 3 lâche 2 projectiles | Effet de "réplique" magique |
| 4 | 1500 | fireRateMs → 280 | **Triple cast** : chaque tir lâche 3 projectiles en éventail | Trois trajectoires de feu visibles |
| 5 | 6000 | fireRateMs → 180 | **Tempête de feu** : projectiles en continu, certains téléguidés | Pluie de boules de feu sur l'écran, baguette qui crache du feu en continu |

---

## BOUCLIER — famille **1-main défensive** (instance — débloquable plus tard)

**Identité** : arme atypique. Faible offensif, fort défensif. Quand on l'équipe, le perso a une **aura défensive** qui pousse / brûle / paralyse les mobs au contact, et le bouclier **bash** périodiquement les mobs proches. Build "tank stationnaire".

**Stats de base** :

```ts
shield: {
  base: {
    bashRadius: 50,          // rayon du bash autour du perso
    bashCooldownMs: 800,     // cadence du bash
    bashDamage: 2,
    auraRadius: 0,           // pas d'aura par défaut (débloquée par paliers)
    auraDps: 0,
    knockbackForce: 30,      // force du repoussement au bash
  },
}
```

**Comportement de base** : à chaque cycle de `bashCooldownMs`, tous les mobs dans `bashRadius` autour du perso prennent `bashDamage` et sont repoussés de `knockbackForce` pixels. Pas de projectile, pas de rotation. C'est un *pulse* défensif.

### Branche FORTERESSE (zone de contrôle)

**Identité** : le rayon défensif s'étend, le perso devient un centre d'exclusion. Build "no mob ne passe".

| Tier | Coût | Effet stat | Effet spécial | Visuel |
|------|------|-----------|---------------|--------|
| 1 | 15 | bashRadius → 70, knockbackForce → 50 | — | Onde visible au moment du bash |
| 2 | 75 | bashRadius → 95, knockbackForce → 75 | — | Onde plus large, plus marquée |
| 3 | 350 | bashRadius → 130, knockbackForce → 110 | — | Anneau de force qui pulse |
| 4 | 1500 | bashRadius → 170, knockbackForce → 160 | **Bash continu** : le bash devient un poussage permanent à faible force (les mobs en zone sont constamment repoussés) | Onde de pression visible en continu |
| 5 | 6000 | bashRadius → 220, knockbackForce → 240 | **Citadelle** : aucun mob ne peut entrer dans le rayon (mur invisible). Les mobs s'amassent contre la frontière | Dôme de lumière translucide visible autour du perso |

### Branche AURA (dégâts passifs de zone)

**Identité** : le bouclier irradie. Plus de bash isolé — une **aura permanente** brûle/électrocute les mobs proches. Build "no clic, juste exister".

| Tier | Coût | Effet stat | Effet spécial | Visuel |
|------|------|-----------|---------------|--------|
| 1 | 15 | auraRadius → 80, auraDps → 1 | Aura active en continu | Léger halo bleuté autour du perso |
| 2 | 75 | auraRadius → 110, auraDps → 3 | — | Halo plus visible, particules d'énergie |
| 3 | 350 | auraRadius → 150, auraDps → 8 | — | Aura crépitante, éclairs visibles |
| 4 | 1500 | auraRadius → 200, auraDps → 20 | **Stun** : 5% chance par tick de stun 200ms les mobs dans l'aura | Mobs stun visibles (flash blanc + arrêt) |
| 5 | 6000 | auraRadius → 260, auraDps → 50 | **Tempête statique** : éclairs aléatoires jaillissent du perso vers des mobs random toutes les 100ms (bonus damage) | Foudres permanentes vers les mobs, le perso ressemble à un générateur Tesla |

### Branche RIPOSTE (contre-attaque)

**Identité** : chaque mob qui ose s'approcher est puni avec une violence disproportionnée. Build "punisher".

| Tier | Coût | Effet stat | Effet spécial | Visuel |
|------|------|-----------|---------------|--------|
| 1 | 15 | bashDamage → 5 | — | Flash blanc au bash |
| 2 | 75 | bashDamage → 12, bashCooldownMs → 700 | — | Bash plus visible, screen shake léger |
| 3 | 350 | bashDamage → 30, bashCooldownMs → 600 | **Reflect** : 25% des dégâts qui DEVRAIENT toucher le perso sont renvoyés (anticipation pour quand le perso aura des HP) | Flash de déviation au moment du reflect |
| 4 | 1500 | bashDamage → 70, bashCooldownMs → 500 | **Punition** : un mob qui touche le perso est instakill (dans la limite de son HP × 5) | Explosion blanche sur le mob puni |
| 5 | 6000 | bashDamage → 200, bashCooldownMs → 400 | **Sentence divine** : à chaque kill par bash, un éclair fend le ciel et frappe 3 mobs random sur l'écran (dégâts massifs) | Éclairs verticaux du ciel, screen shake fort |

---

## GRIMOIRE D'INVOCATION — famille **magique** (instance — débloquable plus tard)

**Identité** : ne tape pas. **Invoque des entités** qui combattent en autonomie. Le grimoire flotte autour du perso (visuel) mais c'est les **spectres** qui font le boulot. Build "armée fantôme".

**Comportement de base d'un spectre** :

- Immortel (ne meurt pas).
- Cherche le mob le plus proche, se déplace vers lui en ligne droite à vitesse fixe.
- Au contact, tape jusqu'à la mort du mob, puis switch sur le suivant.
- S'il n'y a aucun mob à l'écran, revient lentement vers le perso et orbite.

**Stats de base** :

```ts
grimoire: {
  base: {
    summonCount: 1,          // nombre de spectres simultanés
    spectreSpeed: 120,       // px/s
    spectreDamage: 2,
    spectreAttackRateMs: 500,
    spectreType: 'basic',    // 'basic' = comportement décrit ci-dessus
  },
}
```

### Branche ESSAIM (nombre d'invocations)

**Identité** : plus de spectres. Build "armée".

| Tier | Coût | Effet stat | Effet spécial | Visuel |
|------|------|-----------|---------------|--------|
| 1 | 15 | summonCount → 2 | — | 2 spectres bleutés |
| 2 | 75 | summonCount → 3 | — | 3 spectres, formation visible |
| 3 | 350 | summonCount → 5 | — | Une vraie petite troupe |
| 4 | 1500 | summonCount → 7 | **Coordination** : les spectres se répartissent automatiquement sur les mobs différents (pas tous sur la même cible) | Lignes de "désignation" brèves entre spectres et leurs cibles |
| 5 | 6000 | summonCount → 12 | **Légion** : 12 spectres simultanés, l'écran est plein de fantômes | Spectres avec apparence différenciée (couleurs variées), aura de groupe |

### Branche FÉROCITÉ (puissance des spectres)

**Identité** : moins de spectres mais des bourrins. Build "élite".

| Tier | Coût | Effet stat | Effet spécial | Visuel |
|------|------|-----------|---------------|--------|
| 1 | 15 | spectreDamage → 5, spectreAttackRateMs → 400 | — | Spectres plus lumineux |
| 2 | 75 | spectreDamage → 12, spectreAttackRateMs → 320 | — | Effets d'attaque visibles (slash spectral) |
| 3 | 350 | spectreDamage → 30, spectreAttackRateMs → 250 | — | Spectres avec armes spectrales visibles |
| 4 | 1500 | spectreDamage → 70, spectreAttackRateMs → 180 | **Brutalité** : chaque attaque a 25% de chance de stun 300ms | Stun visible sur les mobs touchés |
| 5 | 6000 | spectreDamage → 180, spectreAttackRateMs → 120 | **Vengeurs** : chaque spectre tape avec AoE (rayon 40px), les kills déclenchent un cri qui boost les autres spectres pendant 1s | Effet AoE à chaque hit, aura collective qui pulse |

### Branche RAPIDITÉ (vitesse de mouvement et de réaction)

**Identité** : les spectres traversent l'écran à toute vitesse, ne laissent aucun mob respirer. Build "guêpes".

| Tier | Coût | Effet stat | Effet spécial | Visuel |
|------|------|-----------|---------------|--------|
| 1 | 15 | spectreSpeed → 180 | — | Trail de mouvement court |
| 2 | 75 | spectreSpeed → 250 | — | Trail plus marqué, mouvement saccadé |
| 3 | 350 | spectreSpeed → 350 | **Téléport court** : un spectre qui a > 200px à parcourir pour atteindre sa cible se téléporte directement (cooldown 2s par spectre) | Effet de disparition/réapparition |
| 4 | 1500 | spectreSpeed → 500 | **Frénésie** : après chaque kill, le spectre gagne +50% vitesse pendant 1s (cumule jusqu'à +200%) | Trail de plus en plus dense au fur et à mesure des kills |
| 5 | 6000 | spectreSpeed → 800 | **Spectres éclair** : les spectres deviennent presque instantanés, l'écran clignote en permanence d'apparitions/disparitions | Mouvement quasi-téléportant, traces lumineuses persistantes |

---

## Stats de base récap (à mettre dans `balance.ts`)

```ts
weapons: {
  sword: { /* déjà fait en v0.2 */ },
  bow: {
    base: { range: 400, arrowSpeed: 350, fireRateMs: 600, damage: 1, arrowsPerShot: 1, pierceCount: 0 },
    branches: {
      cadence: { thresholds: [15, 75, 350, 1500, 6000], tiers: [/* effets */] },
      pierce:  { thresholds: [15, 75, 350, 1500, 6000], tiers: [/* effets */] },
      multi:   { thresholds: [15, 75, 350, 1500, 6000], tiers: [/* effets */] },
    },
  },
  fireWand: {
    base: { range: 320, projectileSpeed: 280, fireRateMs: 900, damage: 3, explosionRadius: 50, burnDurationMs: 0, burnDps: 0 },
    branches: {
      inferno: { thresholds: [15, 75, 350, 1500, 6000], tiers: [/* effets */] },
      brasier: { thresholds: [15, 75, 350, 1500, 6000], tiers: [/* effets */] },
      lancers: { thresholds: [15, 75, 350, 1500, 6000], tiers: [/* effets */] },
    },
  },
  shield: {
    base: { bashRadius: 50, bashCooldownMs: 800, bashDamage: 2, auraRadius: 0, auraDps: 0, knockbackForce: 30 },
    branches: {
      forteresse: { thresholds: [15, 75, 350, 1500, 6000], tiers: [/* effets */] },
      aura:       { thresholds: [15, 75, 350, 1500, 6000], tiers: [/* effets */] },
      riposte:    { thresholds: [15, 75, 350, 1500, 6000], tiers: [/* effets */] },
    },
  },
  grimoire: {
    base: { summonCount: 1, spectreSpeed: 120, spectreDamage: 2, spectreAttackRateMs: 500, spectreType: 'basic' },
    branches: {
      essaim:   { thresholds: [15, 75, 350, 1500, 6000], tiers: [/* effets */] },
      ferocite: { thresholds: [15, 75, 350, 1500, 6000], tiers: [/* effets */] },
      rapidite: { thresholds: [15, 75, 350, 1500, 6000], tiers: [/* effets */] },
    },
  },
}
```

---

## Notes design transversales

### Lisibilité quand plusieurs armes coexistent

Avec 4-5 armes équipables (selon loadout) tournant à pleine puissance (paliers 5 partout), l'écran va devenir **chaotique**. C'est volontaire et désirable — c'est *le* sentiment d'idle bien buildé. Mais :

- **Code couleur par famille** : épée = blanc/argent, arc = jaune/vert (nature), baguette de feu = orange/rouge, bouclier = bleu (défense), grimoire = violet/cyan (spectral). Permet de lire visuellement *qui* fait quoi pendant le bordel.
- **Pool de particules global** avec hard-cap (genre 500 particules max actives). Au-delà, on supprime les plus anciennes. Indispensable pour le framerate.
- **Hit-stop désactivé** quand plus de 3 kills/sec, sinon le jeu freeze visuellement. À tester.

### Synergies avec l'arbre de famille (futur)

Plusieurs paliers 5 ont été pensés pour être amplifiés par les passifs de famille à venir :

- **1-main** : bonus de vitesse global → épée vitesse + bouclier riposte deviennent terrifiants.
- **Distance** : bonus de portée global → arc tempête + multi-shot 360° couvrent l'écran entier.
- **Magique** : bonus d'effets magiques → baguette inferno + spectres frénétiques cumulent les explosions et les hits.

Aucun palier 5 n'est conçu pour être un sommet final isolé — ils sont tous des *socles* sur lesquels les méta-passifs viendront construire.

### Le cas spécial de l'invocation

Le spectre du grimoire est la **première entité alliée** du jeu. Implications techniques :

- Nouveau type d'entité dans `World` : `allies: Spectre[]`.
- Boucle d'IA séparée dans `tick.ts` : `tickSpectres(world, dt)`.
- Pathfinding ligne droite (pas de A*, on s'en fout, les mobs sont eux-mêmes en ligne droite vers le perso).
- État individuel par spectre : `target: Mob | null`, `attackCooldown: number`, `position: Vec2`.
- Au moment où d'autres types d'invocations arriveront (tank, AoE, etc.), prévoir un champ `behavior: 'aggressive' | 'tank' | 'support' | ...` ou un système de comportements pluggables.

### Hors-scope explicite de ces fiches

- Stats de famille (méta) — viendront avec `FAMILY_TREES.md`.
- Loadout, switch d'arme, UI multi-armes — viendront avec le plan v0.3.
- Sons par arme — v0.5+.
- Animations d'attaque détaillées pour le bouclier et le grimoire (en attente de validation des mécaniques).

---

## Questions encore ouvertes

1. **Le perso a-t-il des HP ?** Plusieurs effets ci-dessus supposent que oui (reflect, knockback, citadelle). Si non en v1, ces effets attendent leur utilité.
2. **Cap de spectres total à 12** : ok visuellement ? Ou on monte à 20-30 pour l'effet "horde" ?
3. **L'arc cible le mob le plus proche** : et s'il y a égalité ? FIFO, random, le plus dangereux ? Probablement le plus proche en distance brute, ties broken by id.
4. **La baguette explose sur impact mob** : et si elle rate (mob qui se décale entre le tir et l'arrivée) ? Elle continue sa trajectoire, explose à portée max, ou disparaît ? Probablement explose à portée max — donne plus de chances de toucher un mob qui était derrière.

Ces questions ne bloquent pas la conception, mais devront être tranchées au moment de coder chaque arme.
