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
  const mineKeys = useGame((s) => s.mineKeys);
  const submersion = useGame((s) => s.submersion);
  const subPct = Math.min(100, Math.round((submersion.value / 100) * 100));
  const subColor =
    submersion.state === "stun"
      ? "#a83020"
      : subPct >= 80
      ? "#c8401a"
      : subPct >= 50
      ? "#e8c878"
      : "#d8d4c0";
  const subFlashing = subPct >= 80 && submersion.state !== "stun";

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
            <div className="rounded border border-amber-100/15 bg-black/30 px-1.5 py-0.5 text-[9px] tracking-[0.2em] text-white/60 sm:text-[10px]">
              <span className="text-white/40">TIER&nbsp;</span>
              <span className="font-bold text-white/90 tabular-nums">{idleTier}</span>
            </div>
          )}
        </div>

        {/* Jauge de submersion (apparaît dès qu'il y a contact ou stun/immunité) */}
        {(submersion.value > 0 || submersion.state !== "normal") && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <div className="text-[8px] tracking-[0.25em] text-white/40 sm:text-[9px]">
                {submersion.state === "stun"
                  ? "STUN"
                  : submersion.state === "immunity"
                  ? "IMMUNITÉ"
                  : "SUBMERSION"}
              </div>
              <div className="relative h-1.5 w-28 overflow-hidden rounded-full border border-amber-100/15 bg-black/40 sm:w-36">
                <div
                  className="absolute inset-y-0 left-0 transition-[width] duration-100"
                  style={{
                    width:
                      submersion.state === "immunity"
                        ? "0%"
                        : submersion.state === "stun"
                        ? "100%"
                        : `${subPct}%`,
                    background: subColor,
                    boxShadow: subFlashing ? `0 0 8px ${subColor}` : undefined,
                    animation: subFlashing ? "subPulse 0.6s ease-in-out infinite" : undefined,
                  }}
                />
              </div>
              {submersion.state !== "normal" && (
                <div
                  className="text-[8px] tabular-nums tracking-[0.2em]"
                  style={{ color: submersion.state === "stun" ? "#ff8080" : "#e8c878" }}
                >
                  {Math.ceil(submersion.msLeft / 1000)}s
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes subPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* En haut à droite : mithril (total live en instance) + clefs de mine. */}
      <div className="pointer-events-none absolute right-2 top-2 flex select-none flex-col items-end gap-1 font-mono sm:right-4 sm:top-4 sm:gap-1.5">
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
        {mode === "idle" && mineKeys > 0 && (
          <div className="text-right">
            <div className="text-[9px] tracking-[0.3em] text-emerald-300/60 sm:text-[10px]">CLEFS</div>
            <div className="text-base font-bold tabular-nums leading-none text-emerald-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:text-xl">
              ⚷ {mineKeys}
            </div>
          </div>
        )}
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
            <div className="relative h-2.5 w-44 max-w-[55vw] overflow-hidden rounded-full border border-amber-100/15 bg-black/40 sm:h-3 sm:w-64 sm:max-w-[60vw]">
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
              className="rounded-md border-2 border-amber-100/30 bg-amber-100/[0.05] px-2 py-1 text-[10px] font-bold tracking-[0.15em] text-white/80 transition hover:border-amber-400/60 hover:text-amber-200 active:scale-[0.97] sm:px-3 sm:py-1.5 sm:text-xs sm:tracking-[0.2em]"
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
