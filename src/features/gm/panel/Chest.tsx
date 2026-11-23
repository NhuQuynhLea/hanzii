/** Rương chuỗi ngày — gm.js `gmChest`. */
import { useUi } from "@/stores/ui";
import { keys, setTarget } from "@/game/engine/state";
import { callHook } from "@/services/hooks";
import { openGM } from "./GmPanel";

export function openChest(n: number): void {
  callHook("gtConfetti");
  keys.clear();
  setTarget(null);
  useUi.getState().openRoom({
    mark: "🎁",
    title: `Rương chuỗi ${n} ngày`,
    sub: "Phần thưởng giữ chuỗi học",
    body: <ChestBody />,
    variant: "default",
  });
}

function ChestBody() {
  return (
    <div className="flex flex-col items-center gap-2 py-4 text-center">
      <div className="text-[64px] leading-none">🎁</div>
      <b>+50 xu và 1 thẻ đóng băng</b>
      <p className="text-[13px] text-[#5B5A7A]">
        Dùng xu ở cửa hàng để mua đồ cho nhân vật. Thẻ đóng băng tự giữ chuỗi nếu bạn lỡ 1 ngày.
      </p>
      <button type="button" onClick={() => openGM("shop")} className="mt-2 w-full rounded-xl bg-[#EA0000] py-2.5 text-[14px] font-bold text-white">
        Xem cửa hàng
      </button>
    </div>
  );
}
