/**
 * Phòng phát âm — pron.js `openPron` hook.
 *
 * The engine/nav calls `callHook("openPron")` (room "am") or
 * `callHook("openPron", lv)` from the pronunciation scene's
 * `openPronLevel(lv)` (scene-pron port). `fixLv` pins the level tab and
 * retitles the room to "Khu phát âm <LVN>".
 *
 * Import this module once (side effect) so the hook is registered.
 */
import { createElement } from "react";
import { registerHook } from "@/services/hooks";
import { useUi } from "@/stores/ui";
import { keys, setTarget } from "@/game/engine/state";
import { campusActive } from "@/services/entitlement";
import { GT_ONLY, LVN } from "@/game/world/geometry";
import { PronDialog } from "./PronDialog";
import { PronRecorder } from "./PronRecorder";
import { pronLvSet } from "./lessons";

/** pron.js `subT()` — room subtitle, level-independent. */
export const pronSub = (): string =>
  GT_ONLY
    ? "Luyện phát âm từ của các bài Giao tiếp"
    : campusActive()
      ? "Thẻ học viên: mở tất cả bài"
      : "Bản miễn phí: mở sẵn 3 bài, mỗi ngày thêm 1 bài";

registerHook("openPron", (fixLv?: unknown) => {
  const lv = typeof fixLv === "number" && fixLv > 0 ? fixLv : null;
  pronLvSet(lv);
  keys.clear();
  setTarget(null);
  useUi.getState().openRoom({
    mark: "音",
    title: lv ? "Khu phát âm " + LVN(lv) : "Phòng phát âm",
    sub: pronSub(),
    body: createElement(PronDialog, { fixLv: lv ?? undefined }),
    variant: "default",
  });
});

/* pron.js `pronRecorder()` — the GT "Luyện nói" step (and any other feature)
 * renders the shared recorder through this hook. */
registerHook("pronRecorder", (word, resetKey, onModel) =>
  createElement(PronRecorder, {
    word: word as never,
    resetKey: Number(resetKey) || 0,
    onModel: onModel as () => void,
  }),
);
