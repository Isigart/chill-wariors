"use client";

import { useGame } from "@/lib/store";

/**
 * HUD principal : adapte son contenu selon le mode de jeu.
 *  - idle      → kills + bouton "Entrer dans la Mine" (debug, sans clef).
 *  - instance  → kills + barre HP + mithril du run + vague + bouton "Quitter".
 *  - altar     → vide ici (AltarUI affiche le reste).
 */
export default function HUD() {
  const kills = useGame((s) => s.kills);
  const mode = useGame((s) => s.mode);
  const playerHp = useGame((s) => s.playerHp);
  const playerHpMax = useGame((s) => s.playerHpMax);
  const mithril = useGame((s) => s.mithril);
  const mithrilInRun = useGame((s) => s.mithrilInRun);
  const instanceWave = useGame((s) => s.instanceWave);
  const enterInstance = useGame((s) => s.enterInstance);
  const endRun = useGame((s) => s.endRun);

  const hpRatio = playerHpMax > 0 ? Math.max(0, playerHp / playerHpMax) : 0;

  return (
    <>
      {/* Kills (toujours visible) */}
      <div className="pointer-events-none absolute left-4 top-4 select-none font-mono">
        <div className="text-[10px] tracking-[0.3em] text-white/40">KILLS</div>
        <div className="text-4xl font-bold tabular-nums leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          {kills}
        </div>
      </div>

      {/* En haut à droite : mithril banké (toujours visible) + bouton mode */}
      <div className="pointer-events-auto absolute right-4 top-4 select-none flex flex-col items-end gap-2 font-mono">
        <div className="text-right">
          <div className="text-[10px] tracking-[0.3em] text-amber-300/60">MITHRIL</div>
          <div className="text-2xl font-bold tabular-nums leading-none text-amber-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            {mithril}
          </div>
        </div>
        {mode === "idle" && (
          <button
            onClick={enterInstance}
            className="rounded-md border-2 border-amber-400/40 bg-amber-400/[0.05] px-3 py-1.5 text-xs font-bold tracking-[0.2em] text-amber-200 transition hover:border-amber-400/80 hover:bg-amber-400/[0.12] active:scale-[0.97]"
          >
            ⛏ ENTRER DANS LA MINE
          </button>
        )}
      </div>

      {/* Centre-haut : indicateur de vague d'instance */}
      {mode === "instance" && (
        <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center font-mono">
          <div className="rounded-md border border-amber-400/30 bg-black/40 px-4 py-1.5 backdrop-blur-sm">
            <div className="text-center text-[10px] tracking-[0.3em] text-amber-300/60">VAGUE</div>
            <div className="text-center text-2xl font-bold tabular-nums leading-none text-white">
              {instanceWave}
            </div>
          </div>
        </div>
      )}

      {/* HP bar + mithril du run + bouton quitter (instance uniquement) */}
      {mode === "instance" && (
        <>
          <div className="pointer-events-none absolute bottom-4 left-4 flex flex-col gap-1 font-mono">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] text-white/50">
              <span>HP</span>
              <span className="text-white/80 tabular-nums">
                {Math.ceil(playerHp)} / {playerHpMax}
              </span>
            </div>
            <div className="relative h-3 w-64 max-w-[60vw] overflow-hidden rounded-full border border-white/15 bg-black/40">
              <div
                className="absolute inset-y-0 left-0 transition-[width] duration-100"
                style={{
                  width: `${hpRatio * 100}%`,
                  background: hpRatio > 0.5 ? "#7fd0ff" : hpRatio > 0.25 ? "#ffd24d" : "#ff5a5a",
                }}
              />
            </div>
            <div className="text-[10px] tracking-[0.25em] text-amber-300/80">
              MITHRIL RÉCOLTÉ : <span className="tabular-nums text-amber-200">{mithrilInRun}</span>
            </div>
          </div>

          <div className="pointer-events-auto absolute bottom-4 right-4 font-mono">
            <button
              onClick={endRun}
              className="rounded-md border-2 border-white/30 bg-white/[0.05] px-3 py-1.5 text-xs font-bold tracking-[0.2em] text-white/80 transition hover:border-amber-400/60 hover:text-amber-200 active:scale-[0.97]"
            >
              ⚱ TENTER LE RITUEL
            </button>
          </div>
        </>
      )}
    </>
  );
}
