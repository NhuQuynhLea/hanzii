/**
 * Missions feature — hook wiring (port of missions.js entry points).
 *
 * Registered hooks (called by other modules):
 *  - "msStart"   (id)            → open the mission dialogue (duo.js, gt-core.js, gt-class.js)
 *  - "msIdFor"   (n,b)           → mission id for bài n buổi b, or null
 *  - "msGet"     (id)            → mission object (msGet, caches generated)
 *  - "msGen"     (n,b)           → generate a mission from a GT dialog scene
 *  - "msFr"      ()              → NPC friendship map `nh:fr` (gm.js)
 *  - "msDone"    ()              → mission play counts `nh:ms` (gt-core.js `ms_get`)
 *  - "msGloss"   ()              → MS_GLOSS dictionary (duo/engine.ts `gtPy`)
 *  - "chGet"     ()              → challenge-done flags `nh:ch`
 *  - "chDone"    (n,b)           → buổi challenge done?
 *  - "chMark"    (n,b)           → mark buổi challenge done (duo.js end)
 *  - "gtNextAct" (n,b)           → "ch" | "ms" — what to do next (gt-core.js)
 *  - "duoSkip"   (v)             → duoStart._skip flag (gt-class.js, gt-core.js)
 *  - "duoStart"  (n,b)           → wrapped entry: mission if challenge done, else forwards to "duoRun"
 *  - shared gt-core helpers used across modules (gt-core.js globals):
 *    "gtCurB", "gtBSteps", "gtIsSeen", "gtBDone", "gtNS", "gtSlice",
 *    "gtSeen", "gtCheckDone", "gtStarCheck", "gtStars", "gtUnlocked"
 *
 * Called via callHook (owned by other modules):
 *  "duoRun" (duoStart core), "duoReset" (duo=null on mission start),
 *  "gmGoalHit", "gmGateOf", "gmGatePassed", "gmCardOwn" (handled via useGm),
 *  "gtConfetti", "fbNudge".
 */
import { createElement } from "react";
import { GT_TITLES, gtLabel } from "@/data/gt-data";
import { callHook, registerHook } from "@/services/hooks";
import { useGt } from "@/stores/gt";
import { useUi } from "@/stores/ui";
import { keys, setTarget } from "@/game/engine/state";
import {
  chDone,
  chGet,
  chMark,
  getDuoSkip,
  gtBDone,
  gtBSteps,
  gtCheckDone,
  gtCurB,
  gtIsSeen,
  gtNS,
  gtNextAct,
  gtSeen,
  gtSlice,
  gtStarCheck,
  gtStars,
  gtUnlocked,
  msDone,
  msFr,
  msGen,
  msGet,
  msIdFor,
  setDuoSkip,
} from "./core";
import type { GtLesson } from "@/types/gt";
import { MS_GLOSS } from "./data";
import { MissionDialog } from "./MissionDialog";

/** msStart — open mission `id` in the room dialog (variant duo ≙ wb+duo). */
export function msStart(id: string): void {
  const M = msGet(id);
  if (!M) return;
  callHook("duoReset"); // duo = null
  useGt.getState().setSession({ cur: M.n, buoi: M.b, buoiFor: M.n });
  keys.clear();
  setTarget(null);
  const mins = Math.max(
    2,
    Math.round(M.steps.filter((x) => !/npc|auto|beat|story/.test(x.k)).length * 0.35),
  );
  useUi.getState().openRoom({
    mark: "🎯",
    title: `Nhiệm vụ – ${M.title}`,
    sub: `${gtLabel(M.n)} – ${GT_TITLES[M.n][1]} – khoảng ${mins} phút`,
    variant: "duo",
    body: createElement(MissionDialog, { id }),
  });
}

let registered = false;

export function registerMissionHooks(): void {
  if (registered) return;
  registered = true;

  registerHook("msStart", (id) => msStart(String(id)));
  registerHook("msIdFor", (n, b) => msIdFor(Number(n), Number(b)));
  registerHook("msGet", (id) => msGet(String(id)));
  registerHook("msGen", (n, b) => msGen(Number(n), Number(b)));
  registerHook("msFr", () => msFr());
  registerHook("msDone", () => msDone());
  registerHook("msGloss", () => MS_GLOSS);
  registerHook("chGet", () => chGet());
  registerHook("chDone", (n, b) => chDone(Number(n), Number(b)));
  registerHook("chMark", (n, b) => chMark(Number(n), Number(b)));
  registerHook("gtNextAct", (n, b) => gtNextAct(Number(n), Number(b)));
  registerHook("duoSkip", (v) => setDuoSkip(!!v));

  /* shared gt-core helpers (gt-core.js globals other modules consume) */
  registerHook("gtNS", (n) => gtNS(Number(n)));
  registerHook("gtCurB", (n) => gtCurB(Number(n)));
  registerHook("gtBSteps", (n, b) => gtBSteps(Number(n), Number(b)));
  registerHook("gtIsSeen", (n, b, k) => gtIsSeen(Number(n), Number(b), String(k)));
  registerHook("gtBDone", (n, b) => gtBDone(Number(n), Number(b)));
  registerHook("gtSlice", (L, n, b) => gtSlice(L as GtLesson, Number(n), Number(b)));
  registerHook("gtSeen", (n, k) => gtSeen(Number(n), String(k)));
  registerHook("gtCheckDone", (n) => gtCheckDone(Number(n)));
  registerHook("gtStarCheck", (n) => gtStarCheck(Number(n)));
  registerHook("gtStars", (n) => gtStars(Number(n)));
  registerHook("gtUnlocked", (n) => gtUnlocked(Number(n)));

  /* missions.js monkey-patch: duoStart opens the mission when the buổi's
     challenge is already done. Forwards to "duoRun" (the duo feature's
     challenge entry) with {skip:true} — equivalent to calling the original
     un-wrapped _ds, so no mission re-check recursion. */
  registerHook("duoStart", (n, b) => {
    const nn = Number(n),
      B = Number(b) || gtCurB(nn),
      id = msIdFor(nn, B);
    if (id && !getDuoSkip() && chDone(nn, B)) {
      msStart(id);
      return true;
    }
    return callHook("duoRun", nn, B, { skip: true });
  });
}
