import { useGame } from "./store";
import { createProgression, type SwordProgression } from "@/game/progression";
import { BRANCHES, type Branch } from "@/lib/balance";

const KEY = "chill-warriors:v0.4";
const LEGACY_KEYS = ["chill-warriors:v0.2", "chill-warriors:v0.3"];
const VERSION = 3;

interface SaveV3 {
  v: 3;
  kills: number;
  progression: SwordProgression;
}

/** Lit le save (si présent et valide) et hydrate le store. */
export function loadSave(): { progression: SwordProgression } | null {
  if (typeof window === "undefined") return null;

  // Nettoyage des saves legacy (v0.2 / v0.3) — schéma incompatible.
  // On les supprime au passage pour ne pas polluer localStorage.
  for (const lk of LEGACY_KEYS) {
    try {
      window.localStorage.removeItem(lk);
    } catch {
      /* noop */
    }
  }

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveV3;
    if (parsed.v !== VERSION) return null;

    const prog = sanitizeProgression(parsed.progression);
    useGame.getState().hydrate({
      kills: parsed.kills ?? 0,
      progression: prog,
    });
    return { progression: prog };
  } catch {
    return null;
  }
}

/** Persiste l'état du store. */
export function persistFromStore() {
  if (typeof window === "undefined") return;
  const s = useGame.getState();
  const data: SaveV3 = {
    v: VERSION,
    kills: s.kills,
    progression: s.progression,
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* noop */
  }
}

export function clearSave() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
    for (const lk of LEGACY_KEYS) window.localStorage.removeItem(lk);
  } catch {
    /* noop */
  }
}

/** Valide / corrige une progression chargée. Évite les NaN, branches inconnues. */
function sanitizeProgression(input: unknown): SwordProgression {
  const def = createProgression();
  if (!input || typeof input !== "object") return def;
  const i = input as Partial<SwordProgression>;
  const trainingBranch: Branch =
    BRANCHES.includes(i.trainingBranch as Branch) ? (i.trainingBranch as Branch) : def.trainingBranch;
  const xp = { ...def.xp };
  const tier = { ...def.tier };
  if (i.xp && typeof i.xp === "object") {
    for (const b of BRANCHES) {
      const v = (i.xp as Record<string, unknown>)[b];
      if (typeof v === "number" && v >= 0 && Number.isFinite(v)) xp[b] = v;
    }
  }
  if (i.tier && typeof i.tier === "object") {
    for (const b of BRANCHES) {
      const v = (i.tier as Record<string, unknown>)[b];
      if (typeof v === "number" && v >= 0 && v <= 5 && Number.isInteger(v)) tier[b] = v;
    }
  }
  return { trainingBranch, xp, tier };
}
