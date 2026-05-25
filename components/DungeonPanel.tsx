"use client";

import { useGame } from "@/lib/store";
import { anyWeaponMaxed } from "@/game/progression";
import { BALANCE } from "@/lib/balance";

/**
 * Onglet Donjon. v0.8 beta : entrée gated par une Clef de Mine
 * (drop 0.5 % RNG sur mob idle, gated lui-même par 1 arme T5/T5/T5).
 */
export default function DungeonPanel() {
  const panel = useGame((s) => s.panel);
  const mithril = useGame((s) => s.mithril);
  const mineKeys = useGame((s) => s.mineKeys);
  const progression = useGame((s) => s.progression);
  const enterInstance = useGame((s) => s.enterInstance);
  const closePanel = useGame((s) => s.closePanel);

  if (panel !== "dungeon") return null;

  const canDropKeys = anyWeaponMaxed(progression);
  const canEnter = mineKeys > 0;
  const dropRatePercent = (BALANCE.keys.mineKeyDropRate * 100).toFixed(2);

  return (
    <div className="absolute inset-0 z-20 flex items-start justify-center overflow-y-auto bg-[#0f0805]/85 backdrop-blur-md">
      <div className="flex w-full max-w-xl flex-col items-stretch gap-3 px-3 py-6 sm:gap-4 sm:px-6 sm:py-8">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-[0.35em] text-amber-300/60 sm:text-xs sm:tracking-[0.4em]">
              ONGLET
            </div>
            <div className="mt-0.5 font-mono text-xl font-bold text-white sm:text-3xl">
              ⛏ Donjon
            </div>
          </div>
          <button
            onClick={closePanel}
            className="rounded-md border border-amber-100/20 bg-amber-100/[0.05] px-3 py-1.5 font-mono text-xs font-bold tracking-[0.2em] text-white/80 transition hover:border-amber-100/50 hover:text-white"
          >
            ✕ FERMER
          </button>
        </div>

        {/* Récap mithril + clefs */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-amber-400/20 bg-amber-400/[0.04] px-3 py-2 text-center">
            <div className="font-mono text-[9px] tracking-[0.25em] text-amber-300/60 sm:text-[10px]">
              MITHRIL
            </div>
            <div className="font-mono text-xl font-bold tabular-nums text-amber-200 sm:text-2xl">
              {mithril}
            </div>
          </div>
          <div className="rounded-md border border-emerald-400/20 bg-emerald-400/[0.04] px-3 py-2 text-center">
            <div className="font-mono text-[9px] tracking-[0.25em] text-emerald-300/60 sm:text-[10px]">
              CLEFS DE MINE
            </div>
            <div className="font-mono text-xl font-bold tabular-nums text-emerald-200 sm:text-2xl">
              ⚷ {mineKeys}
            </div>
          </div>
        </div>

        <DungeonCard
          name="La Mine de Mithril"
          lore="Sous la pierre rouge, des golems gardent l'éclat. Tu survis aux vagues, tu remontes avec ce que tu as ramassé. Pas d'autre fin que celle que tu choisis."
          mineKeys={mineKeys}
          canEnter={canEnter}
          onEnter={enterInstance}
        />

        {/* Etat du drop */}
        <div className="rounded-md border border-amber-100/10 bg-black/30 px-4 py-2 font-mono text-[10px] leading-relaxed text-white/55 sm:text-[11px]">
          {canDropKeys ? (
            <>
              <span className="text-emerald-300">●</span> Drop de Clef de Mine
              actif — <span className="text-white/80">{dropRatePercent}%</span> par mob
              tué en idle.
            </>
          ) : (
            <>
              <span className="text-red-300">○</span> Drop de Clef de Mine inactif.
              Il faut <span className="text-white/80">1 arme entièrement maxée
              (T5/T5/T5)</span> pour que les clefs commencent à tomber.
            </>
          )}
        </div>

        <div className="rounded-md border border-amber-100/10 bg-black/30 px-4 py-2 font-mono text-[10px] text-white/40 sm:text-[11px]">
          Les futures armes débloquables (bouclier, grimoire) auront leur propre
          donjon-puzzle, accessible via une Clef d'arme dropée à un palier de
          difficulté idle — distinct des Clefs de Mine.
        </div>
      </div>
    </div>
  );
}

function DungeonCard(props: {
  name: string;
  lore: string;
  mineKeys: number;
  canEnter: boolean;
  onEnter: () => void;
}) {
  return (
    <div
      className="rounded-md border-2 px-3 py-3 transition sm:px-5 sm:py-4"
      style={{
        borderColor: props.canEnter ? "rgba(255,196,80,0.55)" : "rgba(255,196,80,0.15)",
        background: props.canEnter ? "rgba(255,196,80,0.06)" : "rgba(255,196,80,0.02)",
        opacity: props.canEnter ? 1 : 0.7,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-base font-bold tracking-[0.15em] text-amber-200 sm:text-xl">
          {props.name}
        </div>
        <button
          onClick={props.onEnter}
          disabled={!props.canEnter}
          className="rounded-md border-2 border-amber-400/60 bg-amber-400/[0.12] px-4 py-1.5 font-mono text-xs font-bold tracking-[0.2em] text-amber-100 transition hover:border-amber-400 hover:bg-amber-400/[0.22] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-amber-400/60 disabled:hover:bg-amber-400/[0.12] sm:px-5 sm:py-2 sm:text-sm"
        >
          ENTRER
        </button>
      </div>
      <p className="mt-2 font-mono text-[11px] italic leading-relaxed text-white/60 sm:text-xs">
        {props.lore}
      </p>
      <div className="mt-2 flex items-center justify-between font-mono text-[10px] sm:text-[11px]">
        <span className="tracking-[0.2em] text-white/40">COÛT&nbsp;:&nbsp;</span>
        <span className={props.canEnter ? "text-emerald-300" : "text-red-300/80"}>
          ⚷ 1 CLEF DE MINE
          {props.canEnter
            ? ` (stock : ${props.mineKeys})`
            : props.mineKeys === 0
              ? " — aucune en stock"
              : ""}
        </span>
      </div>
    </div>
  );
}
