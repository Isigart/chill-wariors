"use client";

import { useGame } from "@/lib/store";

export default function HUD() {
  const kills = useGame((s) => s.kills);
  const wave = useGame((s) => s.wave);
  const lvl = useGame((s) => s.swordLevel);
  const xp = useGame((s) => s.swordXp);
  const xpToNext = useGame((s) => s.swordXpToNext);
  const xpRatio = Math.min(1, xpToNext > 0 ? xp / xpToNext : 0);

  return (
    <>
      {/* Kills en haut à gauche */}
      <div className="pointer-events-none absolute left-4 top-4 select-none font-mono">
        <div className="text-[10px] tracking-[0.3em] text-white/40">KILLS</div>
        <div className="text-4xl font-bold tabular-nums leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          {kills}
        </div>
      </div>

      {/* Vague en haut à droite */}
      <div className="pointer-events-none absolute right-4 top-4 select-none text-right font-mono">
        <div className="text-[10px] tracking-[0.3em] text-white/40">VAGUE</div>
        <div className="text-4xl font-bold tabular-nums leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          {wave}
        </div>
      </div>

      {/* Barre d'XP en bas centre */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-1 font-mono">
        <div className="flex items-center gap-3 text-[10px] tracking-[0.25em] text-white/50">
          <span>ÉPÉE</span>
          <span className="text-white/80">LVL {lvl}</span>
          <span className="tabular-nums">{xp} / {xpToNext}</span>
        </div>
        <div className="relative h-1.5 w-72 max-w-[60vw] overflow-hidden rounded-full bg-white/10">
          <div
            className="absolute inset-y-0 left-0 bg-[#9ce5ff] transition-[width] duration-100"
            style={{ width: `${xpRatio * 100}%` }}
          />
        </div>
      </div>
    </>
  );
}
