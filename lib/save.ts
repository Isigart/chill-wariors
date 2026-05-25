import { useGame } from "./store";
import { createProgression, type GameProgression } from "@/game/progression";
import { BRANCHES_OF, WEAPONS, type WeaponKind } from "@/lib/balance";

const KEY = "chill-warriors:v0.5";
const LEGACY_KEYS = ["chill-warriors:v0.2", "chill-warriors:v0.3", "chill-warriors:v0.4"];
const VERSION = 4;

interface SaveV4 {
  v: 4;
  kills: number;
  progression: GameProgression;
}

interface SaveV3Legacy {
  v: 3;
  kills?: number;
  progression?: {
    trainingBranch?: string;
    xp?: Record<string, number>;
    tier?: Record<string, number>;
  };
}

export function loadSave(): { progression: GameProgression } | null {
  if (typeof window === "undefined") return null;

  // Nettoyage des saves legacy v0.2 / v0.3.
  for (const lk of ["chill-warriors:v0.2", "chill-warriors:v0.3"]) {
    try {
      window.localStorage.removeItem(lk);
    } catch {
      /* noop */
    }
  }

  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SaveV4;
      if (parsed.v === VERSION) {
        const prog = sanitize(parsed.progression);
        useGame.getState().hydrate({ kills: parsed.kills ?? 0, progression: prog });
        return { progression: prog };
      }
    }

    // Migration v0.4 → v0.5 : on garde l'épée, on bascule sur la nouvelle shape.
    const legacyRaw = window.localStorage.getItem("chill-warriors:v0.4");
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw) as SaveV3Legacy;
        if (legacy.v === 3) {
          const fresh = createProgression();
          const swordXp = legacy.progression?.xp ?? {};
          const swordTier = legacy.progression?.tier ?? {};
          for (const b of BRANCHES_OF.sword) {
            const k = b as string;
            const x = typeof swordXp[k] === "number" ? swordXp[k] : 0;
            const t = typeof swordTier[k] === "number" ? swordTier[k] : 0;
            fresh.weapons.sword.xp[k] = Math.max(0, x);
            fresh.weapons.sword.tier[k] = Math.max(0, Math.min(5, Math.floor(t)));
          }
          if (legacy.progression?.trainingBranch && (BRANCHES_OF.sword as readonly string[]).includes(legacy.progression.trainingBranch)) {
            fresh.equipped = "sword";
            fresh.trainingBranch = legacy.progression.trainingBranch;
          }
          useGame.getState().hydrate({ kills: legacy.kills ?? 0, progression: fresh });
          // Bascule sur la nouvelle clé.
          try {
            window.localStorage.setItem(KEY, JSON.stringify({ v: VERSION, kills: legacy.kills ?? 0, progression: fresh }));
            window.localStorage.removeItem("chill-warriors:v0.4");
          } catch {
            /* noop */
          }
          return { progression: fresh };
        }
      } catch {
        /* noop */
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function persistFromStore() {
  if (typeof window === "undefined") return;
  const s = useGame.getState();
  const data: SaveV4 = { v: VERSION, kills: s.kills, progression: s.progression };
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

function sanitize(input: unknown): GameProgression {
  const def = createProgression();
  if (!input || typeof input !== "object") return def;
  const i = input as Partial<GameProgression>;

  // Compat : ancien champ `trainingWeapon` est utilisé comme fallback de `equipped`.
  const rawEquipped = (i as { equipped?: unknown; trainingWeapon?: unknown }).equipped
    ?? (i as { trainingWeapon?: unknown }).trainingWeapon;
  const equipped: WeaponKind =
    WEAPONS.includes(rawEquipped as WeaponKind) ? (rawEquipped as WeaponKind) : def.equipped;
  const branches = BRANCHES_OF[equipped] as readonly string[];
  const trainingBranch = branches.includes(i.trainingBranch as string)
    ? (i.trainingBranch as string)
    : (BRANCHES_OF[equipped][0] as string);

  const result: GameProgression = {
    equipped,
    trainingBranch,
    weapons: {
      sword: { xp: { ...def.weapons.sword.xp }, tier: { ...def.weapons.sword.tier } },
      bow: { xp: { ...def.weapons.bow.xp }, tier: { ...def.weapons.bow.tier } },
    },
  };

  for (const w of WEAPONS) {
    const src = i.weapons?.[w];
    if (!src || typeof src !== "object") continue;
    for (const b of BRANCHES_OF[w]) {
      const bk = b as string;
      const x = (src.xp as Record<string, unknown> | undefined)?.[bk];
      const t = (src.tier as Record<string, unknown> | undefined)?.[bk];
      if (typeof x === "number" && x >= 0 && Number.isFinite(x)) result.weapons[w].xp[bk] = x;
      if (typeof t === "number" && t >= 0 && t <= 5 && Number.isInteger(t)) result.weapons[w].tier[bk] = t;
    }
  }

  return result;
}
