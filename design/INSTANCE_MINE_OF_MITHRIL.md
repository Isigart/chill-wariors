# Chill Warriors — Instance #1 : La Mine de Mithril

> Première instance du jeu. Introduit le **mode instance** (combat actif, par opposition au mode idle observable), le **trempage d'arme** (progression infinie post-T5), et la **mécanique de mort comme bilan** (non punitive).

Référence design : `design/GAME_DESIGN.md` section 3.8 (Instances), `design/SWORD_TREE.md`, `design/WEAPON_TREES.md`.

---

## 1. Place dans la boucle globale

```
Mode idle (vagues infinies)
  ↓ XP de branche → débloquer paliers 1-5 des armes
  ↓ une fois l'arme à T5 sur les 3 branches :
  ↓ drop possible (RNG faible) d'une CLEF DE MINE pour cette arme
  ↓
Mode instance (Mine de Mithril)
  ↓ utiliser une clef pour entrer
  ↓ survivre aux vagues de golems, ramasser du MITHRIL
  ↓ à la fin du run (mort ou rituel volontaire) : AUTEL
  ↓ tenter le trempage ou repartir avec le mithril
  ↓
Retour mode idle
  ↓ continuer à farmer XP (pour entretenir / pour les autres armes)
  ↓ continuer à drop des clefs
  ↓ loop
```

