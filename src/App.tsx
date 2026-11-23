import { useEffect, type ReactNode } from "react";
import { GameWorld } from "@/components/world/GameWorld";
import { Gate } from "@/components/gate/Gate";
import { BrandBar } from "@/components/hud/BrandBar";
import { Toast } from "@/components/hud/Toast";
import { ZonePill, EnterButton } from "@/components/hud/ZonePill";
import { BottomBar } from "@/components/hud/BottomBar";
import { ProgressPill } from "@/components/hud/ProgressPill";
import { Academy } from "@/components/hud/Academy";
import { RoomDialog } from "@/components/dialogs/RoomDialog";
import { BuyDialog } from "@/components/dialogs/BuyDialog";
import { useUi } from "@/stores/ui";
import { connectPresence } from "@/services/presence/runtime";
import { callHook, registerHook } from "@/services/hooks";
import { registerFeatureHooks } from "@/features/register";
import { TdLayer } from "@/features/td";
import { SocialHosts } from "@/features/social";
import "@/services/emotes";
import "@/features/nv";

function App() {
  const setAcad = useUi((s) => s.setAcad);
  const setBuy = useUi((s) => s.setBuyOpen);

  useEffect(() => {
    connectPresence();
    registerFeatureHooks();
    registerHook("openAcademy", () => setAcad(true));
    registerHook("buyWeb", () => setBuy(true));
    registerHook("openBuy", () => setBuy(true));
  }, [setAcad, setBuy]);

  return (
    <>
      <GameWorld />
      <BrandBar />
      <ZonePill />
      <EnterButton />
      <BottomBar />
      <ProgressPill />
      {callHook<ReactNode>("nvQuestNode")}
      <Academy />
      <SocialHosts />
      <RoomDialog />
      <TdLayer />
      <BuyDialog />
      <Toast />
      <Gate />
      <div className="pointer-events-none fixed bottom-1.5 left-1/2 z-40 -translate-x-1/2 rounded-full bg-[#050349] px-3 py-1 text-[12px] font-bold text-[#FFE7A8] opacity-90">
        Bản mở khoá toàn bộ
      </div>
    </>
  );
}

export default App;
