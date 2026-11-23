/** Viewport camera — computes view.s/ox/oy and writes the world transform. */
import { view } from "./state";
import { W, H } from "@/game/world/geometry";
import { CW, CH } from "@/game/scenes/geometry-rooms";

export interface CameraResult {
  s: number;
  ox: number;
  oy: number;
  vw: number;
  vh: number;
}

/** loop.js camera for the campus (world W×H). */
export function cameraCampus(cx: number, cy: number, cw: number, ch: number): CameraResult {
  const s = Math.max(0.7, Math.min(1.15, Math.max(cw / 1000, ch / 800)));
  view.s = s;
  const vw = cw / s;
  const vh = ch / s;
  view.ox = vw >= W ? (W - vw) / 2 : Math.max(0, Math.min(W - vw, cx - vw / 2));
  view.oy = vh >= H ? (H - vh) / 2 : Math.max(0, Math.min(H - vh, cy - vh / 2));
  return { s, ox: view.ox, oy: view.oy, vw, vh };
}

/** scene-class camera for interiors (CW×CH). */
export function cameraRoom(cx: number, cy: number, cw: number, ch: number): CameraResult {
  const s = Math.max(0.8, Math.min(cw / (CW + 20), (ch - 140) / CH, 1.3));
  view.s = s;
  const vw = cw / s;
  const vh = ch / s;
  view.ox = vw >= CW ? (CW - vw) / 2 : Math.max(0, Math.min(CW - vw, cx - vw / 2));
  view.oy = vh >= CH ? (CH - vh) / 2 : Math.max(0, Math.min(CH - vh, cy - vh / 2));
  return { s, ox: view.ox, oy: view.oy, vw, vh };
}
