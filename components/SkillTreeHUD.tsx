"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/store";
import {
  BALANCE,
  BRANCH_ICON,
  BRANCH_LABEL,
  BRANCH_TINT,
  BRANCHES_OF,
  MAX_TIER,
  WEAPON_LABEL,
  WEAPON_TINT,
  WEAPONS,
  type WeaponKind,
} from "@/lib/balance";
import { gaugeOf } from "@/game/progression";

/**
 * HUD non-bloquant : pour chaque arme (épée, arc), une rangée de 3 voies.
 * Clic = switch instantané de la sélection de training (weapon, branch).
 * Auto-unlock dès qu'un seuil est franchi, avec flash transitoire.
 */
export default function SkillTreeHUD() {
  const progression = useGame((s) => s.progression);
  const setTraining = useGame((s) => s.setTraining);
  const lastUnlocked = useGame((s) => s.lastUnlocked);
  const consumeLastUnlocked = useGame((s) => s.consumeLastUnlocked);

  const [flashing, setFlashing] = useState<{
    weapon: WeaponKind;
    branch: string;
    tier: number;
    label: string;
  } | null>(null);

  useEffect(() => {
    if (!lastUnlocked) return;
    const def = (
      BALANCE.weapons[lastUnlocked.weapon].branches as Record<string, { tiers: { label: string }[] }>
    )[lastUnlocked.branch].tiers[lastUnlocked.tier - 1];
    setFlashing({
      weapon: lastUnlocked.weapon,
      branch: lastUnlocked.branch,
      tier: lastUnlocked.tier,
      label: def.label,
    });
    consumeLastUnlocked();
    const id = setTimeout(() => setFlashing(null), 1600);
    return () => clearTimeout(id);
  }, [lastUnlocked, consumeLastUnlocked]);

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-3 flex flex-col items-center gap-2 font-mono">
      {WEAPONS.map((weapon) => (
        <WeaponRow
          key={weapon}
          weapon={weapon}
          training={progression.trainingWeapon === weapon ? progression.trainingBranch : null}
          onSelect={(branch) => setTraining(weapon, branch)}
          flashing={flashing?.weapon === weapon ? flashing : null}
        />
      ))}

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

function WeaponRow(props: {
  weapon: WeaponKind;
  training: string | null;
  onSelect: (branch: string) => void;
  flashing: { branch: string; tier: number; label: string } | null;
}) {
  const progression = useGame((s) => s.progression);
  const wTint = WEAPON_TINT[props.weapon];
  const branches = BRANCHES_OF[props.weapon] as readonly string[];

  return (
    <div className="flex items-center gap-2 px-3 py-1">
      <div
        className="w-14 text-[10px] font-bold tracking-[0.25em]"
        style={{ color: wTint }}
      >
        {WEAPON_LABEL[props.weapon]}
      </div>
      <div className="flex flex-wrap items-stretch gap-2">
        {branches.map((branch) => {
          const tint = BRANCH_TINT[props.weapon][branch];
          const tier = progression.weapons[props.weapon].tier[branch] ?? 0;
          const gauge = gaugeOf(progression, props.weapon, branch);
          const active = props.training === branch;
          const isFlash = props.flashing?.branch === branch;
          const ratio = gauge.atMax ? 1 : Math.min(1, gauge.current / Math.max(1, gauge.max));

          return (
            <button
              key={branch}
              onClick={() => props.onSelect(branch)}
              className={`group relative flex w-40 select-none flex-col gap-1.5 rounded-md border-2 px-2.5 py-2 text-left transition active:scale-[0.98] ${
                active
                  ? "border-white/70 bg-white/[0.08]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.05]"
              }`}
              style={{
                boxShadow: active ? `0 0 12px ${tint}55, inset 0 0 0 1px ${tint}30` : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm leading-none">{BRANCH_ICON[props.weapon][branch]}</span>
                  <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: tint }}>
                    {BRANCH_LABEL[props.weapon][branch]}
                  </span>
                </div>
                <div className="text-[9px] text-white/50 tabular-nums">
                  T{tier}/{MAX_TIER}
                </div>
              </div>
              <div className="relative h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="absolute inset-y-0 left-0 transition-[width] duration-100"
                  style={{ width: `${ratio * 100}%`, background: tint }}
                />
              </div>
              <div className="flex items-center justify-between text-[8px] tabular-nums">
                <span className="text-white/40">
                  {gauge.atMax ? "MAX" : `${gauge.current} / ${gauge.max}`}
                </span>
                {active && (
                  <span className="text-[7px] tracking-[0.25em] text-white/60">EN COURS</span>
                )}
              </div>

              {isFlash && props.flashing && (
                <div
                  className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-[0.15em]"
                  style={{
                    color: tint,
                    borderColor: `${tint}aa`,
                    background: "rgba(10,10,15,0.85)",
                    animation: "chillFloatUp 1.6s ease-out forwards",
                  }}
                >
                  T{props.flashing.tier} — {props.flashing.label.toUpperCase()}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
