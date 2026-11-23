/**
 * Thách đấu (td.js) — shared types + the small view store that replaces the
 * original imperative `pane`/`vs` DOM writes.
 */
import { create } from "zustand";
import type { PlayerState } from "@/types/player";

export const TD_G = ["g1", "g2", "g3", "g4"] as const;
export const TD_BOTS = ["Tiểu Long", "Mai Mai", "Bảo An", "Gia Huy", "Ngọc Hân"];

export type TdRole = "host" | "guest" | "bot" | "async";
export type TdStage = "w" | "r" | "go";

/** Presence `td` payload — same wire shape as td.js `tdSend`. */
export interface TdWire {
  r: string;
  g: string;
  lv: number;
  sd: number;
  st: string;
  t0: number;
  k: number;
  ok: number;
  tot: number;
  dn: number;
  ms: number;
  inv: string;
}

/** Decoded "mã vượt điểm" / bot opponent progress. */
export interface TdOppStat {
  k: number;
  ok: number;
  tot?: number;
  dn: number;
  ms: number;
}

/** Decoded score-passing code (td.js `tdDecode` result). */
export interface TdTarget {
  ok: number;
  tot: number;
  ms: number;
}

/** Local duel state — td.js `TD`. */
export interface TdState {
  id: string;
  lv: number;
  seed: number;
  code?: string;
  role: TdRole;
  st: TdStage;
  t0?: number;
  k?: number;
  ok?: number;
  tot?: number;
  dn?: number;
  ms?: number;
  inv?: string;
  oppName?: string;
  oppNw?: string;
  oppSeen?: number;
  lost?: number;
  shown?: number;
  /** presence `x` already broadcast after a finished live duel */
  gone?: number;
  target?: TdTarget | null;
  /** synthetic opponent for bot/async */
  opp?: TdOppStat;
}

/** PlayerState fields added by tdAbsorb (td.js `o.td`, `o.nw`, `o._tdInv`). */
export interface TdPeer extends PlayerState {
  td?: TdWire | null;
  nw?: string;
  _tdInv?: string;
}

export interface TdResultRow {
  n: string;
  ok: number;
  tot: number;
  ms: number;
  me: boolean;
}

export interface TdResultData {
  head: string;
  win: boolean;
  rows: TdResultRow[];
  code?: string;
  codeLabel?: string;
  codeText?: string;
}

export interface TdInvite {
  key: string;
  n: string;
  g: string;
  r: string;
  gameName: string;
}

export type TdPlaySub = "game" | "wait" | "result";

interface TdViewStore {
  /** repaint counter — replaces `tdPaintVs` DOM writes */
  seq: number;
  playSub: TdPlaySub;
  res: TdResultData | null;
  invite: TdInvite | null;
  bump(): void;
  setPlay(sub: TdPlaySub, res?: TdResultData | null): void;
  setInvite(i: TdInvite | null): void;
}

export const useTd = create<TdViewStore>((set) => ({
  seq: 0,
  playSub: "game",
  res: null,
  invite: null,
  bump: () => set((s) => ({ seq: s.seq + 1 })),
  setPlay: (playSub, res) => set({ playSub, res: res ?? null }),
  setInvite: (invite) => set({ invite }),
}));

export const bumpTd = () => useTd.getState().bump();
