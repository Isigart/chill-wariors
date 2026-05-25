import { create } from "zustand";
import {
  awardXp as awardXpPure,
  createProgression,
  setTraining as setTrainingPure,
  type GameProgression,
} from "@/game/progression";
import type { WeaponKind } from "@/lib/balance";

export type GameMode = "idle" | "instance" | "altar";

type GameStore = {
  kills: number;
  progression: GameProgression;
  lastUnlocked: { weapon: WeaponKind; branch: string; tier: number } | null;

  // --- Mode & instance ---
  mode: GameMode;
  /** HP du joueur. Pertinent uniquement en mode instance. */
  playerHp: number;
  playerHpMax: number;
  /** Mithril déjà banké (persistant entre runs). */
  mithril: number;
  /** Mithril récolté dans le run en cours (transitoire). */
  mithrilInRun: number;
  /** Vague courante de l'instance. */
  instanceWave: number;
  /** Stock de clefs par arme (vide en v0.7 — pas encore de drop). */
  keys: Record<WeaponKind, number>;
  /** Niveau de trempage par arme/branche (vide en v0.7). */
  trempage: Record<WeaponKind, Record<string, number>>;

  addKill: () => void;
  setTraining: (weapon: WeaponKind, branch: string) => void;
  setEquipped: (weapon: WeaponKind) => void;
  awardXp: (amount: number) => { weapon: WeaponKind; branch: string; tier: number } | null;
  consumeLastUnlocked: () => void;

  // --- Mode/instance actions ---
  enterInstance: () => void;
  damagePlayer: (amount: number) => void;
  addMithril: (amount: number) => void;
  setInstanceWave: (n: number) => void;
  endRun: () => void;        // mort ou bouton "Tenter le rituel" → mode altar
  returnToIdle: () => void;  // depuis altar → bank mithril + reset → idle

  hydrate: (s: Partial<Pick<GameStore,
    "kills" | "progression" | "mithril" | "keys" | "trempage" | "mode"
  >>) => void;
};

function emptyKeys(): Record<WeaponKind, number> {
  return { sword: 0, bow: 0, fireWand: 0 };
}
function emptyTrempage(): Record<WeaponKind, Record<string, number>> {
  return { sword: {}, bow: {}, fireWand: {} };
}

export const useGame = create<GameStore>((set, get) => ({
  kills: 0,
  progression: createProgression(),
  lastUnlocked: null,

  mode: "idle",
  playerHp: 100,
  playerHpMax: 100,
  mithril: 0,
  mithrilInRun: 0,
  instanceWave: 1,
  keys: emptyKeys(),
  trempage: emptyTrempage(),

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

  enterInstance: () =>
    set((s) => ({
      mode: "instance",
      playerHp: s.playerHpMax,
      mithrilInRun: 0,
      instanceWave: 1,
    })),

  damagePlayer: (amount) =>
    set((s) => ({ playerHp: Math.max(0, s.playerHp - amount) })),

  addMithril: (amount) => set((s) => ({ mithrilInRun: s.mithrilInRun + amount })),

  setInstanceWave: (n) => set({ instanceWave: n }),

  endRun: () => set({ mode: "altar" }),

  returnToIdle: () =>
    set((s) => ({
      mode: "idle",
      mithril: s.mithril + s.mithrilInRun,
      mithrilInRun: 0,
      playerHp: s.playerHpMax,
      instanceWave: 1,
    })),

  hydrate: (s) => set((prev) => ({ ...prev, ...s })),
}));

function clone(p: GameProgression): GameProgression {
  return {
    equipped: p.equipped,
    trainingBranch: p.trainingBranch,
    weapons: {
      sword: { xp: { ...p.weapons.sword.xp }, tier: { ...p.weapons.sword.tier } },
      bow: { xp: { ...p.weapons.bow.xp }, tier: { ...p.weapons.bow.tier } },
      fireWand: { xp: { ...p.weapons.fireWand.xp }, tier: { ...p.weapons.fireWand.tier } },
    },
  };
}
