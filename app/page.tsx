import GameCanvas from "@/components/GameCanvas";
import HUD from "@/components/HUD";
import SkillTreeHUD from "@/components/SkillTreeHUD";
import AltarUI from "@/components/AltarUI";

export default function Page() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-[#0a0a0f]">
      <GameCanvas />
      <HUD />
      <SkillTreeHUD />
      <AltarUI />
    </main>
  );
}
