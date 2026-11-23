/** Player/avatar entity — the shared contract (presence.js `mk`, avatar.js `drawPerson`). */

/** Scene ids: 0 campus, 1 classroom, 2 pron room, 3 library, 4 admissions, 5 clubhouse. */
export type SceneId = 0 | 1 | 2 | 3 | 4 | 5;

/** Facing direction: 0 down, 1 left, 2 right, 3 up. */
export type Dir = 0 | 1 | 2 | 3;

export interface PlayerState {
  x: number;
  y: number;
  /** lerp targets (remote players) */
  tx: number;
  ty: number;
  /** display name */
  n: string;
  /** shirt color (optional, swatches are hidden in GT build) */
  c?: string;
  /** hair style 0–3 */
  h?: number;
  /** facing direction */
  d: Dir;
  /** moving flag */
  m: number;
  /** walk-cycle phase accumulator */
  walk: number;
  /** scene id */
  sc: SceneId;
  /** seat index, -1 standing */
  seat: number;
  /** class level (in class scene) */
  cl?: number;
  /** floor: "hsk" | "gt" */
  fl?: "hsk" | "gt";
  /** points (broadcast) */
  p?: number;
  /** badges csv/array */
  b?: string[] | string;
  /** accessory csv "hat,glasses,pet,tag" (gm shop) */
  ac?: string;
  /** study group code */
  gp?: string;
  /** speech bubble */
  bubble: string;
  bubbleUntil: number;
  /** emote pill text */
  emo: string;
  emoUntil: number;
  bowUntil: number;
  /** emote action key (wave/xiexie/jiayou) */
  act?: string;
  actUntil?: number;
  /** seated pose */
  sitting?: boolean;
  sitT?: number;
  /** ghế tư vấn (room sc=4) */
  rsit?: number;
  /** roleplay flag */
  rp?: boolean;
  /** is NPC */
  npc?: boolean;
  hint?: string;
}

/** Shirt colors (presence.js `COLORS`). */
export const COLORS = ["#EA0000", "#1F3A68", "#D6A23A", "#3E7C59", "#7A4FA0", "#E07A5F"];

/** Presence payload broadcast over the room channel. */
export interface PresencePayload {
  x: number;
  y: number;
  d: number;
  m: number;
  sc: number;
  seat: number;
  p: number;
  b?: string;
  h?: number;
  n?: string;
  c?: string;
  cl?: number;
  fl?: string;
  ac?: string;
  gp?: string;
  bubble?: string;
  emo?: string;
  bow?: number;
  /** thách đấu state (td.js) */
  td?: unknown;
  /** nhà sinh hoạt quiz state (cdq.js) */
  qz?: unknown;
  /** roleplay flag */
  rp?: unknown;
  /** group cheer */
  cheer?: unknown;
}

export function mkPlayer(p: Partial<PresencePayload> & { x: number; y: number }): PlayerState {
  return {
    x: p.x,
    y: p.y,
    tx: p.x,
    ty: p.y,
    n: p.n ?? "",
    c: p.c,
    d: (p.d as Dir) || 0,
    m: 0,
    sc: (p.sc as SceneId) || 0,
    seat: p.seat == null ? -1 : p.seat,
    walk: 0,
    bubble: "",
    bubbleUntil: 0,
    emo: "",
    emoUntil: 0,
    bowUntil: 0,
  };
}
