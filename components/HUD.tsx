"use client";

import { useGame } from "@/lib/store";
import {
  SWORD_BRANCHES,
  SWORD_TIERS_PER_BRANCH,
  maxAccessibleTier,
  TIERS_PER_BRACKET,
  type SwordBranch,
} from "@/lib/balance";
import { branchHeight } from "@/game/skills";

const BRANCH_LABEL: Record<SwordBranch, string> = {
  speed: "VIT",
  range: "PORT",
  damage: "DEG",
};
const BRANCH_TINT: Record<SwordBranch, string> = {
  speed: "#7fd0ff",
  range: "#9be4a3",
  damage: "#ff8a3d",
};

export default function HUD() {
  const kills = useGame((s) => s.kills);
  const wave = useGame((s) => s.wave);
  const lvl = useGame((s) => s.swordLevel);
  const xp = useGame((s) => s.swordXp);
  const xpToNext = useGame((s) => s.swordXpToNext);
  const skills = useGame((s) => s.skills);
  const sealedBranches = useGame((s) => s.sealedBranches);
  const extendedTier = useGame((s) => s.extendedTier);
  const xpRatio = Math.min(1, xpToNext > 0 ? xp / xpToNext : 0);
  const cap = maxAccessibleTier(extendedTier);

  return (
    <>
      {/* Kills en haut à gauche */}
      <div className="pointer-events-none absolute left-4 top-4 select-none font-mono">
        <div className="text-[10px] tracking-[0.3em] text-white/40">KILLS</div>
        <div className="text-4xl font-bold tabular-nums leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          {kills}
        </div>
      </div>

      {/* Vague en haut à droite */}
      <div className="pointer-events-none absolute right-4 top-4 select-none text-right font-mono">
        <div className="text-[10px] tracking-[0.3em] text-white/40">VAGUE</div>
        <div className="text-4xl font-bold tabular-nums leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          {wave}
        </div>
      </div>

      {/* Bandeau bas centre : voies + XP */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex flex-col items-center gap-2 font-mono">
        {/* Mini indicateurs de voies */}
        <div className="flex items-center gap-3">
          {SWORD_BRANCHES.map((branch) => {
            const sealed = sealedBranches.includes(branch);
            const h = branchHeight(skills, sealedBranches, branch);
            const tint = BRANCH_TINT[branch];
            return (
              <div key={branch} className="flex items-center gap-1.5">
                <span
                  className="text-[9px] tracking-[0.2em]"
                  style={{ color: sealed ? "#5a3030" : tint }}
                >
                  {BRANCH_LABEL[branch]}
                </span>
                <div className="flex gap-[2px]">
                  {Array.from({ length: SWORD_TIERS_PER_BRANCH }).map((_, i) => {
                    const tier = i + 1;
                    const bracketIdx = Math.floor((tier - 1) / TIERS_PER_BRACKET);
                    const bracketUnlocked = tier <= cap;
                    const taken = !sealed && tier <= h;
                    return (
                      <div
                        key={i}
                        className="h-[6px] w-[6px] rounded-sm"
                        style={{
                          background: sealed
                            ? "rgba(120,40,40,0.25)"
                            : taken
                            ? tint
                            : bracketUnlocked
                            ? "rgba(255,255,255,0.18)"
                            : "rgba(255,255,255,0.06)",
                          // Petit séparateur visuel entre brackets de 3 (T3, T6).
                          marginLeft: i > 0 && i % TIERS_PER_BRACKET === 0 ? 3 : 0,
                          // Marquer la voie scellée d'une opacité dégradée.
                          opacity: sealed ? 0.5 : 1,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Barre XP */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-3 text-[10px] tracking-[0.25em] text-white/50">
            <span>ÉPÉE</span>
            <span className="text-white/80">LVL {lvl}</span>
            <span className="tabular-nums">{xp} / {xpToNext}</span>
          </div>
          <div className="relative h-1.5 w-72 max-w-[60vw] overflow-hidden rounded-full bg-white/10">
            <div
              className="absolute inset-y-0 left-0 bg-[#9ce5ff] transition-[width] duration-100"
              style={{ width: `${xpRatio * 100}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
