import { create } from "zustand";
import type { SkillChoice } from "@/game/skills";
import type { SwordBranch } from "@/lib/balance";

/**
 * Store Zustand = ce que React doit afficher.
 * Le world mutable vit dans un useRef côté GameCanvas — pas ici, sinon
 * re-render à chaque tick = mort du framerate.
 *
 * Règle : le canvas LIT via `useGame.getState()` (no subscribe), pousse
 * les MAJ via les actions. Le HUD et la modale subscribent normalement.
 */
type GameStore = {
  // HUD
  kills: number;
  wave: number;
  swordLevel: number;
  swordXp: number;
  swordXpToNext: number;

  // Arbre interne
  skills: SkillChoice[];
  /** Voies scellées (sacrifiées). 0 → 2 entrées max. */
  sealedBranches: SwordBranch[];
  /** 0 = base, 1 = supérieurs débloqués, 2 = finaux débloqués. */
  extendedTier: number;

  /** Modal de choix actif. tier = niveau d'épée venant d'être atteint. */
  pendingChoice: { tier: number } | null;

  paused: boolean;

  // Hydratation
  hydrate: (s: Partial<Pick<GameStore,
    "kills" | "wave" | "swordLevel" | "swordXp" | "swordXpToNext"
    | "skills" | "sealedBranches" | "extendedTier"
  >>) => void;

  // Actions gameplay (poussées depuis le tick).
  setKills: (n: number) => void;
  setWave: (n: number) => void;
  setSwordProgress: (level: number, xp: number, xpToNext: number) => void;
  requestSkillChoice: (tier: number) => void;

  /** Sélectionne le prochain tier d'une voie. */
  takeNextTier: (branch: SwordBranch) => void;
  /** Sacrifie une voie pour débloquer le prochain bracket. */
  sacrificeBranch: (sacrificed: SwordBranch) => void;

  togglePause: () => void;
};

export const useGame = create<GameStore>((set, get) => ({
  kills: 0,
  wave: 1,
  swordLevel: 1,
  swordXp: 0,
  swordXpToNext: 10,

  skills: [],
  sealedBranches: [],
  extendedTier: 0,

  pendingChoice: null,

  paused: false,

  hydrate: (s) => set((prev) => ({ ...prev, ...s })),

  setKills: (n) => set({ kills: n }),
  setWave: (n) => set({ wave: n }),
  setSwordProgress: (level, xp, xpToNext) =>
    set({ swordLevel: level, swordXp: xp, swordXpToNext: xpToNext }),

  requestSkillChoice: (tier) => set({ pendingChoice: { tier } }),

  takeNextTier: (branch) => {
    const { pendingChoice, skills, sealedBranches } = get();
    if (!pendingChoice) return;
    if (sealedBranches.includes(branch)) return;
    const heightOfBranch = skills.reduce(
      (h, s) => (s.branch === branch && s.tier > h ? s.tier : h),
      0,
    );
    const nextTier = heightOfBranch + 1;
    set({
      skills: [...skills, { branch, tier: nextTier }],
      pendingChoice: null,
    });
  },

  sacrificeBranch: (sacrificed) => {
    const { pendingChoice, sealedBranches, extendedTier } = get();
    if (!pendingChoice) return;
    if (sealedBranches.includes(sacrificed)) return;
    if (extendedTier >= 2) return; // déjà au max d'unlock
    set({
      sealedBranches: [...sealedBranches, sacrificed],
      extendedTier: extendedTier + 1,
      pendingChoice: null,
    });
  },

  togglePause: () => set((s) => ({ paused: !s.paused })),
}));
