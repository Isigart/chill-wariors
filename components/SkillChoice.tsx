"use client";

import { useGame } from "@/lib/store";
import { BALANCE, SWORD_BRANCHES, type SwordBranch } from "@/lib/balance";
import { branchHeight, isBranchMaxed } from "@/game/skills";

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

/**
 * Modal de choix de palier. Affichée quand `pendingChoice` est non-null
 * dans le store. Pause implicite : le canvas check `pendingChoice` et
 * skip le tick.
 */
export default function SkillChoice() {
  const pendingChoice = useGame((s) => s.pendingChoice);
  const skills = useGame((s) => s.skills);
  const confirm = useGame((s) => s.confirmSkillChoice);

  if (!pendingChoice) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/65 backdrop-blur-sm">
      <div className="flex w-full max-w-3xl flex-col items-center gap-6 px-6">
        <div className="text-center">
          <div className="font-mono text-xs tracking-[0.3em] text-white/40">PALIER DÉBLOQUÉ</div>
          <div className="mt-1 font-mono text-2xl font-bold text-white">Choisis une voie</div>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {SWORD_BRANCHES.map((branch) => {
            const maxed = isBranchMaxed(skills, branch);
            const nextIdx = branchHeight(skills, branch); // 0-based : prochain tier dispo
            const def = !maxed ? BALANCE.swordTree[branch][nextIdx] : null;
            const tint = BRANCH_TINT[branch];

            return (
              <button
                key={branch}
                disabled={maxed}
                onClick={() => confirm(branch)}
                className={`group relative flex flex-col gap-3 rounded-lg border-2 border-white/15 bg-white/[0.03] p-5 text-left font-mono transition ${
                  maxed
                    ? "cursor-not-allowed opacity-30"
                    : "hover:border-white/40 hover:bg-white/[0.06] active:scale-[0.98]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="text-[10px] font-bold tracking-[0.3em]"
                    style={{ color: tint }}
                  >
                    {BRANCH_LABEL[branch]}
                  </div>
                  <div className="text-xs text-white/40">
                    {maxed ? "MAX" : `T${nextIdx + 1}/${BALANCE.swordTree[branch].length}`}
                  </div>
                </div>
                <div className="text-base leading-snug text-white">
                  {maxed ? "Cette voie est complète" : def?.label}
                </div>
              </button>
            );
          })}
        </div>

        <div className="font-mono text-xs text-white/30">
          Clique une voie pour appliquer immédiatement le palier.
        </div>
      </div>
    </div>
  );
}
