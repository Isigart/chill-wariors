"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/store";
import {
  BALANCE,
  SWORD_BRANCHES,
  maxAccessibleTier,
  type SwordBranch,
} from "@/lib/balance";
import {
  branchHeight,
  canTakeNextTier,
  canUnlockNextBracket,
  sacrificeCandidates,
} from "@/game/skills";

const BRANCH_LABEL: Record<SwordBranch, string> = {
  speed: "VITESSE",
  range: "PORTÉE",
  damage: "DÉGÂTS",
};

const BRANCH_TINT: Record<SwordBranch, string> = {
  speed: "#7fd0ff",
  range: "#9be4a3",
  damage: "#ff8a3d",
};

const BRACKET_LABEL = ["VOIES SUPÉRIEURES", "VOIES FINALES"];

/**
 * Modal de choix de palier. Affichée quand `pendingChoice` est non-null.
 * Flow 2-step :
 *   1. choose-action : tier suivant OU déclencher un sacrifice.
 *   2. choose-sacrifice : sélectionner la voie à sceller.
 */
export default function SkillChoice() {
  const pendingChoice = useGame((s) => s.pendingChoice);
  const skills = useGame((s) => s.skills);
  const sealedBranches = useGame((s) => s.sealedBranches);
  const extendedTier = useGame((s) => s.extendedTier);
  const takeNextTier = useGame((s) => s.takeNextTier);
  const sacrificeFor = useGame((s) => s.sacrificeFor);

  const [step, setStep] = useState<"action" | "sacrifice">("action");
  const [unlockTarget, setUnlockTarget] = useState<SwordBranch | null>(null);

  // Reset le flow chaque fois qu'une nouvelle modale s'ouvre.
  useEffect(() => {
    if (pendingChoice) {
      setStep("action");
      setUnlockTarget(null);
    }
  }, [pendingChoice]);

  if (!pendingChoice) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/65 backdrop-blur-sm">
      <div className="flex w-full max-w-4xl flex-col items-center gap-6 px-6">
        {step === "action" ? (
          <ActionStep
            skills={skills}
            sealedBranches={sealedBranches}
            extendedTier={extendedTier}
            onPickTier={(branch) => takeNextTier(branch)}
            onUnlockRequest={(branch) => {
              setUnlockTarget(branch);
              setStep("sacrifice");
            }}
          />
        ) : (
          <SacrificeStep
            target={unlockTarget!}
            skills={skills}
            sealedBranches={sealedBranches}
            extendedTier={extendedTier}
            onSacrifice={(sacrificed) => sacrificeFor(unlockTarget!, sacrificed)}
            onCancel={() => setStep("action")}
          />
        )}
      </div>
    </div>
  );
}

/* ----- Step 1 ----- */

function ActionStep(props: {
  skills: { branch: SwordBranch; tier: number }[];
  sealedBranches: SwordBranch[];
  extendedTier: number;
  onPickTier: (b: SwordBranch) => void;
  onUnlockRequest: (b: SwordBranch) => void;
}) {
  return (
    <>
      <div className="text-center">
        <div className="font-mono text-xs tracking-[0.3em] text-white/40">PALIER DÉBLOQUÉ</div>
        <div className="mt-1 font-mono text-2xl font-bold text-white">Choisis une voie</div>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        {SWORD_BRANCHES.map((branch) => {
          const sealed = props.sealedBranches.includes(branch);
          const h = branchHeight(props.skills, props.sealedBranches, branch);
          const canTake = canTakeNextTier(props.skills, props.sealedBranches, props.extendedTier, branch);
          const canUnlock = canUnlockNextBracket(props.skills, props.sealedBranches, props.extendedTier, branch);
          const tint = BRANCH_TINT[branch];

          if (sealed) {
            return (
              <DisabledCard key={branch} tint={tint} label={BRANCH_LABEL[branch]} note="SCELLÉE" />
            );
          }

          if (canTake) {
            const def = BALANCE.swordTree[branch][h];
            const cap = maxAccessibleTier(props.extendedTier);
            return (
              <ActionCard
                key={branch}
                tint={tint}
                topLeft={BRANCH_LABEL[branch]}
                topRight={`T${h + 1}/${cap}`}
                title={def.label}
                onClick={() => props.onPickTier(branch)}
              />
            );
          }

          if (canUnlock) {
            const nextBracket = BRACKET_LABEL[props.extendedTier];
            return (
              <ActionCard
                key={branch}
                tint={tint}
                topLeft={BRANCH_LABEL[branch]}
                topRight="DÉBLOQUER"
                title={nextBracket}
                subtitle="Demande un sacrifice"
                onClick={() => props.onUnlockRequest(branch)}
              />
            );
          }

          return (
            <DisabledCard key={branch} tint={tint} label={BRANCH_LABEL[branch]} note="MAX" />
          );
        })}
      </div>

      <div className="font-mono text-xs text-white/30">
        Click rapide. Tout est définitif.
      </div>
    </>
  );
}

