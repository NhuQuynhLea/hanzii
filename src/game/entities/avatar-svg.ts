/** Avatar SVG builder — ported from avatar.js `avImg`/`lvOf`. */
import { AV_TPL, AV_TPL_SIDE, TCH_TPL } from "./avatar-art";

export const HAIR = "#2A1B14";
export const SKIN = "#F3D3B0";
export const AV_PER = 50;
export const GM_HEAD = 46;

export const AV_REWARDS: [number, string][] = [
  [2, "Khăn quàng đỏ"],
  [4, "Mũ len"],
  [6, "Ba lô"],
  [8, "Áo lễ hội"],
  [10, "Hào quang vàng"],
];

export function lvOf(p: number | undefined): number {
  return Math.min(20, 1 + Math.floor((Number(p) || 0) / AV_PER));
}

/** view: 0 front, 1 side, 2 back */
const uriCache = new Map<string, string>();

export function avatarSvgUri(h: number, lv: number, view: 0 | 1 | 2, hatOff?: boolean): string {
  const back = view === 2;
  const key = h + "|" + lv + "|" + view + "|" + (hatOff ? 1 : 0);
  const hit = uriCache.get(key);
  if (hit) return hit;
  const on = (b: boolean) => (b ? "inline" : "none");
  const D: Record<string, string> = {
    h0: on(h === 0),
    h1: on(h === 1),
    h2: on(h === 2),
    h3: on(h === 3),
    hiBrow: on(h !== 0 && h !== 2),
    loBrow: on(h === 0 || h === 2),
    scarf: on(lv >= 2 && lv < 8),
    hat: on(lv >= 4 && !hatOff),
    pack: on(lv >= 6),
    jacket: on(lv >= 8),
    tee: on(lv < 8),
    aura: on(lv >= 10),
    acc: lv >= 10 ? "#F4C95D" : "#E5262F",
    fv: on(!back),
    bv: on(back),
  };
  const svg = (view === 1 ? AV_TPL_SIDE : AV_TPL).replace(
    /\{\{(\w+)\}\}/g,
    (_m, k: string) => D[k] || "none",
  );
  const uri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  uriCache.set(key, uri);
  return uri;
}

const tchCache = new Map<number, string>();

/** Thầy Vương NPC sprite. back: 0 front, 1 back. */
export function teacherSvgUri(back: 0 | 1): string {
  const hit = tchCache.get(back);
  if (hit) return hit;
  const uri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(TCH_TPL[back]);
  tchCache.set(back, uri);
  return uri;
}
