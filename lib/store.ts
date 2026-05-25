import { create } from "zustand";
import {
  awardXp as awardXpPure,
  createProgression,
  setTraining as setTrainingPure,
  type GameProgression,
} from "@/game/progression";
import type { WeaponKind } from "@/lib/balance";

type GameStore = {
  kills: number;
  progression: GameProgression;
  lastUnlocked: { weapon: WeaponKind; branch: string; tier: number } | null;

  addKill: () => void;
  setTraining: (weapon: WeaponKind, branch: string) => void;
  setEquipped: (weapon: WeaponKind) => void;
  awardXp: (amount: number) => { weapon: WeaponKind; branch: string; tier: number } | null;
  consumeLastUnlocked: () => void;

  hydrate: (s: Partial<Pick<GameStore, "kills" | "progression">>) => void;
};

export const useGame = create<GameStore>((set, get) => ({
  kills: 0,
  progression: createProgression(),
  lastUnlocked: null,

  addKill: () => set((s) => ({ kills: s.kills + 1 })),

  setTraining: (weapon, branch) => {
    const prev = get().progression;
    const next: GameProgression = clone(prev);
    setTrainingPure(next, weapon, branch);
    set({ progression: next });
  },
  setEquipped: (weapon) => {
    const prev = get().progression;
    const next: GameProgression = clone(prev);
    setTrainingPure(next, weapon);
    set({ progression: next });
  },

  awardXp: (amount) => {
    const prev = get().progression;
    const next: GameProgression = clone(prev);
    const unlocked = awardXpPure(next, amount);
    set({
      progression: next,
      ...(unlocked ? { lastUnlocked: unlocked } : {}),
    });
    return unlocked;
  },

  consumeLastUnlocked: () => set({ lastUnlocked: null }),

  hydrate: (s) => set((prev) => ({ ...prev, ...s })),
}));

function clone(p: GameProgression): GameProgression {
  return {
    equipped: p.equipped,
    trainingBranch: p.trainingBranch,
    weapons: {
      sword: { xp: { ...p.weapons.sword.xp }, tier: { ...p.weapons.sword.tier } },
      bow: { xp: { ...p.weapons.bow.xp }, tier: { ...p.weapons.bow.tier } },
    },
  };
}
