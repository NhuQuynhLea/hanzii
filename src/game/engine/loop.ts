/**
 * Game loop (loop.js `frame`). One rAF drives: movement+collision, remote
 * lerp, zone detection, camera, then per-scene renderers.
 * UI state changes flow to React via stores; renderers write DOM/canvas
 * imperatively through `onFrame` subscriptions.
 */
import { me, keys, setTarget, target, zoneNow, setZoneNow } from "./state";
import { SPEED, blocked, zoneOf, ENTER } from "@/game/world/geometry";
import { SEATS, cblocked, pblocked, rblocked } from "@/game/scenes/geometry-rooms";
import {
  AUTO_ENTER, atDoor, enterText, navState, classZone, pronZone, roomZone,
  leaveClass, leavePron, leaveRoomScene, doEnter, pushing, outReady, classAction, pronAction, roomAction, lvName,
} from "./navigation";
import { clsName, GT_ONLY, FLR } from "@/game/world/geometry";
import { RS, RID } from "@/game/scenes/geometry-rooms";
import { getCurLevel } from "@/lib/curriculum";
import { usePlayer } from "@/stores/player";
import { usePresence } from "@/stores/presence";
import { useUi } from "@/stores/ui";
import { sendMove } from "@/services/presence/runtime";

export type FrameFn = (now: number, dt: number) => void;
const frameFns = new Set<FrameFn>();

/** Subscribe to every animation frame (after tick). Returns unsubscribe. */
export function onFrame(fn: FrameFn): () => void {
  frameFns.add(fn);
  return () => frameFns.delete(fn);
}

let wasMoving = false;
let last = performance.now();
let rafId = 0;
let running = false;

function blocker(): (x: number, y: number) => boolean {
  if (me.sc === 1) return cblocked;
  if (me.sc === 2) return pblocked;
  if (me.sc >= 3) return (x, y) => rblocked(x, y, me.sc);
  return blocked;
}

function tick(dt: number): void {
  const { entered } = usePlayer.getState();
  const roomOpen = useUi.getState().room.open;
  if (entered && !roomOpen) {
    const B = blocker();
    let dx = 0,
      dy = 0;
    if (keys.has("u")) dy--;
    if (keys.has("d")) dy++;
    if (keys.has("l")) dx--;
    if (keys.has("r")) dx++;
    if (!dx && !dy && target) {
      const vx = target.x - me.x,
        vy = target.y - me.y,
        L = Math.hypot(vx, vy);
      if (L < 5) setTarget(null);
      else {
        dx = vx / L;
        dy = vy / L;
      }
    }
    if ((dx || dy) && me.seat >= 0) {
      const p = SEATS[me.seat];
      me.seat = -1;
      me.x = p.x;
      me.y = p.y + 44;
    }
    if (dx || dy) {
      const L = Math.hypot(dx, dy),
        mx = (dx / L) * SPEED * dt,
        my = (dy / L) * SPEED * dt;
      let moved = false;
      if (!B(me.x + mx, me.y)) {
        me.x += mx;
        moved = true;
      }
      if (!B(me.x, me.y + my)) {
        me.y += my;
        moved = true;
      }
      if (!moved) setTarget(null);
      me.d = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0;
      me.m = moved ? 1 : 0;
      me.walk += dt;
      sendMove(false);
      wasMoving = true;
    } else {
      me.m = 0;
      if (wasMoving) {
        wasMoving = false;
        sendMove(true);
      }
    }
  }

  // remote lerp
  usePresence.getState().others.forEach((o) => {
    const k = 1 - Math.pow(0.0005, dt);
    o.x += (o.tx - o.x) * k;
    o.y += (o.ty - o.y) * k;
    if (o.m) o.walk += dt;
  });
}

/** Campus zone detection + auto-enter (loop.js mid-section). */
function campusZone(now: number): void {
  const z = zoneOf(me.x, me.y);
  const ui = useUi.getState();
  if (z !== zoneNow) {
    setZoneNow(z);
    navState.zoneT = now;
    navState.autoFired = false;
    if (navState.autoSkip && z !== navState.autoSkip) navState.autoSkip = "";
  }
  if (!keys.size && !target) navState.autoFired = false;
  if (
    AUTO_ENTER.has(zoneNow) &&
    zoneNow !== navState.autoSkip &&
    !navState.autoFired &&
    !ui.room.open &&
    me.sc === 0 &&
    me.d === 3 &&
    pushing("u") &&
    atDoor(zoneNow)
  ) {
    navState.autoFired = true;
    doEnter();
  }
  ui.setZone(z, ENTER[z] ? (AUTO_ENTER.has(z) ? "Đi vào cửa" : enterText(z)) : undefined);
}

