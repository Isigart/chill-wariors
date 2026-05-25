"use client";

import { useGame } from "@/lib/store";

/**
 * Onglet Réglages : préférences utilisateur (tremblement, etc.) + accès
 * aux outils DEV (max armes, +mithril, reset). Remplace le bouton flottant
 * [DEV] qu'on avait avant.
 */
export default function SettingsPanel() {
  const panel = useGame((s) => s.panel);
  const closePanel = useGame((s) => s.closePanel);
  const settings = useGame((s) => s.settings);
  const toggleScreenShake = useGame((s) => s.toggleScreenShake);
  const devMaxAllWeapons = useGame((s) => s.devMaxAllWeapons);
  const devGiveMithril = useGame((s) => s.devGiveMithril);
  const devGiveMineKeys = useGame((s) => s.devGiveMineKeys);
  const devResetAll = useGame((s) => s.devResetAll);

  if (panel !== "settings") return null;

  return (
    <div className="absolute inset-0 z-20 flex items-start justify-center overflow-y-auto bg-[#0f0805]/85 backdrop-blur-md">
      <div className="flex w-full max-w-xl flex-col items-stretch gap-3 px-3 py-6 sm:gap-4 sm:px-6 sm:py-8">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-[0.35em] text-amber-300/60 sm:text-xs sm:tracking-[0.4em]">
              ONGLET
            </div>
            <div className="mt-0.5 font-mono text-xl font-bold text-white sm:text-3xl">
              ⚙ Réglages
            </div>
          </div>
          <button
            onClick={closePanel}
            className="rounded-md border border-amber-100/20 bg-amber-100/[0.05] px-3 py-1.5 font-mono text-xs font-bold tracking-[0.2em] text-white/80 transition hover:border-amber-100/50 hover:text-white"
          >
            ✕ FERMER
          </button>
        </div>

        {/* Section Confort */}
        <Section title="Confort visuel">
          <ToggleRow
            label="Tremblement d'écran"
            description="Désactive le screen shake (kills, impacts, vagues, sacrifice…)."
            value={settings.screenShake}
            onChange={toggleScreenShake}
          />
        </Section>

        {/* Section DEV */}
        <Section title="DEV — outils de test" tone="dev">
          <button
            onClick={devMaxAllWeapons}
            className="rounded border border-amber-100/15 bg-amber-100/[0.04] px-3 py-2 text-left font-mono text-[11px] text-white/80 transition hover:border-amber-100/30 hover:bg-amber-100/[0.1]"
          >
            ⏩ Max toutes les armes (T5 partout sur les 3 voies)
          </button>
          <button
            onClick={() => devGiveMithril(1000)}
            className="rounded border border-amber-400/30 bg-amber-400/[0.05] px-3 py-2 text-left font-mono text-[11px] text-amber-200 transition hover:border-amber-400/60 hover:bg-amber-400/[0.12]"
          >
            ✦ +1 000 mithril
          </button>
          <button
            onClick={() => devGiveMithril(10000)}
            className="rounded border border-amber-400/30 bg-amber-400/[0.05] px-3 py-2 text-left font-mono text-[11px] text-amber-200 transition hover:border-amber-400/60 hover:bg-amber-400/[0.12]"
          >
            ✦✦ +10 000 mithril
          </button>
          <button
            onClick={() => devGiveMineKeys(3)}
            className="rounded border border-emerald-400/30 bg-emerald-400/[0.05] px-3 py-2 text-left font-mono text-[11px] text-emerald-200 transition hover:border-emerald-400/60 hover:bg-emerald-400/[0.12]"
          >
            ⚷ +3 clefs de mine
          </button>
          <button
            onClick={() => {
              if (typeof window !== "undefined" && !window.confirm("Reset complet : kills, armes, mithril, trempage, clefs, save. Sûr ?")) return;
              devResetAll();
            }}
            className="mt-2 rounded border border-red-500/40 bg-red-500/[0.06] px-3 py-2 text-left font-mono text-[11px] font-bold tracking-[0.15em] text-red-300 hover:border-red-400 hover:bg-red-500/[0.18]"
          >
            ⚠ RESET ALL
          </button>
        </Section>
      </div>
    </div>
  );
}

function Section(props: { title: string; tone?: "dev" | "default"; children: React.ReactNode }) {
  const isDev = props.tone === "dev";
  return (
    <div
      className="rounded-lg border-2 px-3 py-3 sm:px-4 sm:py-4"
      style={{
        borderColor: isDev ? "rgba(217, 70, 239, 0.25)" : "rgba(184, 146, 74, 0.25)",
        background: isDev ? "rgba(217, 70, 239, 0.02)" : "rgba(184, 146, 74, 0.03)",
      }}
    >
      <div
        className="mb-2 font-mono text-[10px] font-bold tracking-[0.3em] sm:text-[11px]"
        style={{ color: isDev ? "#e8a8ff" : "#e8c878" }}
      >
        {props.title.toUpperCase()}
      </div>
      <div className="flex flex-col gap-2">{props.children}</div>
    </div>
  );
}

function ToggleRow(props: {
  label: string;
  description: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="font-mono text-xs font-bold tracking-[0.15em] text-white sm:text-sm">
          {props.label}
        </div>
        <div className="font-mono text-[10px] text-white/55 sm:text-[11px]">
          {props.description}
        </div>
      </div>
      <button
        onClick={props.onChange}
        role="switch"
        aria-checked={props.value}
        className="relative h-6 w-11 shrink-0 rounded-full border-2 transition"
        style={{
          borderColor: props.value ? "#e8c878" : "rgba(255,255,255,0.2)",
          background: props.value ? "rgba(232,200,120,0.25)" : "rgba(0,0,0,0.4)",
        }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full transition-[left] duration-150"
          style={{
            left: props.value ? "20px" : "2px",
            background: props.value ? "#e8c878" : "#8a7142",
            boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
          }}
        />
      </button>
    </div>
  );
}
