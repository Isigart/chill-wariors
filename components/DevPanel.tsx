"use client";

import { useState } from "react";
import { useGame } from "@/lib/store";

/**
 * Panneau dev pour tester rapidement les mécaniques sans grinder.
 * Visible uniquement en mode idle. Bouton "DEV" qui déplie un petit menu.
 */
export default function DevPanel() {
  const [open, setOpen] = useState(false);
  const mode = useGame((s) => s.mode);
  const devMaxAllWeapons = useGame((s) => s.devMaxAllWeapons);
  const devGiveMithril = useGame((s) => s.devGiveMithril);
  const devGiveMineKeys = useGame((s) => s.devGiveMineKeys);
  const devResetAll = useGame((s) => s.devResetAll);

  if (mode !== "idle") return null;

  return (
    <div className="pointer-events-auto absolute left-4 bottom-4 select-none font-mono">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-md border border-amber-100/15 bg-black/40 px-2 py-1 text-[10px] tracking-[0.2em] text-white/40 hover:border-amber-100/40 hover:text-white/70"
        >
          [DEV]
        </button>
      ) : (
        <div className="flex flex-col gap-1.5 rounded-md border border-fuchsia-400/30 bg-black/70 px-3 py-2 backdrop-blur-sm">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-[10px] tracking-[0.25em] text-fuchsia-300/70">DEV ONLY</span>
            <button
              onClick={() => setOpen(false)}
              className="text-[10px] text-white/40 hover:text-white/80"
            >
              ✕
            </button>
          </div>
          <button
            onClick={devMaxAllWeapons}
            className="rounded border border-amber-100/15 bg-amber-100/[0.04] px-2 py-1 text-left text-[10px] text-white/80 hover:border-amber-100/30 hover:bg-amber-100/[0.1]"
          >
            ⏩ Max toutes les armes (T5 partout)
          </button>
          <button
            onClick={() => devGiveMithril(1000)}
            className="rounded border border-amber-400/30 bg-amber-400/[0.05] px-2 py-1 text-left text-[10px] text-amber-200 hover:border-amber-400/60 hover:bg-amber-400/[0.12]"
          >
            ✦ +1000 mithril
          </button>
          <button
            onClick={() => devGiveMithril(10000)}
            className="rounded border border-amber-400/30 bg-amber-400/[0.05] px-2 py-1 text-left text-[10px] text-amber-200 hover:border-amber-400/60 hover:bg-amber-400/[0.12]"
          >
            ✦✦ +10 000 mithril
          </button>
          <button
            onClick={() => devGiveMineKeys(3)}
            className="rounded border border-emerald-400/40 bg-emerald-400/[0.05] px-2 py-1 text-left text-[10px] text-emerald-200 hover:border-emerald-400/60 hover:bg-emerald-400/[0.12]"
          >
            ⚷ +3 clefs de mine
          </button>
          <button
            onClick={() => {
              if (typeof window !== "undefined" && !window.confirm("Reset complet : kills, armes, mithril, trempage, save. Sûr ?")) return;
              devResetAll();
            }}
            className="mt-1 rounded border border-red-500/40 bg-red-500/[0.06] px-2 py-1 text-left text-[10px] font-bold tracking-[0.15em] text-red-300 hover:border-red-400 hover:bg-red-500/[0.18]"
          >
            ⚠ RESET ALL
          </button>
        </div>
      )}
    </div>
  );
}
