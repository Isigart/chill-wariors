"use client";

import { useGame } from "@/lib/store";

/**
 * Onglet Donjon : liste des instances disponibles. v0.7+ : une seule
 * mine pour le moment, entrée libre (debug). En v0.8+ : compteur de
 * clefs gating l'entrée.
 */
export default function DungeonPanel() {
  const panel = useGame((s) => s.panel);
  const mithril = useGame((s) => s.mithril);
  const enterInstance = useGame((s) => s.enterInstance);
  const closePanel = useGame((s) => s.closePanel);

  if (panel !== "dungeon") return null;

  return (
    <div className="absolute inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/85 backdrop-blur-md">
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
            className="rounded-md border border-white/20 bg-white/[0.05] px-3 py-1.5 font-mono text-xs font-bold tracking-[0.2em] text-white/80 transition hover:border-white/50 hover:text-white"
          >
            ✕ FERMER
          </button>
        </div>

        {/* Récap mithril banké */}
        <div className="rounded-md border border-amber-400/20 bg-amber-400/[0.04] px-4 py-2 text-center">
          <div className="font-mono text-[9px] tracking-[0.25em] text-amber-300/60 sm:text-[10px]">
            MITHRIL BANKÉ
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-amber-200 sm:text-3xl">
            {mithril}
          </div>
        </div>

        <DungeonCard
          name="La Mine de Mithril"
          lore="Sous la pierre rouge, des golems gardent l'éclat. Tu survis aux vagues, tu remontes avec ce que tu as ramassé. Pas d'autre fin que celle que tu choisis."
          cost="Libre (debug)"
          onEnter={enterInstance}
        />

        <div className="rounded-md border border-white/10 bg-black/30 px-4 py-2 font-mono text-[10px] text-white/40 sm:text-[11px]">
          Plus d'instances arrivent quand d'autres armes auront leur propre
          mine thématique. Le drop des clefs arrive en v0.8 beta.
        </div>
      </div>
    </div>
  );
}

function DungeonCard(props: { name: string; lore: string; cost: string; onEnter: () => void }) {
  return (
    <div className="rounded-md border-2 border-amber-400/30 bg-amber-400/[0.04] px-3 py-3 sm:px-5 sm:py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-base font-bold tracking-[0.15em] text-amber-200 sm:text-xl">
          {props.name}
        </div>
        <button
          onClick={props.onEnter}
          className="rounded-md border-2 border-amber-400/60 bg-amber-400/[0.12] px-4 py-1.5 font-mono text-xs font-bold tracking-[0.2em] text-amber-100 transition hover:border-amber-400 hover:bg-amber-400/[0.22] active:scale-[0.97] sm:px-5 sm:py-2 sm:text-sm"
        >
          ENTRER
        </button>
      </div>
      <p className="mt-2 font-mono text-[11px] italic leading-relaxed text-white/60 sm:text-xs">
        {props.lore}
      </p>
      <div className="mt-2 flex items-center justify-between font-mono text-[10px] sm:text-[11px]">
        <span className="tracking-[0.2em] text-white/40">COÛT&nbsp;:&nbsp;</span>
        <span className="text-white/70">{props.cost}</span>
      </div>
    </div>
  );
}
