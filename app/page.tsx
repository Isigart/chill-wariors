import GameCanvas from "@/components/GameCanvas";
import HUD from "@/components/HUD";
import SkillChoice from "@/components/SkillChoice";

export default function Page() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-[#0a0a0f]">
      <GameCanvas />
      <HUD />
      <SkillChoice />
    </main>
  );
}
