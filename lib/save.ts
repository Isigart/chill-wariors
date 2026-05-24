import { useGame } from "./store";
import type { SkillChoice } from "@/game/skills";
import type { SwordBranch } from "@/lib/balance";

const KEY = "chill-warriors:v0.3";
const LEGACY_KEY = "chill-warriors:v0.2";
const VERSION = 2;

interface SaveV2 {
  v: 2;
  kills: number;
  wave: number;
  swordLevel: number;
  swordXp: number;
  swordXpToNext: number;
  skills: SkillChoice[];
  sealedBranches: SwordBranch[];
  extendedTier: number;
}

interface SaveV1 {
  v: 1;
  kills: number;
  wave: number;
  swordLevel: number;
  swordXp: number;
  swordXpToNext: number;
  skills: SkillChoice[];
}

type AnySave = SaveV1 | SaveV2;

/** Lit le save (si présent et valide) et hydrate le store. */
export function loadSave(): { wave: number; skills: SkillChoice[]; sealedBranches: SwordBranch[] } | null {
  if (typeof window === "undefined") return null;
  try {
    let raw = window.localStorage.getItem(KEY);
    let migratingFromLegacy = false;
    if (!raw) {
      // Migration depuis v0.2 si présent.
      raw = window.localStorage.getItem(LEGACY_KEY);
      migratingFromLegacy = !!raw;
      if (!raw) return null;
    }
    const parsed = JSON.parse(raw) as AnySave;

    const upgraded: SaveV2 = parsed.v === 2 ? parsed : {
      v: 2,
      kills: parsed.kills ?? 0,
      wave: parsed.wave ?? 1,
      swordLevel: parsed.swordLevel ?? 1,
      swordXp: parsed.swordXp ?? 0,
      swordXpToNext: parsed.swordXpToNext ?? 10,
      skills: parsed.skills ?? [],
      sealedBranches: [],
      extendedTier: 0,
    };

    useGame.getState().hydrate({
      kills: upgraded.kills,
      wave: upgraded.wave,
      swordLevel: upgraded.swordLevel,
      swordXp: upgraded.swordXp,
      swordXpToNext: upgraded.swordXpToNext,
      skills: upgraded.skills,
      sealedBranches: upgraded.sealedBranches,
      extendedTier: upgraded.extendedTier,
    });

    if (migratingFromLegacy) {
      // Bascule sur la nouvelle clé et nettoie l'ancienne.
      try {
        window.localStorage.setItem(KEY, JSON.stringify(upgraded));
        window.localStorage.removeItem(LEGACY_KEY);
      } catch {
        /* noop */
      }
    }

    return {
      wave: upgraded.wave,
      skills: upgraded.skills,
      sealedBranches: upgraded.sealedBranches,
    };
  } catch {
    return null;
  }
}

/** Persiste l'état HUD du store. */
export function persistFromStore() {
  if (typeof window === "undefined") return;
  const s = useGame.getState();
  const data: SaveV2 = {
    v: VERSION,
    kills: s.kills,
    wave: s.wave,
    swordLevel: s.swordLevel,
    swordXp: s.swordXp,
    swordXpToNext: s.swordXpToNext,
    skills: s.skills,
    sealedBranches: s.sealedBranches,
    extendedTier: s.extendedTier,
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* noop */
  }
}

/** Reset complet (utile pour les tests / dev). */
export function clearSave() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* noop */
  }
}
