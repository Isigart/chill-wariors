import { create } from "zustand";
import {
  anyWeaponMaxed,
  awardXp as awardXpPure,
  createProgression,
  isWeaponMaxed,
  setTraining as setTrainingPure,
  type GameProgression,
} from "@/game/progression";
import { BALANCE, BRANCHES_OF, TREMPAGE, type WeaponKind } from "@/lib/balance";

export type GameMode = "idle" | "instance" | "altar";
export type PanelKind = "none" | "inventory" | "dungeon" | "settings";

export interface GameSettings {
  /** Active les tremblements d'écran (kills, impacts, …). */
  screenShake: boolean;
}

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
  /**
   * Stock de Clefs d'arme (item narratif, drop garanti aux paliers de
   * difficulté idle — v0.9). Permettra de débloquer une arme via son
   * donjon dédié. Vide en v0.8 beta.
   */
  keys: Record<WeaponKind, number>;
  /**
   * Clefs de Mine (ressource récurrente). Drop continu en idle à
   * `BALANCE.keys.mineKeyDropRate`, gated par 1 arme T5/T5/T5.
   * Une clef = une entrée dans la Mine de Mithril.
   */
  mineKeys: number;
  /** Dernier drop de clef de mine (transitoire) — pour le HUD flash. */
  lastMineKeyDropAt: number;
  /** Nb de tentatives de trempage effectuées dans la visite courante de l'autel. */
  trempageAttempts: number;
  /** Dernier résultat de trempage (transitoire, consommé par l'UI pour l'anim). */
  lastTrempage: TrempageResult | null;
  /** Panneau ouvert (inventaire, donjon, settings) — "none" si aucun. */
  panel: PanelKind;
  /** Préférences utilisateur persistées. */
  settings: GameSettings;

  /** Snapshot transitoire de la submersion (mis à jour par GameCanvas). */
  submersion: {
    value: number;
    state: "normal" | "stun" | "immunity";
    msLeft: number;
  };

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

  // --- Clefs de Mine ---
  /** Tente un drop sur le mob qui vient de mourir en idle. */
  rollMineKeyDrop: () => boolean;
  addMineKey: (n?: number) => void;

  // --- Trempage ---
  attemptTrempage: (weapon: WeaponKind, branch: string, mithrilCost: number) => TrempageResult | null;
  consumeLastTrempage: () => void;

  // --- Panels (navigation onglets) ---
  openPanel: (p: PanelKind) => void;
  closePanel: () => void;

  // --- Settings ---
  setSettings: (patch: Partial<GameSettings>) => void;
  toggleScreenShake: () => void;

  // --- Submersion snapshot ---
  setSubmersionSnapshot: (value: number, state: "normal" | "stun" | "immunity", msLeft: number) => void;

  // --- Debug ---
  devMaxAllWeapons: () => void;
  devGiveMithril: (amount: number) => void;
  devGiveMineKeys: (amount: number) => void;
  devResetAll: () => void;

  hydrate: (s: Partial<Pick<GameStore,
    "kills" | "progression" | "mithril" | "mineKeys" | "keys" | "mode" | "settings"
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
  mineKeys: 0,
  lastMineKeyDropAt: 0,
  trempageAttempts: 0,
  lastTrempage: null,
  panel: "none",
  settings: { screenShake: true },
  submersion: { value: 0, state: "normal", msLeft: 0 },

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

  enterInstance: () => {
    const s = get();
    // Gating : nécessite 1 Clef de Mine.
    if (s.mineKeys <= 0) return;
    set({
      mode: "instance",
      playerHp: s.playerHpMax,
      mithrilInRun: 0,
      instanceWave: 1,
      panel: "none",
      mineKeys: s.mineKeys - 1,
    });
  },

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

  rollMineKeyDrop: () => {
    const s = get();
    if (s.mode !== "idle") return false;
    if (BALANCE.keys.requireAnyWeaponMaxed && !anyWeaponMaxed(s.progression)) return false;
    if (Math.random() >= BALANCE.keys.mineKeyDropRate) return false;
    set({ mineKeys: s.mineKeys + 1, lastMineKeyDropAt: Date.now() });
    return true;
  },

  addMineKey: (n = 1) =>
    set((s) => ({ mineKeys: s.mineKeys + n, lastMineKeyDropAt: Date.now() })),

  openPanel: (p) => set({ panel: p }),
  closePanel: () => set({ panel: "none" }),

  setSubmersionSnapshot: (value, state, msLeft) =>
    set((s) => {
      // Évite de notifier les subscribers si rien n'a vraiment bougé.
      const prev = s.submersion;
      if (
        Math.abs(prev.value - value) < 0.5 &&
        prev.state === state &&
        Math.abs(prev.msLeft - msLeft) < 50
      ) {
        return {};
      }
      return { submersion: { value, state, msLeft } };
    }),

  setSettings: (patch) =>
    set((s) => ({ settings: { ...s.settings, ...patch } })),
  toggleScreenShake: () =>
    set((s) => ({ settings: { ...s.settings, screenShake: !s.settings.screenShake } })),

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

  devGiveMineKeys: (amount) =>
    set((s) => ({ mineKeys: s.mineKeys + amount, lastMineKeyDropAt: Date.now() })),

  devResetAll: () => {
    // Reset complet du store + suppression du save localStorage.
    set({
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
      mineKeys: 0,
      lastMineKeyDropAt: 0,
      trempageAttempts: 0,
      lastTrempage: null,
      panel: "none",
      settings: { screenShake: true },
    });
    if (typeof window !== "undefined") {
      try {
        // Supprime toutes les clés legacy + actuelle.
        const keysToWipe = [
          "chill-warriors:v0.2",
          "chill-warriors:v0.3",
          "chill-warriors:v0.4",
          "chill-warriors:v0.5",
          "chill-warriors:v0.7",
          "chill-warriors:v0.8",
        ];
        for (const k of keysToWipe) window.localStorage.removeItem(k);
      } catch {
        /* noop */
      }
    }
  },

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