/* ----- Step 2 ----- */

function SacrificeStep(props: {
  target: SwordBranch;
  skills: { branch: SwordBranch; tier: number }[];
  sealedBranches: SwordBranch[];
  extendedTier: number;
  onSacrifice: (b: SwordBranch) => void;
  onCancel: () => void;
}) {
  const candidates = sacrificeCandidates(props.sealedBranches, props.target);
  const tint = BRANCH_TINT[props.target];
  const targetHeight = branchHeight(props.skills, props.sealedBranches, props.target);
  const grantedTier = targetHeight + 1;
  const grantedDef = BALANCE.swordTree[props.target][grantedTier - 1];

  return (
    <>
      <div className="text-center">
        <div className="font-mono text-xs tracking-[0.3em]" style={{ color: tint }}>
          SACRIFICE REQUIS
        </div>
        <div className="mt-1 font-mono text-2xl font-bold text-white">
          Quelle voie scelles-tu ?
        </div>
      </div>

      {/* Récap du gain : tier accordé + bracket débloqué. */}
      <div className="rounded-lg border border-white/10 bg-white/[0.04] px-5 py-3 font-mono">
        <div className="flex items-baseline justify-center gap-3 text-xs">
          <span className="text-white/40">EN RETOUR&nbsp;:</span>
          <span style={{ color: tint }}>
            T{grantedTier} {BRANCH_LABEL[props.target]} — {grantedDef?.label}
          </span>
        </div>
        <div className="mt-1 text-center text-[10px] tracking-[0.2em] text-white/30">
          + {BRACKET_LABEL[props.extendedTier]} accessibles pour toutes les voies vivantes
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {candidates.map((branch) => {
          const h = branchHeight(props.skills, props.sealedBranches, branch);
          const bTint = BRANCH_TINT[branch];
          return (
            <button
              key={branch}
              onClick={() => props.onSacrifice(branch)}
              className="group relative flex flex-col gap-3 rounded-lg border-2 border-white/15 bg-white/[0.03] p-5 text-left font-mono transition hover:border-red-400/50 hover:bg-red-500/[0.06] active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold tracking-[0.3em]" style={{ color: bTint }}>
                  {BRANCH_LABEL[branch]}
                </div>
                <div className="text-xs text-red-300/80">
                  {h > 0 ? `T${h} PERDU` : "0 INVESTI"}
                </div>
              </div>
              <div className="text-base leading-snug text-white">
                Sceller définitivement
              </div>
              <div className="text-xs text-white/40">
                Plus aucun bonus de cette voie. Plus aucun futur tier.
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={props.onCancel}
        className="font-mono text-xs tracking-[0.2em] text-white/40 hover:text-white/70"
      >
        ← Annuler
      </button>
    </>
  );
}

/* ----- Cartes utilitaires ----- */

function ActionCard(props: {
  tint: string;
  topLeft: string;
  topRight: string;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={props.onClick}
      className="group relative flex flex-col gap-3 rounded-lg border-2 border-white/15 bg-white/[0.03] p-5 text-left font-mono transition hover:border-white/40 hover:bg-white/[0.06] active:scale-[0.98]"
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold tracking-[0.3em]" style={{ color: props.tint }}>
          {props.topLeft}
        </div>
        <div className="text-xs text-white/40">{props.topRight}</div>
      </div>
      <div className="text-base leading-snug text-white">{props.title}</div>
      {props.subtitle && (
        <div className="text-xs text-white/40">{props.subtitle}</div>
      )}
    </button>
  );
}

function DisabledCard(props: { tint: string; label: string; note: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border-2 border-white/10 bg-white/[0.01] p-5 font-mono opacity-30">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold tracking-[0.3em]" style={{ color: props.tint }}>
          {props.label}
        </div>
        <div className="text-xs text-white/40">{props.note}</div>
      </div>
      <div className="text-base text-white/60">—</div>
    </div>
  );
}
