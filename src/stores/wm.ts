import { create } from "zustand";
import { ls } from "@/lib/storage";
import { dstr } from "@/lib/helpers";
import { useGm } from "./gm";

/** Word-memory SRS-lite (`nh:wm`): level 0–3, decay 7d/14d (gt/lib.js). */
export interface WmRow {
  l: number;
  t: string;
  w: number;
}

export type WmMap = Record<string, WmRow>;
export interface WmBuckets {
  moi: string[];
  nho: string[];
  thuoc: string[];
  sai: string[];
}

function load(): WmMap {
  let M: WmMap = {};
  try {
    M = JSON.parse(ls.get("nh:wm") || "{}");
  } catch {
    /* noop */
  }
  if (!Object.keys(M).length) {
    try {
      Object.keys(useGm.getState().cards.own || {}).forEach((z) => (M[z] = { l: 1, t: dstr(), w: 0 }));
    } catch {
      /* noop */
    }
  }
  return M;
}

export function wmDays(t: string): number {
  try {
    return Math.round((new Date(dstr()).getTime() - new Date(t).getTime()) / 864e5);
  } catch {
    return 0;
  }
}

interface WmStore {
  map: WmMap;
  save(m?: WmMap): void;
  seen(zs: string[]): void;
  hit(zs: string[], ok: boolean): void;
  buckets(): WmBuckets;
}

export const useWm = create<WmStore>((set, get) => ({
  map: load(),

  save: (m) => {
    const s = m ?? get().map;
    ls.set("nh:wm", JSON.stringify(s));
    set({ map: s });
  },
  seen: (zs) => {
    const M = { ...get().map };
    let ch = 0;
    zs.forEach((z) => {
      if (!M[z]) {
        M[z] = { l: 0, t: dstr(), w: 0 };
        ch = 1;
      }
    });
    if (ch) get().save(M);
  },
  hit: (zs, ok) => {
    if (!zs || !zs.length) return;
    const M = { ...get().map };
    const d = dstr();
    zs.forEach((z) => {
      const r = M[z] || { l: 0, t: d, w: 0 };
      if (ok) r.l = Math.min(3, r.l + 1);
      else {
        r.l = Math.max(0, r.l - 1);
        r.w = (r.w || 0) + 1;
      }
      r.t = d;
      M[z] = r;
    });
    get().save(M);
  },
  buckets: () => {
    const M = { ...get().map };
    const B: WmBuckets = { moi: [], nho: [], thuoc: [], sai: [] };
    let ch = 0;
    Object.entries(M).forEach(([z, r]) => {
      const d = wmDays(r.t);
      if (r.l >= 3 && d > 7) {
        r.l = 2;
        ch = 1;
      } else if (r.l >= 1 && r.l < 3 && d > 14) {
        r.l--;
        ch = 1;
      }
      (r.l >= 3 ? B.thuoc : r.l >= 1 ? B.nho : B.moi).push(z);
      if ((r.w || 0) > 0 && r.l < 3) B.sai.push(z);
    });
    if (ch) get().save(M);
    B.sai.sort((a, b) => (M[b].w || 0) - (M[a].w || 0));
    return B;
  },
}));
