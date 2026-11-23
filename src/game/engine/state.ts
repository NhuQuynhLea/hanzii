/**
 * Mutable game-world state — the render-loop hot path.
 * These replace the original globals `me`, `keys`, `target`, `view`, `zoneNow`.
 * Values here are NOT React state; the loop mutates them every frame and the
 * DOM renderers write styles directly. Discrete changes (zone, scene) are
 * mirrored into zustand stores for React.
 */
import { COLORS, type PlayerState } from "@/types/player";

export const me: PlayerState = {
  x: 740, y: 900, tx: 740, ty: 900,
  n: "", c: COLORS[0], h: 0, cl: 0,
  d: 3, m: 0, sc: 0, seat: -1, walk: 0,
  bubble: "", bubbleUntil: 0, emo: "", emoUntil: 0, bowUntil: 0,
};

/** Held direction keys ("u"|"d"|"l"|"r"). */
export const keys = new Set<string>();

/** Click-to-walk target. */
export let target: { x: number; y: number } | null = null;
export function setTarget(t: { x: number; y: number } | null): void {
  target = t;
}

/** Camera: scale + world-space origin of the viewport's top-left. */
export const view = { s: 1, ox: 0, oy: 0 };

/** Last zone id (mirrored to ui store when it changes). */
export let zoneNow = "";
export function setZoneNow(z: string): void {
  zoneNow = z;
}
