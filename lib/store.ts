import { create } from "zustand";
import {
  type SwordProgression,
  awardXp as awardXpPure,
  createProgression,
  setTrainingBranch as setTrainingBranchPure,
} from "@/game/progression";
import type { Branch } from "@/lib/balance";

/**
 * Store Zustand = source de vérité de la PROGRESSION.
 *
 * - Le world (mobs, particules, etc.) reste un useRef côté GameCanvas.
 * - Le canvas LIT `useGame.getState().progression` ponctuellement
 *   (au moment de recalculer les stats effectives), SANS subscribe.
 * - Le HUD subscribe normalement.
 *
 * Les mutations passent par les actions ci-dessous, qui font des
 * updates immutables → Zustand notifie les subscribers.
 */
type GameStore = {
  kills: number;
  progression: SwordProgression;
  /** Dernier palier débloqué (transitoire, consommé par le HUD pour le flash). */
  lastUnlockedTier: { branch: Branch; tier: number } | null;

  // Actions
  addKill: () => void;
  setTrainingBranch: (b: Branch) => void;
  /** Award `amount` XP. Renvoie le palier débloqué (null sinon). */
  awardXp: (amount: number) => { branch: Branch; tier: number } | null;
  consumeLastUnlocked: () => void;

  hydrate: (s: Partial<Pick<GameStore, "kills" | "progression">>) => void;
};

export const useGame = create<GameStore>((set, get) => ({
  kills: 0,
  progression: createProgression(),
  lastUnlockedTier: null,

  addKill: () => set((s) => ({ kills: s.kills + 1 })),

  setTrainingBranch: (b) => {
    const prev = get().progression;
    const next: SwordProgression = {
      trainingBranch: prev.trainingBranch,
      xp: { ...prev.xp },
      tier: { ...prev.tier },
    };
    setTrainingBranchPure(next, b);
    set({ progression: next });
  },

  awardXp: (amount) => {
    const prev = get().progression;
    const next: SwordProgression = {
      trainingBranch: prev.trainingBranch,
      xp: { ...prev.xp },
      tier: { ...prev.tier },
    };
    const unlocked = awardXpPure(next, amount);
    set({
      progression: next,
      ...(unlocked ? { lastUnlockedTier: unlocked } : {}),
    });
    return unlocked;
  },

  consumeLastUnlocked: () => set({ lastUnlockedTier: null }),

  hydrate: (s) => set((prev) => ({ ...prev, ...s })),
}));
