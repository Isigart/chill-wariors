"use client";

import { useGame } from "@/lib/store";
import { idleMobStats } from "@/lib/balance";

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
  const endRun = useGame((s) => s.endRun);

  const hpRatio = playerHpMax > 0 ? Math.max(0, playerHp / playerHpMax) : 0;
  const idleTier = idleMobStats(kills).tier;

  return (
    <>
      {/* Kills (toujours visible) + tier difficulté en idle */}
      <div className="pointer-events-none absolute left-2 top-2 select-none font-mono sm:left-4 sm:top-4">
        <div className="flex items-baseline gap-2">
          <div>
            <div className="text-[9px] tracking-[0.3em] text-white/40 sm:text-[10px]">KILLS</div>
            <div className="text-2xl font-bold tabular-nums leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:text-4xl">
              {kills}
            </div>
          </div>
          {mode === "idle" && idleTier > 0 && (
            <div className="rounded border border-white/15 bg-black/30 px-1.5 py-0.5 text-[9px] tracking-[0.2em] text-white/60 sm:text-[10px]">
              <span className="text-white/40">TIER&nbsp;</span>
              <span className="font-bold text-white/90 tabular-nums">{idleTier}</span>
            </div>
          )}
        </div>
      </div>

      {/* En haut à droite : mithril (total live en instance). Le bouton mine
          est maintenant dans l'onglet Donjon (NavTabs). */}
      <div className="pointer-events-none absolute right-2 top-2 flex select-none flex-col items-end gap-1.5 font-mono sm:right-4 sm:top-4 sm:gap-2">
        <div className="text-right">
          <div className="text-[9px] tracking-[0.3em] text-amber-300/60 sm:text-[10px]">MITHRIL</div>
          <div className="text-lg font-bold tabular-nums leading-none text-amber-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:text-2xl">
            {mode === "instance" ? mithril + mithrilInRun : mithril}
          </div>
          {mode === "instance" && mithrilInRun > 0 && (
            <div className="mt-0.5 text-[9px] tabular-nums text-amber-300/90 sm:text-[10px]">
              +{mithrilInRun} ce run
            </div>
          )}
        </div>
      </div>

      {/* Centre-haut : indicateur de vague d'instance */}
      {mode === "instance" && (
        <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center font-mono sm:top-4">
          <div className="rounded-md border border-amber-400/30 bg-black/40 px-3 py-1 backdrop-blur-sm sm:px-4 sm:py-1.5">
            <div className="text-center text-[9px] tracking-[0.3em] text-amber-300/60 sm:text-[10px]">VAGUE</div>
            <div className="text-center text-xl font-bold tabular-nums leading-none text-white sm:text-2xl">
              {instanceWave}
            </div>
          </div>
        </div>
      )}

      {/* HP bar + mithril du run + bouton quitter (instance uniquement) */}
      {mode === "instance" && (
        <>
          <div className="pointer-events-none absolute bottom-2 left-2 flex flex-col gap-1 font-mono sm:bottom-4 sm:left-4">
            <div className="flex items-center gap-2 text-[9px] tracking-[0.2em] text-white/50 sm:text-[10px] sm:tracking-[0.25em]">
              <span>HP</span>
              <span className="text-white/80 tabular-nums">
                {Math.ceil(playerHp)} / {playerHpMax}
              </span>
            </div>
            <div className="relative h-2.5 w-44 max-w-[55vw] overflow-hidden rounded-full border border-white/15 bg-black/40 sm:h-3 sm:w-64 sm:max-w-[60vw]">
              <div
                className="absolute inset-y-0 left-0 transition-[width] duration-100"
                style={{
                  width: `${hpRatio * 100}%`,
                  background: hpRatio > 0.5 ? "#7fd0ff" : hpRatio > 0.25 ? "#ffd24d" : "#ff5a5a",
                }}
              />
            </div>
            <div className="text-[9px] tracking-[0.2em] text-amber-300/80 sm:text-[10px] sm:tracking-[0.25em]">
              <span className="hidden sm:inline">MITHRIL RÉCOLTÉ : </span>
              <span className="sm:hidden">+</span>
              <span className="tabular-nums text-amber-200">{mithrilInRun}</span>
              <span className="sm:hidden"> ✦</span>
            </div>
          </div>

          <div className="pointer-events-auto absolute bottom-2 right-2 font-mono sm:bottom-4 sm:right-4">
            <button
              onClick={endRun}
              className="rounded-md border-2 border-white/30 bg-white/[0.05] px-2 py-1 text-[10px] font-bold tracking-[0.15em] text-white/80 transition hover:border-amber-400/60 hover:text-amber-200 active:scale-[0.97] sm:px-3 sm:py-1.5 sm:text-xs sm:tracking-[0.2em]"
            >
              <span className="sm:hidden">⚱ RITUEL</span>
              <span className="hidden sm:inline">⚱ TENTER LE RITUEL</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
