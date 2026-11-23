/**
 * GT scene feature (gt-floors.js + gt-class.js) — hook registrations.
 *
 *   askFloor(b)              floor-picker dialog ("lop"/"thu")
 *   drawLibFloor(ctx,now)    library GT-floor canvas overlay (painters.ts)
 *   openGTLib(lv)            GT bookshelf dialog → returns true
 *   gtDrawClass(ctx,now,lv,n)  classroom board overlay
 *   gtDrawLocked(ctx,lv)     board overlay when the class has no lesson
 *   gtClassZone(x,y)         GT zones checked before standard zones
 *   gtClassAct(z)            GT zone actions (board/drive/noi/viet)
 *   gtOpenGroup(g)           corner → lesson-step jump (window._gtNext)
 *   gtOpenUnlock(lv)         locked-class dialog
 *   gtWarmup(lv)             3-question previous-lesson warmup
 *   gtConfetti()             celebration burst
 *
 * NOT registered here (owned elsewhere): openGTClass/gtClassLesson (gm
 * feature), duoStart (missions feature wraps it → duoRun), the gt-core
 * data helpers (missions feature registers them).
 */
import { registerHook } from "@/services/hooks";
import type { SceneZone } from "@/game/scenes/geometry-rooms";
import { askFloor, drawLibFloor, openGTLib, bootGtOnly } from "./floors";
import {
  gtDrawClass,
  gtDrawLocked,
  gtClassZone,
  gtClassAct,
  gtOpenGroup,
} from "./classZone";
import { gtWarmup } from "./warmup";
import { gtConfetti } from "./confetti";
import { mountGtHud } from "./hud";

let registered = false;

export function registerGtSceneHooks(): void {
  if (registered) return;
  registered = true;

  /* gt-floors.js */
  registerHook("askFloor", (b) => askFloor(String(b)));
  registerHook("drawLibFloor", (ctx, now) =>
    drawLibFloor(ctx as CanvasRenderingContext2D, Number(now)),
  );
  registerHook("openGTLib", (lv) => openGTLib(Number(lv) || 1));

  /* gt-class.js */
  registerHook("gtDrawClass", (ctx, now, lv, n) =>
    gtDrawClass(ctx as CanvasRenderingContext2D, Number(now), Number(lv), Number(n)),
  );
  registerHook("gtDrawLocked", (ctx, lv) =>
    gtDrawLocked(ctx as CanvasRenderingContext2D, Number(lv)),
  );
  registerHook("gtClassZone", (x, y) => gtClassZone(Number(x), Number(y)));
  registerHook("gtClassAct", (z) => gtClassAct(z as SceneZone));
  registerHook("gtOpenGroup", (g) => gtOpenGroup(String(g)));
  registerHook("gtWarmup", (lv) => gtWarmup(Number(lv) || 1));
  registerHook("gtConfetti", () => gtConfetti());

  /* module init: GT_ONLY curriculum rewrite + HUD mount (import-time in
   * the vanilla code). */
  try {
    bootGtOnly();
  } catch {
    /* noop */
  }
  try {
    mountGtHud();
  } catch {
    /* noop */
  }
}
