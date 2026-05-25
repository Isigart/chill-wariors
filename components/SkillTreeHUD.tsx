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
  type WeaponKind,
} from "@/lib/balance";
import { gaugeOf } from "@/game/progression";

/** Tabs onglets (inventaire, donjon) à côté de la rangée d'arme. */
function NavTabs() {
  const openPanel = useGame((s) => s.openPanel);
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <button
        onClick={() => openPanel("inventory")}
        className="rounded-md border border-amber-100/15 bg-black/30 px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.15em] text-white/70 transition hover:border-amber-100/40 hover:text-white active:scale-[0.97] sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.2em]"
      >
        🎒 INVENTAIRE
      </button>
      <button
        onClick={() => openPanel("dungeon")}
        className="rounded-md border border-amber-400/30 bg-amber-400/[0.05] px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.15em] text-amber-200 transition hover:border-amber-400/70 hover:bg-amber-400/[0.12] active:scale-[0.97] sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.2em]"
      >
        ⛏ DONJON
      </button>
    </div>
  );
}

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
  const mode = useGame((s) => s.mode);

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

  // En instance / altar : on cache l'arbre (l'UI est différente).
  if (mode !== "idle") return null;

  // On n'affiche QUE l'arme équipée. Pour switch, passer par l'onglet Inventaire.
  const equippedWeapon = progression.equipped;

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-2 flex flex-col items-center gap-1 px-1 font-mono sm:bottom-3 sm:gap-2">
      <WeaponRow
        key={equippedWeapon}
        weapon={equippedWeapon}
        equipped
        training={progression.trainingBranch}
        onSelect={(branch) => setTraining(equippedWeapon, branch)}
        flashing={flashing?.weapon === equippedWeapon ? flashing : null}
      />
      {/* Tabs onglets juste sous la rangée d'arme */}
      <NavTabs />

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
  equipped: boolean;
  training: string | null;
  onSelect: (branch: string) => void;
  flashing: { branch: string; tier: number; label: string } | null;
}) {
  const progression = useGame((s) => s.progression);
  const wTint = WEAPON_TINT[props.weapon];
  const branches = BRANCHES_OF[props.weapon] as readonly string[];
  // Une arme non équipée est rendue avec moins d'opacité — on voit qu'elle dort.
  const rowOpacity = props.equipped ? 1 : 0.45;

  return (
    <div
      className="flex w-full max-w-[640px] items-center gap-1 px-1 py-0.5 sm:gap-2 sm:px-3 sm:py-1"
      style={{ opacity: rowOpacity }}
    >
      <div className="flex w-12 shrink-0 flex-col sm:w-20">
        <div
          className="text-[9px] font-bold tracking-[0.2em] sm:text-[10px] sm:tracking-[0.25em]"
          style={{ color: wTint }}
        >
          {WEAPON_LABEL[props.weapon]}
        </div>
        <div
          className="text-[7px] tracking-[0.15em] sm:text-[8px] sm:tracking-[0.2em]"
          style={{ color: props.equipped ? "#a8e6a8" : "rgba(255,255,255,0.35)" }}
        >
          {props.equipped ? "● ON" : "○ OFF"}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 items-stretch gap-1 sm:gap-2">
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
              className={`group relative flex min-w-0 flex-1 select-none flex-col gap-1 rounded-md border-2 px-1.5 py-1.5 text-left transition active:scale-[0.98] sm:gap-1.5 sm:px-2.5 sm:py-2 ${
                active
                  ? "border-amber-100/70 bg-amber-100/[0.08]"
                  : "border-amber-100/10 bg-amber-100/[0.02] hover:border-amber-100/30 hover:bg-amber-100/[0.05]"
              }`}
              style={{
                boxShadow: active ? `0 0 12px ${tint}55, inset 0 0 0 1px ${tint}30` : undefined,
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
                  <span className="text-xs leading-none sm:text-sm">{BRANCH_ICON[props.weapon][branch]}</span>
                  <span
                    className="truncate text-[8px] font-bold tracking-[0.15em] sm:text-[9px] sm:tracking-[0.25em]"
                    style={{ color: tint }}
                  >
                    {BRANCH_LABEL[props.weapon][branch]}
                  </span>
                </div>
                <div className="shrink-0 text-[8px] text-white/50 tabular-nums sm:text-[9px]">
                  T{tier}/{MAX_TIER}
                </div>
              </div>
              <div className="relative h-1 overflow-hidden rounded-full bg-amber-100/10">
                <div
                  className="absolute inset-y-0 left-0 transition-[width] duration-100"
                  style={{ width: `${ratio * 100}%`, background: tint }}
                />
              </div>
              <div className="flex items-center justify-between gap-1 text-[7px] tabular-nums sm:text-[8px]">
                <span className="truncate text-white/40">
                  {gauge.atMax ? "MAX" : `${gauge.current}/${gauge.max}`}
                </span>
                {active && (
                  <span className="shrink-0 text-[6px] tracking-[0.2em] text-white/60 sm:text-[7px] sm:tracking-[0.25em]">EN COURS</span>
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
