"use client";

import { useGame } from "@/lib/store";

/** HUD top — juste les kills. Le reste est dans SkillTreeHUD. */
export default function HUD() {
  const kills = useGame((s) => s.kills);

  return (
    <div className="pointer-events-none absolute left-4 top-4 select-none font-mono">
      <div className="text-[10px] tracking-[0.3em] text-white/40">KILLS</div>
      <div className="text-4xl font-bold tabular-nums leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
        {kills}
      </div>
    </div>
  );
}
