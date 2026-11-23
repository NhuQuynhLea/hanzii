/**
 * features/nv — port of game/js/nv-quest.js (nhiệm vụ ngày, SRS, khoá khu,
 * trò chuyện 5 từ mới, widget "Mục tiêu hôm nay", mũi tên chỉ đường canvas).
 * Importing this module registers all `nv*`/`soon*`/`drawQuest` hooks.
 */
import type { ReactNode } from "react";
import { registerHook, emitHook } from "@/services/hooks";
import { soonLocked, nvLocked, nvLockMsg, openSoon } from "./locks";
import { nvOpenReview } from "./review";
import { nvOpenChat } from "./chat";
import { nvTasks, nvTasksGo, nvFinish } from "./tasks";
import { nvSrs, nvSrsSet, type SrsEntry } from "./srs";
import { drawQuest } from "./draw";
import { NvQuest } from "./NvQuest";

registerHook("soonLocked", (z) => soonLocked(String(z)));
registerHook("nvLocked", (z) => nvLocked(String(z)));
registerHook("nvLockMsg", (z) => nvLockMsg(String(z)));
registerHook("openSoon", (z) => openSoon(String(z)));
registerHook("nvOpenChat", () => nvOpenChat());
registerHook("nvOpenReview", () => nvOpenReview());
registerHook("nvFinish", () => nvFinish());
registerHook("nvTasks", () =>
  nvTasks().map((t) => ({ k: t.k, label: t.t, done: t.done, go: t.go })),
);
registerHook("nvTasksGo", (k) => nvTasksGo(String(k)));
registerHook("nvSrs", () => nvSrs());
registerHook("nvSrsSet", (zh, e) => nvSrsSet(String(zh), e as SrsEntry));
registerHook("drawQuest", (ctx, now) =>
  drawQuest(ctx as CanvasRenderingContext2D, Number(now)),
);
/** callHook("nvPaint") — bản gốc gọi repaint trực tiếp; ở đây emit để widget tự vẽ lại. */
registerHook("nvPaint", () => emitHook("nvPaint"));
registerHook("nvQuestNode", () => <NvQuest /> as ReactNode);

export { NvQuest };
export { soonLocked, nvLocked, nvLockMsg, openSoon } from "./locks";
export { nvDay, nvSrs, nvSrsSet, nvDue, NV_GAP, type SrsEntry, type SrsMap } from "./srs";
export { nvOpenReview } from "./review";
export { nvOpenChat } from "./chat";
export { nvTasks, nvTasksGo, nvCurrent, nvFinish, type NvTask } from "./tasks";
export { drawQuest } from "./draw";
