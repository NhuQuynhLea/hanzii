/**
 * Phòng phát âm trainer entry point (scene-pron.js `openTrainer`).
 * Registers at import: "openTrainer" (level + mirror modes, called by
 * navigation pron zones) and "openPronLevel" (forwards to pron.js dialog).
 * The room scene itself (geometry/zones/painting) lives in
 * game/scenes/geometry-rooms.ts + game/engine/navigation.ts.
 */
import { createElement } from "react";
import { registerHook, callHook } from "@/services/hooks";
import { useUi } from "@/stores/ui";
import { keys, setTarget } from "@/game/engine/state";
import { getCurLevel } from "@/lib/curriculum";
import { LVN } from "@/game/world/geometry";
import { LevelTrainer } from "./LevelTrainer";
import { MirrorTrainer } from "./MirrorTrainer";

export function openTrainer(mode?: string, lv?: number): void {
  const m = mode || "mirror";
  const l = lv || getCurLevel();
  keys.clear();
  setTarget(null);
  const ui = useUi.getState();
  if (m === "mirror")
    ui.openRoom({
      mark: "镜",
      title: "Gương soi khẩu hình",
      sub: "Bật camera, vừa nhìn miệng mình vừa xem khẩu hình mẫu",
      body: createElement(MirrorTrainer),
      variant: "wb",
    });
  else
    ui.openRoom({
      mark: "音",
      title: "Luyện phát âm " + LVN(l),
      sub: "Từng từ: nghe và xem lưỡi, nói thử với đường thanh điệu, kiểm tra tai",
      body: createElement(LevelTrainer, { lv: l }),
      variant: "wb",
    });
}

registerHook("openTrainer", (mode, lv) =>
  openTrainer(mode as string | undefined, lv as number | undefined),
);

/** openPronLevel(lv) — pron.js room dialog with a fixed level (pbOpen). */
registerHook("openPronLevel", (lv) => {
  keys.clear();
  setTarget(null);
  callHook("openPron", lv ?? null);
});
