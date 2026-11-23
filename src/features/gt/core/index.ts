/**
 * GT core — hook registrations (call `registerGtCoreHooks()` once at init,
 * alongside registerMissionHooks etc. in features/register.tsx).
 *
 * Owned here (gt-core.js port):
 *   "renderGTNode"   (lv, onPickLv) → ReactNode   — renderGT (roadmap + lesson)
 *   "gtOpenLesson"   (n)                          — open lesson dialog at bài n
 *   "openGTLesson"   (n, step?)                   — deep-link into a mounted lesson
 *   "gtOpenUnlock"   (lv)                         — locked-class paywall dialog
 *   "gtStarInfo"     (n) → {n, parts}             — full star breakdown
 *   "gtStarTxt"      (k) → "★★☆"
 *   "gtLockWhy"      (i) → lock reason string
 *   "gtWordStats"    (C0?|lv?) → stats            — gtWordStats
 *   "gtClassWordStats"(lv) → stats                — gtWordStats(GT_CLASS[lv])
 *   "gtBMin"         (n, b) → minutes estimate
 *   "gtClassOf"      (n) → class index
 *   "gtStepContent"  (n, b, step) → ReactNode     — one step section
 *
 * Scene wiring (gtDrawClass/gtDrawLocked/gtClassZone/gtClassAct/gtOpenGroup/
 * openGTLib/gtWarmup/gtConfetti/askFloor/drawLibFloor + GT_ONLY boot + HUD) is
 * owned by features/gt/scene (registerGtSceneHooks, called right after this).
 *
 * Intentionally NOT registered here (already owned by other features):
 *   gtNS/gtCurB/gtBSteps/gtIsSeen/gtBDone/gtSlice/gtSeen/gtCheckDone/
 *   gtStarCheck/gtStars/gtUnlocked   → missions feature
 *   gmGate* /gtClassLesson/openGTClass/gtOnly/gmComboHit/gmCardSeen/gmBlitz/
 *   openGate/gmGoalHit               → gm feature
 *   msIdFor/msGet/msStart/chDone/gtNextAct/duoStart/duoSkip → missions feature
 *   duoRun/duoReset/duoSession       → duo feature
 */
import { createElement } from "react";
import type { ReactNode } from "react";
import { registerHook, callHook } from "@/services/hooks";
import { useUi } from "@/stores/ui";
import { GT_CLASS } from "@/game/world/geometry";
import { GtRoadmap, gtOpenUnlock } from "./GtRoadmap";
import { GtStepContent } from "./GtLesson";
import {
  classOf,
  gtBMin,
  gtCurB,
  gtL,
  gtLockWhy,
  gtSlice,
  gtStarInfo,
  gtStarTxt,
  gtWordStats,
  setGtSession,
  type GtRange,
} from "./state";

/** gt-core.js `gtOpenLesson`-style entry: open the lesson dialog at bài n. */
export function gtOpenLesson(n: number): void {
  setGtSession({ cur: n, buoi: gtCurB(n), buoiFor: n, step: "goal" });
  callHook("openLesson");
}

/** lib.js/libWrite deep-link: step into a step of bài n inside the open dialog. */
export function openGTLesson(n: number, step?: string): void {
  setGtSession({ cur: n, buoi: gtCurB(n), buoiFor: n, step: step || "goal" });
  if (!useUi.getState().room.open) callHook("openLesson");
}

let registered = false;

export function registerGtCoreHooks(): void {
  if (registered) return;
  registered = true;

  /* -------- renderGT / renderGTLesson -------- */
  registerHook(
    "renderGTNode",
    (lv, onPickLv) =>
      createElement(GtRoadmap, {
        lv: Number(lv),
        onPickLv: onPickLv as ((l: number) => void) | undefined,
      }) as ReactNode,
  );
  registerHook("gtOpenLesson", (n) => gtOpenLesson(Number(n)));
  registerHook("openGTLesson", (n, step) => openGTLesson(Number(n), step as string | undefined));
  registerHook("gtOpenUnlock", (lv) => gtOpenUnlock(Number(lv)));
  registerHook(
    "gtStepContent",
    (n, b, step) => {
      const L = gtL(Number(n));
      if (!L) return null;
      return createElement(GtStepContent, {
        n: Number(n),
        L: gtSlice(L, Number(n), Number(b) || gtCurB(Number(n))),
        step: String(step),
      }) as ReactNode;
    },
  );

  /* -------- stats / progression readers (gt-core helpers not owned by
     missions/gm) -------- */
  registerHook("gtStarInfo", (n) => gtStarInfo(Number(n)));
  registerHook("gtStarTxt", (k) => gtStarTxt(Number(k) || 0));
  registerHook("gtLockWhy", (i) => gtLockWhy(Number(i)));
  registerHook("gtWordStats", (a) =>
    a && typeof a === "object"
      ? gtWordStats(a as GtRange)
      : a && GT_CLASS[Number(a)]
        ? gtWordStats(GT_CLASS[Number(a)])
        : gtWordStats(),
  );
  registerHook("gtClassWordStats", (lv) =>
    GT_CLASS[Number(lv)] ? gtWordStats(GT_CLASS[Number(lv)]) : gtWordStats(),
  );
  registerHook("gtBMin", (n, b) => gtBMin(Number(n), Number(b)));
  registerHook("gtClassOf", (n) => classOf(Number(n)));
}
