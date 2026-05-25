import GameCanvas from "@/components/GameCanvas";
import HUD from "@/components/HUD";
import SkillTreeHUD from "@/components/SkillTreeHUD";
import AltarUI from "@/components/AltarUI";
import InventoryPanel from "@/components/InventoryPanel";
import DungeonPanel from "@/components/DungeonPanel";
import DevPanel from "@/components/DevPanel";

export default function Page() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-[#1a1410]">
      <GameCanvas />
      <HUD />
      <SkillTreeHUD />
      <InventoryPanel />
      <DungeonPanel />
      <AltarUI />
      <DevPanel />
    </main>
  );
}
