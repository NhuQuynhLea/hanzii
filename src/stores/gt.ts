import { create } from "zustand";
import { ls } from "@/lib/storage";

/** GT progress (`nh:gt`): done lessons, seen steps (key `step@buổi`), quiz scores, listen results. */
export interface GtState {
  done: Record<number, unknown>;
  seen: Record<number, Record<string, number>>;
  quiz?: Record<number, Record<number, number>>;
  listen?: Record<number, unknown>;
}

function load(): GtState {
  try {
    return JSON.parse(ls.get("nh:gt") || "null") || { done: {}, seen: {} };
  } catch {
    return { done: {}, seen: {} };
  }
}

interface GtStore {
  state: GtState;
  /** Currently open lesson context (gtCur/gtStep/gtBuoi globals). */
  cur: number;
  /** gtStep: step key ("goal"/"words"/"dlg"/…) or numeric index. */
  step: number | string;
  buoi: number;
  buoiFor: number;
  starLast: number;

  set(patch: Partial<GtState>): void;
  save(state?: GtState): void;
  setSession(patch: Partial<Pick<GtStore, "cur" | "step" | "buoi" | "buoiFor" | "starLast">>): void;
}

export const useGt = create<GtStore>((set, get) => ({
  state: load(),
  cur: 0,
  step: 0,
  buoi: 1,
  buoiFor: 0,
  starLast: 0,

  set: (patch) => set((s) => ({ state: { ...s.state, ...patch } })),
  save: (state) => {
    const s = state ?? get().state;
    ls.set("nh:gt", JSON.stringify(s));
    set({ state: s });
  },
  setSession: (patch) => set(patch),
}));

/** Non-hook accessor matching the original `gtState()`/`gtSave()`. */
export const gtState = () => useGt.getState().state;
export const gtSave = (s?: GtState) => useGt.getState().save(s);
