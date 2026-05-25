"use client";

import { useGame } from "@/lib/store";

/**
 * UI de fin de run (autel). Affichée quand mode === "altar".
 * En v0.7 MVP : pas de trempage. Juste un récap du mithril récolté +
 * bouton "Retour à l'idle" qui bank le mithril et revient au mode idle.
 *
 * v0.8 ajoutera : sélection de branche + slider mithril + tentative.
 */
export default function AltarUI() {
  const mode = useGame((s) => s.mode);
  const mithrilInRun = useGame((s) => s.mithrilInRun);
  const mithril = useGame((s) => s.mithril);
  const returnToIdle = useGame((s) => s.returnToIdle);
  const playerHp = useGame((s) => s.playerHp);

  if (mode !== "altar") return null;

  const isDeath = playerHp <= 0;
  const total = mithril + mithrilInRun;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 backdrop-blur-md">
      <div className="flex w-full max-w-xl flex-col items-center gap-6 px-6 py-10">
        <div className="text-center">
          <div className="font-mono text-xs tracking-[0.4em] text-amber-300/60">
            {isDeath ? "VOUS ÊTES TOMBÉ" : "RUN TERMINÉ"}
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-white">
            L'Autel se dresse devant vous
          </div>
        </div>

        <div className="w-full rounded-lg border-2 border-amber-400/30 bg-amber-400/[0.05] px-6 py-5">
          <div className="font-mono text-[10px] tracking-[0.3em] text-amber-300/60 text-center">
            MITHRIL RÉCOLTÉ DURANT LE RUN
          </div>
          <div className="mt-1 text-center font-mono text-5xl font-bold tabular-nums text-amber-200 drop-shadow-[0_2px_12px_rgba(255,196,80,0.35)]">
            +{mithrilInRun}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 font-mono text-xs text-white/50">
            <span>Total après bank :</span>
            <span className="tabular-nums text-amber-100">{total}</span>
          </div>
        </div>

        <div className="w-full max-w-md rounded-md border border-white/10 bg-black/40 px-4 py-3 font-mono text-xs text-white/50">
          Le rituel de trempage arrive dans la version suivante. Pour l'instant,
          le mithril est simplement mis de côté pour la prochaine itération.
        </div>

        <button
          onClick={returnToIdle}
          className="rounded-md border-2 border-amber-400/60 bg-amber-400/[0.1] px-6 py-3 font-mono text-sm font-bold tracking-[0.25em] text-amber-200 transition hover:border-amber-400 hover:bg-amber-400/[0.18] active:scale-[0.97]"
        >
          REPARTIR AVEC LE MITHRIL
        </button>
      </div>
    </div>
  );
}