Les deux modes se nourrissent : le mode idle produit les **clefs** (raison d'y rester), le mode instance produit le **mithril** (raison de revenir tenter le trempage). La boucle est circulaire, infinie, et non punitive.

---

## 2. Accès à l'instance — les Clefs de Mine

### Gating

**Aucune clef ne drop tant qu'aucune arme n'est maxée** à T5 sur ses 3 branches. Avant ça, le joueur n'a aucune raison de connaître l'existence du mithril ou des instances — c'est du contenu post-mode-idle.

### Drop

Une fois la première arme maxée :

- Les clefs **de cette arme spécifique** commencent à dropper sur les mobs du mode idle.
- Taux de drop : **0.5% par mob tué** par n'importe quelle arme du loadout.
- Aucun cap de stockage. Le joueur peut accumuler autant de clefs qu'il veut.
- Pas de garanti de palier. Pur RNG.

### Évolution

Quand une 2e arme est maxée, ses clefs commencent à dropper en parallèle. Etc. Chaque arme = sa propre clef = sa propre instance dédiée.

Pour v0.X, on n'implémente qu'**une seule instance** (la Mine de Mithril pour l'épée, choix arbitraire pour le starter). Les autres instances suivront le même template avec leurs propres golems thématiques et leur propre essence.

### UI

- Sur le HUD principal du mode idle, dans le coin haut-droite : compteur de clefs (icône + chiffre).
- Quand une clef drop pour la première fois : popup discret "Une clef vous est apparue. La Mine de Mithril vous attend." + animation visuelle marquée.
- Bouton "Entrer dans la Mine" disponible quand stock ≥ 1.

---

## 3. Structure d'un run d'instance

### Entrée

- Cliquer "Entrer dans la Mine" → consomme 1 clef → écran de transition (fade noir court, montée de musique différente, ambiance "donjon").
- Le perso est replacé au centre d'un nouvel environnement (background sombre, parois rocheuses, particules ambiantes — un visuel distinct du mode idle).
- Loadout d'arme actuel conservé. Tous les paliers débloqués actifs.

### Combat — Vagues de Golems

Pattern : **plateau + spike** (option (β) du design discuté).

| Vague | Type | HP | Damage | Vitesse | Mithril au kill |
|-------|------|-----|--------|---------|-----------------|
| 1-5 | Golems Mineurs | 10 → 20 | 1 | 50 | 1 |
| 6 | **Golem Majeur** (1er spike) | 100 | 2 | 40 | 25 |
| 7-11 | Golems Mineurs | 30 → 50 | 2 | 55 | 2 |
| 12 | **Golem Majeur** | 250 | 3 | 40 | 50 |
| 13-17 | Golems Mineurs | 70 → 120 | 3 | 60 | 4 |
| 18 | **Golem Majeur** | 600 | 5 | 40 | 100 |
| 19+ | Continue à scaler exponentiellement |

À partir de la vague 19, le scaling devient `HP × 1.4` par vague, `damage × 1.1`, le pattern de spike tous les 6 vagues continue avec des golems majeurs proportionnellement plus durs.

**Pas de fin théorique au run.** Le joueur peut pousser à l'infini, mais les golems finissent par devenir tank et frapper trop fort. La mort est statistiquement inévitable.

### Le perso a-t-il des HP en instance ?

**Oui, et c'est ici qu'on les introduit pour la première fois.**

- HP de base : **100**.
- Dégâts pris : au contact d'un golem, le perso perd `damage_golem` HP. Cooldown d'invulnérabilité de 500ms après chaque hit (sinon la mort est instantanée dans un tas).
- Pas de soin pendant le run. Pas de potion. Pas de regen passive.
- Quand HP = 0 → mort → écran de fin de run, autel apparaît.

**Note** : le mode idle reste sans HP perso. Les HP n'existent qu'en instance. Cela résout les paliers du bouclier qui supposaient des HP (cf. `WEAPONS_TREES.md`) : ces effets seront actifs en instance, inertes en mode idle.

### Mithril : drop et accumulation

- Chaque golem mineur tué = 1 à 4 mithril (selon vague).
- Chaque golem majeur tué = 25 à 100+ mithril (selon vague).
- Le compteur de mithril est visible en permanence pendant le run (gros chiffre HUD).
- Le mithril gagné est **dans la poche** dès que le run se termine, peu importe comment il se termine.

### Fin du run

Deux conditions :

1. **Mort du perso** (HP = 0).
2. **Bouton "Tenter le Rituel"** cliqué volontairement. Disponible à tout moment pendant le run, dans le HUD bas.

Dans les deux cas, **l'autel apparaît** et le joueur a accès au choix du trempage. La mort n'est **pas** punitive — c'est juste un signal de fin. Le bouton "Tenter le Rituel" est un **raccourci** ("j'ai assez, je veux pas risquer de mourir et de gaspiller du temps en agonie"), pas un sauvetage.

---

## 4. L'Autel — Mécanique de trempage

### Présentation

Quand le run se termine, le décor de combat est remplacé (fade) par un autel central, le perso devant. Mithril accumulé affiché en gros. Pas de menace, pas de timer. Le joueur peut prendre son temps.

Deux choix exclusifs :

- **Tenter le rituel** (UI dédiée, voir ci-dessous).
- **Repartir sans tremper** : conserve tout le mithril pour la prochaine fois. Retour mode idle.

### UI du rituel

Pour chaque arme du loadout actuel **qui est maxée à T5** (donc éligible au trempage), une ligne :

```
[ARME] [BRANCHE]    Niveau actuel : N   →   Tenter niveau N+1
  ┌──────────────────────────────────────┐
  │ Mithril à injecter : [____] [+] [-]  │
  │ Proba de réussite  : XX%             │
  │ [Tenter le trempage]                 │
  └──────────────────────────────────────┘
```

Le joueur choisit :

1. **Quelle branche tremper** (parmi les branches de l'arme maxée).
2. **Combien de mithril injecter** (slider ou +/-).
3. La proba se met à jour en temps réel.
4. Clic "Tenter le trempage" → animation → résultat.

### Mécanique mathématique du trempage

Formule complète à mettre dans `balance.ts` :

```ts
trempage: {
  // Proba de base selon le niveau visé (N+1)
  proba_base: (niveauVise: number) => Math.max(0.05, 1 - niveauVise * 0.01),
  // = 99% au niveau 1, 90% au niveau 10, 50% au niveau 50, 5% plancher au-delà du niveau 95

  // Bonus de mithril (softcap logarithmique)
  bonus_max: 0.50,        // +50% au total via mithril, plafond absolu
  efficacite: 50,         // constante de la formule exponentielle
  bonus: (mithril: number) => 0.50 * (1 - Math.exp(-mithril / 50)),

  // Cap final de la proba
  proba_cap: 0.99,

  // Calcul total
  procaFinale: (niveauVise, mithril) =>
    Math.min(0.99, proba_base(niveauVise) + bonus(mithril)),
},
```

### Exemples chiffrés

| Niveau visé | Proba base | + 10 mithril | + 50 mithril | + 100 mithril | + 500 mithril |
|---|---|---|---|---|---|
| 5 | 95% | 99% (cap) | 99% | 99% | 99% |
| 30 | 70% | 79% | 99% (cap) | 99% | 99% |
| 50 | 50% | 59% | 82% | 93% | 99% (cap) |
| 80 | 20% | 29% | 52% | 63% | 70% (asymptote) |
| 95+ | 5% | 14% | 37% | 48% | 55% (max possible) |

Le joueur voit que **chaque mithril supplémentaire au-delà d'un certain seuil donne moins**. Il apprend à trouver le sweet spot.

### Résolution

- Tirage aléatoire `Math.random() < procaFinale`.
- **Succès** : flash doré, animation marquante, son distinct, niveau de trempage de la branche +1. Effet stat de la branche +5% (logarithmique avec niveau de trempage, voir section suivante). Le mithril injecté est consommé.
- **Échec** : flash rouge ou gris, animation plus discrète, niveau reste identique. **Le mithril injecté est perdu**. Pas de pity, pas de compensation.

### Effet mécanique de chaque niveau de trempage

```
multiplicateur = 1 + 0.05 × niveau × decay(niveau)
decay(niveau) = 1 / (1 + niveau / 100)
```

Exemples :

- Niveau 10 → +47% (5% × 10 × 0.91)
- Niveau 25 → +100% (5% × 25 × 0.80)
- Niveau 50 → +166% (5% × 50 × 0.67)
- Niveau 100 → +250% (5% × 100 × 0.50)
- Niveau 200 → +333% (asymptote vers 5×)

**La stat ciblée par le trempage = la stat principale de la branche** :

- Branche vitesse → `rotationSpeed` (épée), `fireRateMs` inversé (arc/baguette), etc.
- Branche portée → `length` (épée), `range` (arc), `explosionRadius` (baguette).
- Branche dégâts → `damage` partout.

Les effets spéciaux des paliers T5 restent **actifs et inchangés**. Le trempage **amplifie la stat**, pas la mécanique.

### Paliers visuels de trempage

Tous les 10 niveaux, palier visuel discret :

| Niveau trempage | Effet visuel |
|---|---|
| 10 | Teinte saturée / léger glow permanent |
| 20 | Particules ambiantes (1-2/s) émises depuis l'arme |
| 30 | Animation de "vibration" subtile sur l'arme au repos |
| 50 | Halo coloré visible même au repos |
| 75 | Trail mémorisé (positions précédentes persistent qq frames) |
| 100 | Aura concentrique pulsante autour du perso |
| 150 | Particules orbitales permanentes |
| 200 | Runes lumineuses flottant autour de l'arme |
| 300+ | Cumul progressif + intensité accrue |

**Pas d'effet mécanique aux paliers visuels.** Pure satisfaction.

---

## 5. Architecture technique

Nouveau `CombatContext` :

```ts
export type CombatContext = {
  mode: 'idle' | 'instance';
  modifiers: {
    hasPlayerHp: boolean;
    spawnRateMultiplier: number;
    damageMultiplier: number;
  };
};
```

Type Golem :

```ts
export interface Golem extends Mob {
  isMajor: boolean;
  mithrilDrop: number;
  contactDamage: number;
}
```

Store étendu :

```ts
type State = {
  keys: Record<WeaponId, number>;
  mithril: number;
  mithrilInRun: number;
  trempage: Record<WeaponId, Record<BranchId, number>>;
  playerHp: number;
  currentMode: 'idle' | 'instance' | 'altar';
};
```

---

## 6. Étapes d'implémentation

1. Infrastructure de modes (CombatContext, routage GameCanvas/InstanceMode).
2. HP du perso (instance uniquement).
3. Système de vagues structurées.
4. Type Golem + spawn différencié.
5. Mithril (drop + bank).
6. Clefs (drop RNG gated par max T5).
7. Écran d'autel (UI de fin de run).
8. Mécanique de trempage (formule + UI).
9. Effet mécanique du trempage (multiplicateur sur stats).
10. Paliers visuels de trempage.
11. Save/load étendu avec versioning.

Découpe livraison :

- **v0.7** : 1-5 + écran d'autel minimal (juste "tu as récolté X mithril, retour"). Le trempage n'existe pas encore — c'est le MVP du mode instance.
- **v0.8** : 6-10. Drop des clefs + UI trempage + paliers visuels.
- **v0.9+** : autres instances, polish.

---

## 7. Critères de validation

L'instance v0.7 est validée quand :

1. Le joueur peut entrer dans la mine (bouton de debug pour tester sans gating clef).
2. Combat actif contre vagues de golems, HP visible, dégâts au contact.
3. Mithril accumulé pendant le run, affiché en gros.
4. Mort vague 15-25 sur loadout sans trempage (pas encore implémenté, mais avec stats de base).
5. À la mort ou via bouton "Quitter" : retour idle avec mithril banké.

---

## 8. Hors-scope v0.7

- Trempage (formule + UI + effet stat).
- Drop des clefs (entrée via bouton debug en attendant).
- Paliers visuels de trempage.
- Autres instances.
- Animation cinématique de mort / autel.
- Sons.

---

## 9. Questions encore ouvertes

1. Visuel du perso pendant l'instance : même sprite ou aura "en chasse" ?
2. Musique / ambiance sonore : OST différente ?
3. Loadout switch entre runs : mithril conservé, trempage par arme persiste mais inactif si non équipée.
4. "Tenter le Rituel" : popup confirmation ou click direct ? — click direct (non-punitif).
5. Animation de mort : fade noir + autel qui émerge.
6. Prévisualisation du niveau N+1 trempage : surprise vs spoiler-y → laisser surprise.
