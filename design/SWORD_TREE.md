# Arbre interne — Épée tournoyante

Référence design des 15 paliers. La doc humaine vit ici, les chiffres exécutés vivent dans `lib/balance.ts`. Toute modif numérique doit synchroniser les deux.

5 tiers par voie. Le joueur entraîne une voie à la fois. Auto-unlock dès que la jauge atteint le seuil.

Seuils de kills cumulés sur la voie entraînée : **15 / 75 / 350 / 1500 / 6000**.

---

## ⚡ Vitesse

Identité : rotation de plus en plus rapide, jusqu'à devenir une **aura cinétique** qui tue sans même qu'on voit la lame.

| Tier | Nom | Effet stat | Effet spécial | Visuel |
|------|-----|-----------|---------------|--------|
| 1 | Tournoiement | rotation 6.0 rad/s, cooldown 200ms | — | trail léger derrière la pointe |
| 2 | Tournoiement + | rotation 8.0, cooldown 150 | — | trail plus dense |
| 3 | Anneau translucide | rotation 12.0, cooldown 100 | — | anneau bleu translucide à la portée de la lame |
| 4 | Onde de rotation | rotation 15.0, cooldown 80 | knockback 50px à chaque hit | shockwave émise toutes les ½ rotations |
| 5 | Aura cinétique | rotation 18.0, cooldown 60 | knockback 80px + dégâts continus zone (4/s) | anneau dense + glow + particules orbitales |

À T5, l'épée n'est plus visible en tant que lame — c'est un disque qui tue tout ce qui touche le périmètre.

---

## 🗡️ Portée

Identité : la lame s'allonge jusqu'à devenir une **faux dorée** qui traverse tout.

| Tier | Nom | Effet stat | Effet spécial | Visuel |
|------|-----|-----------|---------------|--------|
| 1 | Allonge | length 115 | — | — |
| 2 | Lame épaisse | length 150, width 18 | — | — |
| 3 | Faux ambrée | length 220, width 24 | — | lame courbée, trail ambre |
| 4 | Lame fantôme | length 260, width 24 | double-hit (un mob peut être touché 2× par rotation) | lame fantôme avec 50ms de retard |
| 5 | Faux dorée | length 320, width 24 | pierce (la lame traverse, touche tous les mobs sur l'arc) | lame dorée translucide |

À T5, chaque rotation balaie un demi-écran et touche tous les mobs sur le passage sans cooldown.

---

## 💥 Dégâts

Identité : chaque hit devient un **cataclysme** avec crits, feu, et explosions en chaîne.

| Tier | Nom | Effet stat | Effet spécial | Visuel |
|------|-----|-----------|---------------|--------|
| 1 | Tranchant | damage 2 | popup jaune | — |
| 2 | Brutal | damage 5 | popup orange, hit-stop ×1.4 | — |
| 3 | Brisure | damage 15 | popup rouge, screen shake ×2 | lame teintée rouge sombre |
| 4 | Coup critique | damage 25 | 20% crit ×3, flash blanc sur crit | lame rouge profond |
| 5 | Cataclysme | damage 60 | 30% crit ×5, explosion 80px rayon 50% dmg sur kill | lame en feu permanent, explosions visibles |

À T5, chaque kill déclenche une explosion qui peut tuer en chaîne (cap : 1 niveau de récursion pour éviter cascade exponentielle).

---

## Notes de feel

- **T1-T3** : warm-up. C'est lent, c'est numérique, c'est ok — ça sert à apprendre le système et à voir la première vraie transformation arriver à T3.
- **T4-T5** : le payoff. C'est là que la voie devient *mémorable* visuellement et mécaniquement. Si un T5 ne donne pas l'impression "wow ça change tout", il faut juicer plus, pas changer la mécanique.
- **Combos à T5** :
  - **Vitesse 5 + Dégâts 5** : aura cinétique enflammée qui explose les mobs avant qu'ils approchent. Knockback + zoneDamage + explosions.
  - **Portée 5 + Dégâts 5** : faux dorée qui pierce + explose à chaque kill. Une rotation = wipe complet de la zone. Le cap chain-explosion à 1 niveau prévient la récursion infinie.
  - **Vitesse 5 + Portée 5** : anneau immense qui balaie tout en permanence, sans cooldown. Quasi-invincibilité passive.
