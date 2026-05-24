import { create } from "zustand";
import type { SkillChoice } from "@/game/skills";
import type { SwordBranch } from "@/lib/balance";

/**
 * Store Zustand = ce que React doit afficher.
 * Le world mutable (mobs, particules, etc.) vit dans un useRef côté
 * GameCanvas — pas ici, sinon re-render à chaque tick = mort du framerate.
 *
 * Règle : le canvas LIT sans subscribe (`useGame.getState()`), pousse
 * les MAJ via les actions ci-dessous. Le HUD et la modale, eux,
 * subscribent normalement.
 */
type GameStore = {
  // HUD
  kills: number;
  wave: number;
  swordLevel: number;
  swordXp: number;
  swordXpToNext: number;

  // Skill tree state
  skills: SkillChoice[];
  /** Modal de choix en attente. Présent ⇒ jeu en pause. */
  pendingChoice: { tier: number } | null;

  // Toggle de pause manuelle (différent de pendingChoice — pas utilisé en v0.2)
  paused: boolean;

  // Hydratation depuis le save
  hydrate: (s: Partial<Pick<GameStore,
    "kills" | "wave" | "swordLevel" | "swordXp" | "swordXpToNext" | "skills"
  >>) => void;

  // Actions de gameplay
  setKills: (n: number) => void;
  setWave: (n: number) => void;
  setSwordProgress: (level: number, xp: number, xpToNext: number) => void;
  requestSkillChoice: (tier: number) => void;
  confirmSkillChoice: (branch: SwordBranch) => void;

  togglePause: () => void;
};

export const useGame = create<GameStore>((set, get) => ({
  kills: 0,
  wave: 1,
  swordLevel: 1,
  swordXp: 0,
  swordXpToNext: 10,

  skills: [],
  pendingChoice: null,

  paused: false,

  hydrate: (s) => set((prev) => ({ ...prev, ...s })),

  setKills: (n) => set({ kills: n }),
  setWave: (n) => set({ wave: n }),
  setSwordProgress: (level, xp, xpToNext) =>
    set({ swordLevel: level, swordXp: xp, swordXpToNext: xpToNext }),

  requestSkillChoice: (tier) => set({ pendingChoice: { tier } }),
  confirmSkillChoice: (branch) => {
    const { pendingChoice, skills } = get();
    if (!pendingChoice) return;
    // tier choisi = la hauteur courante de la branche + 1 (cumulatif par branche)
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

  togglePause: () => set((s) => ({ paused: !s.paused })),
}));