/** Interior zone detection + enter label + auto-exit (drawXxx tail logic). */
function interiorZone(now: number): void {
  const ui = useUi.getState();

  if (me.sc === 1) {
    const z = classZone();
    const key = z ? z.k + (z.seat ?? "") : "";
    const prev = navState.cz;
    const pkey = prev ? prev.k + (prev.seat ?? "") : "";
    if (key !== pkey) {
      navState.cz = z;
      if (z && z.k === "out") navState.outT = now;
      else navState.outSkip = false;
      if (z && z.k === "sit") {
        const zz = z;
        setTimeout(() => {
          if (navState.cz && navState.cz.k === "sit" && navState.cz.seat === zz.seat && me.sc === 1 && me.seat < 0 && !useUi.getState().room.open)
            classAction(navState.cz);
        }, 300);
      }
    }
    if (navState.cz && navState.cz.k === "out" && outReady(navState.outSkip)) {
      leaveClass();
      return;
    }
    ui.setZone(
      (z && z.k === "stand" ? "Đang ngồi học, lớp " : "Lớp ") + clsName(me.cl || getCurLevel()) + (GT_ONLY ? "" : FLR.lop === "gt" ? " – Tầng 2" : " – Tầng 1"),
      z && z.k !== "stand" ? z.label || "" : "",
    );
    return;
  }

  if (me.sc === 2) {
    const z = pronZone();
    const key = z ? z.k + (z.lv || "") : "";
    const prev = navState.pz;
    const pkey = prev ? prev.k + (prev.lv || "") : "";
    if (key !== pkey) {
      navState.pz = z;
      if (z && z.k === "out") navState.outT = now;
      else navState.outSkip = false;
      if (z && (z.k === "lv" || z.k === "mirror" || z.k === "rp")) {
        const zz = z;
        setTimeout(() => {
          if (navState.pz && navState.pz.k === zz.k && (navState.pz.lv || 0) === (zz.lv || 0) && me.sc === 2 && !useUi.getState().room.open)
            pronAction(navState.pz);
        }, 300);
      }
    }
    if (navState.pz && navState.pz.k === "out" && outReady(navState.outSkip)) {
      leavePron();
      return;
    }
    ui.setZone(z && z.k === "lv" ? "Phòng phát âm, khu " + lvName(z.lv!) : "Phòng phát âm", z ? z.label || "" : "");
    return;
  }

  // phòng chung
  const z = roomZone();
  const key = z ? z.k + (z.lv || "") + (z.i ?? "") : "";
  const prev = navState.rz;
  const pkey = prev ? prev.k + (prev.lv || "") + (prev.i ?? "") : "";
  if (key !== pkey) {
    navState.rz = z;
    if (z && z.k === "out") navState.outT = now;
    else {
      navState.outSkip = false;
      if (z) {
        const zz = z;
        setTimeout(() => {
          if (navState.rz && navState.rz.k === zz.k && (navState.rz.lv || 0) === (zz.lv || 0) && me.sc >= 3 && !useUi.getState().room.open)
            roomAction(navState.rz);
        }, 350);
      }
    }
  }
  if (navState.rz && navState.rz.k === "out" && outReady(navState.outSkip)) {
    leaveRoomScene();
    return;
  }
  const id = RID[me.sc] || "thu";
  ui.setZone(
    RS[id].vi + (me.sc === 3 && !GT_ONLY ? (FLR.thu === "gt" ? " – Tầng 2 Giao tiếp" : " – Tầng 1 HSK") : ""),
    z ? z.label || "" : "",
  );
}

function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  tick(dt);
  if (me.sc === 0) campusZone(now);
  else if (usePlayer.getState().entered) interiorZone(now);
  frameFns.forEach((fn) => {
    try {
      fn(now, dt);
    } catch (e) {
      console.error("[frame]", e);
    }
  });
  rafId = requestAnimationFrame(frame);
}

export function startLoop(): void {
  if (running) return;
  running = true;
  last = performance.now();
  rafId = requestAnimationFrame(frame);
}

export function stopLoop(): void {
  running = false;
  cancelAnimationFrame(rafId);
}
