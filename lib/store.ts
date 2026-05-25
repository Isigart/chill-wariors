import { create } from "zustand";
import {
  awardXp as awardXpPure,
  createProgression,
  isWeaponMaxed,
  setTraining as setTrainingPure,
  type GameProgression,
} from "@/game/progression";
import { BRANCHES_OF, TREMPAGE, type WeaponKind } from "@/lib/balance";

export type GameMode = "idle" | "instance" | "altar";

export interface TrempageResult {
  success: boolean;
  newLevel: number;
  proba: number;
  mithrilSpent: number;
}

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
  /** Nb de tentatives de trempage effectuées dans la visite courante de l'autel. */
  trempageAttempts: number;
  /** Dernier résultat de trempage (transitoire, consommé par l'UI pour l'anim). */
  lastTrempage: TrempageResult | null;

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
  endRun: () => void;
  returnToIdle: () => void;

  // --- Trempage ---
  attemptTrempage: (weapon: WeaponKind, branch: string, mithrilCost: number) => TrempageResult | null;
  consumeLastTrempage: () => void;

  // --- Debug ---
  devMaxAllWeapons: () => void;
  devGiveMithril: (amount: number) => void;

  hydrate: (s: Partial<Pick<GameStore,
    "kills" | "progression" | "mithril" | "keys" | "mode"
  >>) => void;
};

function emptyKeys(): Record<WeaponKind, number> {
  return { sword: 0, bow: 0, fireWand: 0 };
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
  trempageAttempts: 0,
  lastTrempage: null,

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

  endRun: () => set({ mode: "altar", trempageAttempts: 0 }),

  returnToIdle: () =>
    set((s) => ({
      mode: "idle",
      mithril: s.mithril + s.mithrilInRun,
      mithrilInRun: 0,
      playerHp: s.playerHpMax,
      instanceWave: 1,
      trempageAttempts: 0,
    })),

  attemptTrempage: (weapon, branch, mithrilCost) => {
    const s = get();
    const prog = s.progression;
    // Éligibilité.
    if (!isWeaponMaxed(prog, weapon)) return null;
    if (mithrilCost < 0) return null;
    if (s.trempageAttempts >= TREMPAGE.maxAttemptsPerVisit) return null;
    const total = s.mithril + s.mithrilInRun;
    if (mithrilCost > total) return null;
    // L'arme tentée doit être celle équipée (UI le force déjà mais on garde le guard).
    if (prog.equipped !== weapon) return null;

    const currentLevel = prog.trempage[weapon]?.[branch] ?? 0;
    const niveauVise = currentLevel + 1;
    const proba = TREMPAGE.procaFinale(niveauVise, mithrilCost);
    const roll = Math.random();
    const success = roll < proba;

    // Mithril consommé : on déduit en priorité du banké, puis du run.
    const next = clone(prog);
    const fromBank = Math.min(s.mithril, mithrilCost);
    const fromRun = mithrilCost - fromBank;
    let newLevel: number;
    if (success) {
      newLevel = niveauVise;
    } else {
      newLevel = Math.max(0, currentLevel - TREMPAGE.failurePenalty);
    }
    next.trempage[weapon][branch] = newLevel;

    const result: TrempageResult = {
      success,
      newLevel,
      proba,
      mithrilSpent: mithrilCost,
    };
    set({
      progression: next,
      mithril: s.mithril - fromBank,
      mithrilInRun: s.mithrilInRun - fromRun,
      lastTrempage: result,
      trempageAttempts: s.trempageAttempts + 1,
    });
    return result;
  },

  consumeLastTrempage: () => set({ lastTrempage: null }),

  devMaxAllWeapons: () => {
    const prev = get().progression;
    const next = clone(prev);
    for (const w of ["sword", "bow", "fireWand"] as WeaponKind[]) {
      const branches = BRANCHES_OF[w] as readonly string[];
      const maxThresholds = 6000; // beyond the last threshold guarantee
      for (const b of branches) {
        next.weapons[w].tier[b] = 5;
        next.weapons[w].xp[b] = maxThresholds;
      }
    }
    set({ progression: next });
  },

  devGiveMithril: (amount) => set((s) => ({ mithril: s.mithril + amount })),

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
    trempage: {
      sword: { ...(p.trempage?.sword ?? {}) },
      bow: { ...(p.trempage?.bow ?? {}) },
      fireWand: { ...(p.trempage?.fireWand ?? {}) },
    },
  };
}
