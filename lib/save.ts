import { useGame } from "./store";
import type { SkillChoice } from "@/game/skills";

const KEY = "chill-warriors:v0.2";
const VERSION = 1;

interface SaveV1 {
  v: 1;
  kills: number;
  wave: number;
  swordLevel: number;
  swordXp: number;
  swordXpToNext: number;
  skills: SkillChoice[];
}

/** Lit le save (si présent et valide) et hydrate le store. À appeler 1× au mount. */
export function loadSave(): { wave: number; skills: SkillChoice[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveV1;
    if (parsed.v !== VERSION) return null;

    useGame.getState().hydrate({
      kills: parsed.kills ?? 0,
      wave: parsed.wave ?? 1,
      swordLevel: parsed.swordLevel ?? 1,
      swordXp: parsed.swordXp ?? 0,
      swordXpToNext: parsed.swordXpToNext ?? 10,
      skills: parsed.skills ?? [],
    });

    return {
      wave: parsed.wave ?? 1,
      skills: parsed.skills ?? [],
    };
  } catch {
    return null;
  }
}

/**
 * Persiste l'état HUD du store.
 * Pas de debounce : c'est appelé au max 1×/s côté GameCanvas (interval),
 * et chaque write est tiny (<1 KB).
 */
export function persistFromStore() {
  if (typeof window === "undefined") return;
  const s = useGame.getState();
  const data: SaveV1 = {
    v: VERSION,
    kills: s.kills,
    wave: s.wave,
    swordLevel: s.swordLevel,
    swordXp: s.swordXp,
    swordXpToNext: s.swordXpToNext,
    skills: s.skills,
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // localStorage plein / inaccessible — on ignore, c'est qu'un cache local.
  }
}

/** Reset complet (utile pour les tests / dev). */
export function clearSave() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
