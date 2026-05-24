import { create } from "zustand";

/**
 * Store Zustand = ce que React doit afficher rarement.
 * Le world mutable (mobs, particules, etc.) vit dans un useRef côté
 * GameCanvas — pas ici, sinon re-render à chaque tick = mort du framerate.
 *
 * Règle : on ajoute ici uniquement les valeurs qui changent
 * discrètement (kills, niveau, xp, etc.), pas les valeurs continues.
 */
type GameStore = {
  kills: number;
  addKills: (n: number) => void;
  paused: boolean;
  togglePause: () => void;
};

export const useGame = create<GameStore>((set) => ({
  kills: 0,
  addKills: (n) => set((s) => ({ kills: s.kills + n })),
  paused: false,
  togglePause: () => set((s) => ({ paused: !s.paused })),
}));
