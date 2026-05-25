"use client";

import { useGame } from "@/lib/store";
import {
  BRANCH_LABEL,
  BRANCH_TINT,
  BRANCHES_OF,
  MAX_TIER,
  WEAPON_LABEL,
  WEAPON_TINT,
  WEAPONS,
  type WeaponKind,
} from "@/lib/balance";
import { isWeaponMaxed, trempageLevelOf } from "@/game/progression";

/**
 * Onglet Inventaire : liste les 3 armes avec leurs tiers + trempage.
 * Bouton "ÉQUIPER" pour switch d'arme (impossible en instance, le panel
 * est de toute façon caché par AltarUI/instance HUD).
 */
export default function InventoryPanel() {
  const panel = useGame((s) => s.panel);
  const progression = useGame((s) => s.progression);
  const setEquipped = useGame((s) => s.setEquipped);
  const closePanel = useGame((s) => s.closePanel);

  if (panel !== "inventory") return null;

  return (
    <div className="absolute inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/85 backdrop-blur-md">
      <div className="flex w-full max-w-xl flex-col items-stretch gap-3 px-3 py-6 sm:gap-4 sm:px-6 sm:py-8">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-[0.35em] text-white/40 sm:text-xs sm:tracking-[0.4em]">
              ONGLET
            </div>
            <div className="mt-0.5 font-mono text-xl font-bold text-white sm:text-3xl">
              🎒 Inventaire
            </div>
          </div>
          <button
            onClick={closePanel}
            className="rounded-md border border-white/20 bg-white/[0.05] px-3 py-1.5 font-mono text-xs font-bold tracking-[0.2em] text-white/80 transition hover:border-white/50 hover:text-white"
          >
            ✕ FERMER
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {WEAPONS.map((weapon) => (
            <WeaponCard
              key={weapon}
              weapon={weapon}
              equipped={progression.equipped === weapon}
              onEquip={() => setEquipped(weapon)}
            />
          ))}
        </div>

        <div className="rounded-md border border-white/10 bg-black/30 px-4 py-2 font-mono text-[10px] text-white/40 sm:text-[11px]">
          Seule l'arme équipée combat et gagne de l'XP. Switch d'arme libre,
          sans coût. Le trempage post-T5 se fait à l'autel de la mine.
        </div>
      </div>
    </div>
  );
}

function WeaponCard(props: { weapon: WeaponKind; equipped: boolean; onEquip: () => void }) {
  const progression = useGame((s) => s.progression);
  const weapon = props.weapon;
  const wTint = WEAPON_TINT[weapon];
  const branches = BRANCHES_OF[weapon] as readonly string[];
  const maxed = isWeaponMaxed(progression, weapon);

  return (
    <div
      className="rounded-md border-2 px-3 py-3 transition sm:px-4"
      style={{
        borderColor: props.equipped ? `${wTint}80` : "rgba(255,255,255,0.1)",
        background: props.equipped ? `${wTint}10` : "rgba(255,255,255,0.02)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-base font-bold tracking-[0.2em] sm:text-lg" style={{ color: wTint }}>
            {WEAPON_LABEL[weapon]}
          </span>
          {maxed && (
            <span className="font-mono text-[9px] tracking-[0.25em] text-amber-300/80 sm:text-[10px]">
              ✦ MAXÉE
            </span>
          )}
        </div>
        {props.equipped ? (
          <span className="rounded-md border border-emerald-400/40 bg-emerald-500/[0.08] px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.2em] text-emerald-300 sm:text-[11px]">
            ● ÉQUIPÉE
          </span>
        ) : (
          <button
            onClick={props.onEquip}
            className="rounded-md border-2 border-white/20 bg-white/[0.05] px-3 py-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white/80 transition hover:border-white/60 hover:text-white active:scale-[0.97] sm:text-[11px]"
          >
            ÉQUIPER
          </button>
        )}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {branches.map((branch) => {
          const tier = progression.weapons[weapon].tier[branch] ?? 0;
          const trempLvl = trempageLevelOf(progression, weapon, branch);
          const tint = BRANCH_TINT[weapon][branch];
          return (
            <div
              key={branch}
              className="rounded border border-white/10 bg-black/30 px-2 py-1.5"
            >
              <div className="font-mono text-[8px] tracking-[0.2em]" style={{ color: tint }}>
                {BRANCH_LABEL[weapon][branch]}
              </div>
              <div className="font-mono text-sm font-bold tabular-nums leading-tight text-white">
                T{tier}
                <span className="text-[9px] font-normal text-white/40"> / {MAX_TIER}</span>
              </div>
              {trempLvl > 0 && (
                <div className="font-mono text-[9px] tracking-[0.15em] text-amber-300/80">
                  ✦ +{trempLvl}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
