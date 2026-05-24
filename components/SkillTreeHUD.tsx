"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/store";
import { BALANCE, BRANCHES, BRANCH_SHORT, BRANCH_TINT, type Branch } from "@/lib/balance";
import { gaugeOf, MAX_TIER } from "@/game/progression";

const BRANCH_ICON: Record<Branch, string> = {
  speed: "⚡",
  range: "🗡️",
  damage: "💥",
};

/**
 * HUD non-bloquant en bas de l'écran : 3 boutons (1 par voie), chacun
 * avec jauge + tier 0/5 + bordure pulsée si entraînement actif.
 * Clic = switch instantané de la branche entraînée. Pas de modal.
 */
export default function SkillTreeHUD() {
  const progression = useGame((s) => s.progression);
  const setTrainingBranch = useGame((s) => s.setTrainingBranch);
  const lastUnlockedTier = useGame((s) => s.lastUnlockedTier);
  const consumeLastUnlocked = useGame((s) => s.consumeLastUnlocked);

  // Flash transitoire local par branche pour highlight le palier qui vient de tomber.
  const [flashing, setFlashing] = useState<{ branch: Branch; tier: number; label: string } | null>(null);
  useEffect(() => {
    if (!lastUnlockedTier) return;
    const def = BALANCE.sword.branches[lastUnlockedTier.branch].tiers[lastUnlockedTier.tier - 1];
    setFlashing({ branch: lastUnlockedTier.branch, tier: lastUnlockedTier.tier, label: def.label });
    consumeLastUnlocked();
    const id = setTimeout(() => setFlashing(null), 1600);
    return () => clearTimeout(id);
  }, [lastUnlockedTier, consumeLastUnlocked]);

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-4 flex justify-center font-mono">
      <div className="flex flex-wrap items-stretch justify-center gap-3 px-4">
        {BRANCHES.map((branch) => {
          const tint = BRANCH_TINT[branch];
          const tier = progression.tier[branch];
          const gauge = gaugeOf(progression, branch);
          const active = progression.trainingBranch === branch;
          const isFlash = flashing?.branch === branch;
          const ratio = gauge.atMax ? 1 : Math.min(1, gauge.current / Math.max(1, gauge.max));

          return (
            <button
              key={branch}
              onClick={() => setTrainingBranch(branch)}
              className={`group relative flex w-44 select-none flex-col gap-2 rounded-lg border-2 px-3 py-2.5 text-left transition active:scale-[0.98] ${
                active
                  ? "border-white/70 bg-white/[0.08]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.05]"
              }`}
              style={{
                boxShadow: active ? `0 0 12px ${tint}55, inset 0 0 0 1px ${tint}30` : undefined,
              }}
            >
              {/* Ligne du haut : icône + label + tier */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base leading-none">{BRANCH_ICON[branch]}</span>
                  <span
                    className="text-[10px] font-bold tracking-[0.25em]"
                    style={{ color: tint }}
                  >
                    {BRANCH_SHORT[branch]}
                  </span>
                </div>
                <div className="text-[10px] text-white/50 tabular-nums">
                  T{tier}/{MAX_TIER}
                </div>
              </div>

              {/* Jauge */}
              <div className="relative h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="absolute inset-y-0 left-0 transition-[width] duration-100"
                  style={{ width: `${ratio * 100}%`, background: tint }}
                />
              </div>

              {/* Sous-ligne : valeur courante / max OU "MAX" */}
              <div className="flex items-center justify-between text-[9px] tabular-nums">
                <span className="text-white/40">
                  {gauge.atMax ? "MAX" : `${gauge.current} / ${gauge.max}`}
                </span>
                {active && (
                  <span className="text-[8px] tracking-[0.25em] text-white/60">
                    ENTRAÎNEMENT
                  </span>
                )}
              </div>

              {/* Flash de palier débloqué */}
              {isFlash && flashing && (
                <div
                  className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-bold tracking-[0.15em]"
                  style={{
                    color: tint,
                    borderColor: `${tint}aa`,
                    background: "rgba(10,10,15,0.85)",
                    animation: "chillFloatUp 1.6s ease-out forwards",
                  }}
                >
                  T{flashing.tier} — {flashing.label.toUpperCase()}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Keyframe animation injectée — évite d'éditer tailwind config pour 1 effet. */}
      <style jsx global>{`
        @keyframes chillFloatUp {
          0% { transform: translate(-50%, 4px); opacity: 0; }
          15% { transform: translate(-50%, 0); opacity: 1; }
          80% { transform: translate(-50%, -10px); opacity: 1; }
          100% { transform: translate(-50%, -22px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
