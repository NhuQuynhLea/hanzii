import { create } from "zustand";
import { ls } from "@/lib/storage";
import { dstr, daysBetween } from "@/lib/helpers";
import { usePlayer } from "./player";
import { emitHook } from "@/services/hooks";

/** Gamification state (`nh:gm`): streak, freeze cards, shop inventory/equipment, chests. */
export interface GmState {
  last: string;
  cnt: number;
  best: number;
  frz: number;
  hist: string[];
  own: string[];
  eq: { hat: number; glass: number; pet: number; tag: number };
  spent: number;
  bonus: number;
  chests: number[];
  titles?: string[];
}

const GM0 = (): GmState => ({
  last: "", cnt: 0, best: 0, frz: 0, hist: [], own: [],
  eq: { hat: 0, glass: 0, pet: 0, tag: 0 }, spent: 0, bonus: 0, chests: [],
});

export const GM_SLOTS = ["hat", "glass", "pet", "tag"] as const;
export type GmSlot = (typeof GM_SLOTS)[number];
export const GM_FREEZE_PRICE = 60;
export const GM_FREEZE_MAX = 2;

function load(): GmState {
  try {
    return Object.assign(GM0(), JSON.parse(ls.get("nh:gm") || "{}"));
  } catch {
    return GM0();
  }
}

/** Word-card collection (`nh:cards`). */
export interface GmCards {
  own: Record<string, number>;
  seen: Record<string, number>;
  sets: Record<string, unknown>;
}

function loadCards(): GmCards {
  try {
    return Object.assign({ own: {}, seen: {}, sets: {} }, JSON.parse(ls.get("nh:cards") || "{}"));
  } catch {
    return { own: {}, seen: {}, sets: {} };
  }
}

const diff = (a: string, b: string) => (a && b ? daysBetween(a, b) : 999);

interface GmStore {
  g: GmState;
  cards: GmCards;

  save(g?: GmState): void;
  xu(): number;
  streak(): number;
  today(): boolean;
  /** equipped accessories csv "hat,glass,pet,tag" (gm.js `gmAc`). */
  ac(): string;
  saveCards(c?: GmCards): void;
  cardSeen(zh: string): void;
  cardOwn(zh: string): void;
}

export const useGm = create<GmStore>((set, get) => ({
  g: load(),
  cards: loadCards(),

  save: (g) => {
    const s = g ?? get().g;
    ls.set("nh:gm", JSON.stringify(s));
    set({ g: s });
    emitHook("gmPaint");
  },
  xu: () => {
    const g = get().g;
    return Math.max(0, Math.round(usePlayer.getState().points + g.bonus - g.spent));
  },
  streak: () => {
    const g = get().g;
    const d = diff(g.last, dstr());
    return d <= 1 || (d === 2 && g.frz > 0) ? g.cnt : 0;
  },
  today: () => get().g.last === dstr(),
  ac: () => {
    const e = get().g.eq;
    return GM_SLOTS.map((k) => e[k] || 0).join(",");
  },
  saveCards: (c) => {
    const s = c ?? get().cards;
    ls.set("nh:cards", JSON.stringify(s));
    set({ cards: s });
  },
  cardSeen: (zh) => {
    const c = { ...get().cards, seen: { ...get().cards.seen } };
    if (!c.seen[zh]) {
      c.seen[zh] = 1;
      get().saveCards(c);
    }
  },
  cardOwn: (zh) => {
    const c = { ...get().cards, own: { ...get().cards.own }, seen: { ...get().cards.seen } };
    if (c.own[zh]) return;
    c.own[zh] = 1;
    c.seen[zh] = 1;
    get().saveCards(c);
  },
}));

export const gmGet = () => useGm.getState().g;
export const gmSave = (g?: GmState) => useGm.getState().save(g);
