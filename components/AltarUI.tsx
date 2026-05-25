"use client";

import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/lib/store";
import {
  BRANCH_LABEL,
  BRANCH_TINT,
  BRANCHES_OF,
  TREMPAGE,
  WEAPON_LABEL,
  WEAPON_TINT,
  type WeaponKind,
} from "@/lib/balance";
import { isWeaponMaxed, trempageLevelOf } from "@/game/progression";

export default function AltarUI() {
  const mode = useGame((s) => s.mode);
  const mithrilInRun = useGame((s) => s.mithrilInRun);
  const mithril = useGame((s) => s.mithril);
  const progression = useGame((s) => s.progression);
  const returnToIdle = useGame((s) => s.returnToIdle);
  const attemptTrempage = useGame((s) => s.attemptTrempage);
  const lastTrempage = useGame((s) => s.lastTrempage);
  const consumeLastTrempage = useGame((s) => s.consumeLastTrempage);
  const playerHp = useGame((s) => s.playerHp);
  const trempageAttempts = useGame((s) => s.trempageAttempts);
  const attemptsLeft = Math.max(0, TREMPAGE.maxAttemptsPerVisit - trempageAttempts);
  const exhausted = attemptsLeft <= 0;

  // FX feedback : flash succès/échec quand un trempage vient de résoudre.
  const [flash, setFlash] = useState<null | { success: boolean; newLevel: number; weapon: WeaponKind; branch: string }>(null);
  const [lastBranch, setLastBranch] = useState<{ weapon: WeaponKind; branch: string } | null>(null);
  useEffect(() => {
    if (!lastTrempage || !lastBranch) return;
    setFlash({ success: lastTrempage.success, newLevel: lastTrempage.newLevel, weapon: lastBranch.weapon, branch: lastBranch.branch });
    consumeLastTrempage();
    const id = setTimeout(() => setFlash(null), 1400);
    return () => clearTimeout(id);
  }, [lastTrempage, lastBranch, consumeLastTrempage]);

  // Le rituel ne propose QUE les branches de l'arme équipée — et uniquement
  // si elle est maxée à T5 sur ses 3 voies.
  const equippedWeapon = progression.equipped;
  const eligible = useMemo(() => {
    if (!isWeaponMaxed(progression, equippedWeapon)) return [];
    return (BRANCHES_OF[equippedWeapon] as readonly string[]).map((b) => ({
      weapon: equippedWeapon,
      branch: b,
    }));
  }, [progression, equippedWeapon]);

  if (mode !== "altar") return null;

  const isDeath = playerHp <= 0;
  const totalMithril = mithril + mithrilInRun;

  return (
    <div className="absolute inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/85 backdrop-blur-md">
      <div className="flex w-full max-w-2xl flex-col items-stretch gap-6 px-6 py-8">
        {/* En-tête */}
        <div className="text-center">
          <div className="font-mono text-xs tracking-[0.4em] text-amber-300/60">
            {isDeath ? "VOUS ÊTES TOMBÉ" : "L'AUTEL"}
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-white">
            Rituel de trempage
          </div>
        </div>

        {/* Récap mithril */}
        <div className="rounded-lg border-2 border-amber-400/30 bg-amber-400/[0.05] px-5 py-3 text-center">
          <div className="font-mono text-[10px] tracking-[0.3em] text-amber-300/60">
            MITHRIL DISPONIBLE
          </div>
          <div className="mt-1 font-mono text-4xl font-bold tabular-nums text-amber-200 drop-shadow-[0_2px_10px_rgba(255,196,80,0.3)]">
            {totalMithril}
          </div>
          {mithrilInRun > 0 && (
            <div className="text-[10px] font-mono text-amber-300/60">
              dont +{mithrilInRun} ramassés ce run
            </div>
          )}
        </div>

        {/* Indicateur tentatives + arme équipée */}
        <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-black/40 px-4 py-2">
          <div className="font-mono text-[11px] tracking-[0.25em]">
            <span className="text-white/40">ARME PROPOSÉE&nbsp;:&nbsp;</span>
            <span style={{ color: WEAPON_TINT[equippedWeapon] }}>{WEAPON_LABEL[equippedWeapon]}</span>
          </div>
          <div className="font-mono text-[11px] tabular-nums tracking-[0.2em]">
            <span className="text-white/40">TENTATIVES&nbsp;:&nbsp;</span>
            <span className={exhausted ? "text-red-300" : "text-amber-200"}>
              {trempageAttempts} / {TREMPAGE.maxAttemptsPerVisit}
            </span>
          </div>
        </div>

        {/* Liste des branches éligibles */}
        {eligible.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-black/40 px-4 py-6 text-center font-mono text-sm text-white/50">
            L'arme équipée ({WEAPON_LABEL[equippedWeapon]}) n'est pas maxée (T5
            sur ses 3 voies). Continue à entraîner — ou switch d'arme avant
            d'entrer dans la mine.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {eligible.map((row) => (
              <BranchRow
                key={`${row.weapon}-${row.branch}`}
                weapon={row.weapon}
                branch={row.branch}
                level={trempageLevelOf(progression, row.weapon, row.branch)}
                mithrilAvailable={totalMithril}
                disabled={exhausted}
                onAttempt={(cost) => {
                  setLastBranch({ weapon: row.weapon, branch: row.branch });
                  attemptTrempage(row.weapon, row.branch, cost);
                }}
              />
            ))}
            {exhausted && (
              <div className="rounded-md border border-red-400/30 bg-red-500/[0.06] px-3 py-2 text-center font-mono text-[11px] tracking-[0.2em] text-red-200">
                3 TENTATIVES ÉPUISÉES — REPARTIR POUR REVENIR PLUS TARD
              </div>
            )}
          </div>
        )}

        <button
          onClick={returnToIdle}
          className="mt-2 self-center rounded-md border-2 border-amber-400/60 bg-amber-400/[0.1] px-6 py-3 font-mono text-sm font-bold tracking-[0.25em] text-amber-200 transition hover:border-amber-400 hover:bg-amber-400/[0.18] active:scale-[0.97]"
        >
          REPARTIR (BANK LE MITHRIL)
        </button>
      </div>

      {/* Flash de résultat */}
      {flash && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div
            className="rounded-xl border-4 px-12 py-8 font-mono text-3xl font-bold tracking-[0.2em] drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
            style={{
              borderColor: flash.success ? "#ffd76b" : "#ff5a5a",
              background: flash.success ? "rgba(80, 50, 0, 0.85)" : "rgba(60, 20, 20, 0.85)",
              color: flash.success ? "#ffe9a8" : "#ffb8b8",
              animation: "altarPulse 1.4s ease-out forwards",
            }}
          >
            {flash.success
              ? `✦ TREMPAGE NIVEAU ${flash.newLevel}`
              : `✗ RUPTURE — RETOMBÉ À ${flash.newLevel}`}
            <div className="mt-2 text-center text-xs tracking-[0.3em]" style={{ color: flash.success ? "#ffd76b" : "#ff8a8a" }}>
              {BRANCH_LABEL[flash.weapon][flash.branch]} — {WEAPON_LABEL[flash.weapon]}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes altarPulse {
          0% { transform: scale(0.6); opacity: 0; }
          15% { transform: scale(1.1); opacity: 1; }
          40% { transform: scale(1); opacity: 1; }
          85% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.05); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function BranchRow(props: {
  weapon: WeaponKind;
  branch: string;
  level: number;
  mithrilAvailable: number;
  disabled?: boolean;
  onAttempt: (cost: number) => void;
}) {
  const [injected, setInjected] = useState(0);
  // Réinitialise le slider quand le niveau change ou que le mithril dispo baisse.
  useEffect(() => {
    setInjected((v) => Math.min(v, props.mithrilAvailable));
  }, [props.mithrilAvailable, props.level]);

  const target = props.level + 1;
  const proba = TREMPAGE.procaFinale(target, injected);
  const probaPct = Math.round(proba * 100);
  const tint = BRANCH_TINT[props.weapon][props.branch];
  const wTint = WEAPON_TINT[props.weapon];
  const max = Math.max(0, props.mithrilAvailable);

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] tracking-[0.25em]" style={{ color: wTint }}>
            {WEAPON_LABEL[props.weapon]}
          </span>
          <span className="font-mono text-sm font-bold tracking-[0.15em]" style={{ color: tint }}>
            {BRANCH_LABEL[props.weapon][props.branch]}
          </span>
        </div>
        <div className="font-mono text-xs text-white/60 tabular-nums">
          Trempage <span className="text-white">{props.level}</span> →{" "}
          <span className="text-amber-200">{target}</span>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-[1fr_auto] gap-3 items-center">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={max}
            step={1}
            value={injected}
            onChange={(e) => setInjected(Number(e.target.value))}
            className="flex-1 accent-amber-400"
            disabled={max === 0 || props.disabled}
          />
          <input
            type="number"
            min={0}
            max={max}
            value={injected}
            onChange={(e) => setInjected(Math.max(0, Math.min(max, Number(e.target.value) || 0)))}
            disabled={props.disabled}
            className="w-20 rounded border border-white/15 bg-black/40 px-2 py-1 text-right font-mono text-xs tabular-nums text-amber-100 disabled:opacity-40"
          />
          <button
            onClick={() => setInjected(max)}
            disabled={max === 0 || props.disabled}
            className="rounded border border-amber-400/40 bg-amber-400/[0.05] px-2 py-1 font-mono text-[10px] font-bold tracking-[0.2em] text-amber-200 transition hover:border-amber-400 hover:bg-amber-400/[0.15] disabled:opacity-40 disabled:hover:border-amber-400/40 disabled:hover:bg-amber-400/[0.05]"
            title="Injecter tout le mithril disponible"
          >
            MAX
          </button>
        </div>
        <div className="text-right">
          <div className="font-mono text-[9px] tracking-[0.25em] text-white/40">PROBA</div>
          <div
            className="font-mono text-xl font-bold tabular-nums"
            style={{ color: probaPct >= 70 ? "#9be4a3" : probaPct >= 40 ? "#ffe18a" : "#ff8a8a" }}
          >
            {probaPct}%
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="font-mono text-[10px] text-white/40">
          {injected > 0
            ? `Coût : ${injected} mithril · échec = -${Math.min(props.level, 10)} niveaux`
            : `Coût : 0 (proba de base) · échec = -${Math.min(props.level, 10)} niveaux`}
        </div>
        <button
          onClick={() => props.onAttempt(injected)}
          disabled={props.disabled}
          className="rounded-md border-2 border-amber-400/40 bg-amber-400/[0.08] px-3 py-1 font-mono text-xs font-bold tracking-[0.2em] text-amber-200 transition hover:border-amber-400 hover:bg-amber-400/[0.18] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-amber-400/40 disabled:hover:bg-amber-400/[0.08]"
        >
          TENTER
        </button>
      </div>
    </div>
  );
}
