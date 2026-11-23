/**
 * GT classroom hooks (gt-class.js) — blackboard overlay painter, zone
 * detection/actions, locked-board painter, unlock dialog, group helpers.
 * Cross-module services (missions, gm gates, nhIcon, fbLine) via callHook.
 */
import { BOARD, type SceneZone } from "@/game/scenes/geometry-rooms";
import { classPill } from "@/game/render/painters";
import { me } from "@/game/engine/state";
import { GT_CLASS } from "@/game/world/geometry";
import { GT_LESSONS, GT_TITLES } from "@/data/gt-data";
import { callHook } from "@/services/hooks";
import { gtState } from "@/stores/gt";
import { price } from "@/services/entitlement";
import { dstr } from "@/lib/helpers";
import { ls } from "@/lib/storage";
import {
  GT_GSTEPS,
  gtAllPaid,
  gtCurB,
  gtBDone,
  gtNS,
  gtStars,
  gtStarTxt,
  gtClassLesson,
} from "./core";

export function gtTrunc(ctx: CanvasRenderingContext2D, t: string, w: number): string {
  if (ctx.measureText(t).width <= w) return t;
  while (t.length > 1 && ctx.measureText(t + "…").width > w) t = t.slice(0, -1);
  return t + "…";
}

/* ---------- gtDrawClass (board overlay, gt-class.js) ---------- */
export function gtDrawClass(ctx: CanvasRenderingContext2D, now: number, _lv: number, n: number): void {
  const L = n ? GT_LESSONS[n] : null;
  const B = BOARD;
  if (L) {
    const k = gtStars(n);
    const cb = gtCurB(n);
    const mid = callHook<string>("msIdFor", n, cb);
    const M = mid ? callHook<{ title: string }>("msGet", mid) : null;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const T = GT_TITLES[n];
    ctx.fillStyle = "#C8102E";
    ctx.font = '700 30px "Noto Serif SC",serif';
    ctx.fillText(T[0], B.x + 16, B.y + 58);
    const zw = ctx.measureText(T[0]).width;
    ctx.fillStyle = "#14213D";
    ctx.font = '700 20px "Be Vietnam Pro",sans-serif';
    ctx.fillText(gtTrunc(ctx, T[1], B.w - zw - 150), B.x + 28 + zw, B.y + 56);
    ctx.textAlign = "right";
    ctx.fillStyle = "#F5A623";
    ctx.font = '700 18px "Be Vietnam Pro",sans-serif';
    ctx.fillText(gtStarTxt(k), B.x + B.w - 14, B.y + 52);
    ctx.textAlign = "left";
    ctx.fillStyle = "#4B5872";
    ctx.font = '600 13px "Be Vietnam Pro",sans-serif';
    {
      const tl = M ? M.title.charAt(0).toLowerCase() + M.title.slice(1) : "";
      const bd = gtBDone(n, cb);
      ctx.font = '600 14px "Be Vietnam Pro",sans-serif';
      ctx.fillText(
        gtTrunc(
          ctx,
          bd && cb >= gtNS(n)
            ? "Xong cả bài rồi, giỏi lắm! Ôn lại hoặc sang bài mới nhé."
            : bd
              ? "Xong buổi này rồi! Nghỉ chút hoặc học tiếp buổi sau nhé."
              : M && callHook<boolean>("chDone", n, cb)
                ? `Từ mới đã thuộc! Giờ thử ngay: ${tl}.`
                : M
                  ? `Học vài từ mới, rồi thử ngay: ${tl}.`
                  : "Học vài từ mới và luyện ngay nhé.",
          B.w - 28,
        ),
        B.x + 16,
        B.y + 84,
      );
    }
  }
  if (!L) return;
  const pulse = 0.5 + 0.5 * Math.sin(now / 300);
  ctx.strokeStyle = `rgba(234,0,0,${0.35 + 0.45 * pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(B.x + B.w / 2, B.y + B.h + 22, 60 + pulse * 5, (60 + pulse * 5) * 0.55, 0, 0, 7);
  ctx.stroke();
  if (!callHook<boolean>("studyHour")) classPill(ctx, "Bấm vào bảng để bắt đầu", B.x + B.w / 2, B.y + B.h + 16);
}

/* ---------- gtDrawLocked (gt-core.js) — board when class has no lesson yet ---------- */
export function gtDrawLocked(ctx: CanvasRenderingContext2D, lv: number): void {
  const C = GT_CLASS[lv];
  const B = BOARD;
  const a = C.from > 30 ? C.from - 30 : C.from;
  const b = C.to > 30 ? C.to - 30 : C.to;
  const paid = gtAllPaid();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#4B5872";
  ctx.font = '600 13px "Be Vietnam Pro",sans-serif';
  ctx.fillText(`Lớp ${C.name} – Bài ${a}–${b}`, B.x + 14, B.y + 22);
  ctx.fillStyle = "#C8102E";
  ctx.font = '700 28px "Noto Serif SC",serif';
  ctx.fillText(C.book, B.x + 16, B.y + 58);
  ctx.fillStyle = "#4B5872";
  ctx.font = '600 14px "Be Vietnam Pro",sans-serif';
  ctx.fillText(
    gtTrunc(ctx, paid ? "Bạn đã mở khoá toàn bộ – lớp này ra mắt ngày 30/11." : "Sắp ra mắt ngày 30/11.", B.w - 28),
    B.x + 16,
    B.y + 84,
  );
  if (!paid) {
    ctx.fillStyle = "#C8102E";
    ctx.font = '700 14px "Be Vietnam Pro",sans-serif';
    ctx.fillText(
      gtTrunc(ctx, `Trả ${Number(price("campus") || 69000).toLocaleString("vi-VN")}đ để mở khoá toàn bộ và học trước.`, B.w - 28),
      B.x + 16,
      B.y + 106,
    );
  }
  if (!callHook<boolean>("studyHour"))
    classPill(ctx, paid ? "Bấm vào bảng để xem lộ trình" : "Bấm vào bảng để mở khoá", B.x + B.w / 2, B.y + B.h + 16);
}

/* ---------- gtClassZone / gtClassAct (gt-class.js) ----------
 * góc nói / góc viết đã bỏ: lớp chỉ còn bảng nhiệm vụ — zone returns null. */
export function gtClassZone(_x: number, _y: number): SceneZone | null {
  if (!gtClassLesson(me.cl || 1)) return null;
  return null;
}

export function gtOpenGroup(g: string): void {
  window._gtNext = GT_GSTEPS[g];
  callHook("openLesson");
}

export function gtClassAct(z: SceneZone): boolean {
  if (z.k === "noi" || z.k === "viet") {
    gtOpenGroup(z.k);
    return true;
  }
  if (z.k === "board") {
    const n = gtClassLesson(me.cl || 1);
    if (n) callHook("duoStart", n);
    else callHook("gtOpenUnlock", me.cl || 1);
    return true;
  }
  if (z.k === "drive") {
    callHook("openGTLib", me.cl || 1);
    return true;
  }
  if (z.k === "sit") return false;
  return false;
}

/* ---------- gtOpenUnlock (gt-core.js) — unlock / coming-soon dialog ---------- */
/* canonical React port lives in features/gt/core/GtRoadmap.tsx, registered
 * as the "gtOpenUnlock" hook — gtClassAct calls it via callHook above. */

/* openGTClass + the gtOnly flag live in features/gm/state.ts (gm.js owns the
 * GT-class router and resets gtOnly when the room dialog closes). */

/* ---------- gtWarmup entry check helper ---------- */
export function gtWarmupData(lv: number): { prev: number; ok: boolean } {
  const st = gtState();
  const c = GT_CLASS[lv];
  let prev = 0;
  for (let i = c.from; i <= c.to; i++) if (st.done[i] && GT_LESSONS[i]) prev = i;
  return { prev, ok: !!prev && ls.get("nh:warm") !== dstr() + ":" + lv };
}
