/**
 * Dialog openers (lib.js `libPanel`/`openLibShelf`/`libMyWords`/`libBooks`/
 * `libDocs`/`libEnd`). Each opener fills the shared room dialog via useUi.
 */
import type { ReactNode } from "react";
import { keys, setTarget } from "@/game/engine/state";
import { useUi } from "@/stores/ui";
import { useWm } from "@/stores/wm";
import { usePlayer } from "@/stores/player";
import { callHook } from "@/services/hooks";
import { sfx } from "@/services/sfx";
import { dstr } from "@/lib/helpers";
import { LibMyWords } from "./MyWords";
import { LibBooks } from "./Books";
import { LibDocs } from "./Docs";
import { LibEndPanel } from "./EndPanel";
import { libScene, libTones, libTable } from "./flow";
import type { LibEndInfo } from "./data";

/** lib.js `libPanel`: reset header + open the room dialog with a panel body. */
function libPanel(title: string, sub: string, mark: string, body: ReactNode): void {
  keys.clear();
  setTarget(null);
  useUi.getState().openRoom({ mark: mark || "书", title, sub, body, variant: "default" });
}

export function libMyWords(): void {
  libPanel("🗂 Từ của tôi", "Từ bạn đã gặp trong Thử thách và Nhiệm vụ. Ôn đúng thì từ lên ngăn trên, lâu không ôn sẽ tụt xuống.", "🗂", <LibMyWords />);
}

export function libBooks(lv: number): void {
  libPanel("📚 Giáo trình", "Mỗi cuốn là một bài. Ôn nhanh từ của bài, hoặc lên lớp học tiếp.", "📚", <LibBooks startLv={lv} />);
}

export function libDocs(): void {
  libPanel("⬇ Tài liệu", "Sách giáo khoa chuẩn của khoá học và tài liệu miễn phí để tải về.", "⬇", <LibDocs />);
}

/** lib.js `openLibShelf`: shelf index 0 my-words, 1 textbook, 2 docs. */
export function openLibShelf(i: number): void {
  if (i === 0) return libMyWords();
  if (i === 1) return libBooks(1);
  return libDocs();
}

/**
 * lib.js `libEnd`: review-session summary, called by the duo feature when a
 * `review` session's queue is empty. Accepts a session snapshot
 * ({t0|sec,total,wrong,review,rvTitle}); falls back to callHook("duoSession").
 */
export function libEnd(info?: LibEndInfo): void {
  const d = info || callHook<LibEndInfo>("duoSession") || {};
  const total = d.total ?? 0,
    wrong = d.wrong ?? 0,
    sec = d.sec ?? (d.t0 ? Math.round((Date.now() - d.t0) / 1000) : 0),
    acc = Math.round((100 * (total - wrong)) / Math.max(1, total)),
    kind = d.review || "word",
    title = d.rvTitle || "Ôn tập";
  usePlayer.getState().award(`rv:${kind}:${dstr()}`, 5, "ôn ở thư viện");
  const B = useWm.getState().buckets();
  const again = () => {
    if (kind === "scene") libScene();
    else if (kind === "tone") libTones();
    else libTable(0);
  };
  useUi.getState().setRoomBody(<LibEndPanel acc={acc} sec={sec} title={title} buckets={B} onAgain={again} />);
  try {
    sfx("win");
    if (acc >= 90) callHook("gtConfetti");
  } catch {
    /* noop */
  }
}
