/**
 * GT scene core — the canonical gt-core.js port already lives in
 * `features/gt/core/state.ts`; this module re-exports it under the names the
 * scene hooks use, and adds the gt-class.js corner-group tables plus the
 * window flags the vanilla code shared through globals.
 */
import { useGt } from "@/stores/gt";
import {
  gtBSteps,
  gtCurB,
  gtIsSeen,
  setGtSession,
} from "../core/state";

export {
  GT_FREE,
  GT_NEED,
  GT_GATES,
  gtAllPaid,
  gtStarInfo,
  gtStars,
  gtStarTxt,
  gtUnlocked,
  gtLockWhy,
  gtNS,
  gtChunk,
  gtBSteps,
  gtIsSeen,
  gtBDone,
  gtCurB,
  gtSlice,
  gtBMin,
  gtSeen,
  gtStarInit,
  gtStarCheck,
  gtCheckDone,
  gtClassLesson,
  classOf,
  gtWordStats,
  gtSess,
  setGtSession,
  chGet,
  chDone,
  msPlayed,
  msIdFor,
  msGet,
  gtNextAct,
  gmGateOf,
  gmGateRange,
  gmGateName,
  gmGates,
  gmGatePassed,
  gmGateReady,
  gmGateOpenList,
} from "../core/state";
export type { GtStarInfo, GtWordStats, GtSlice, GtRange } from "../core/state";

export { GT_LESSONS, GT_TITLES, GT_STEPS, GT_STAGES, gtLabel } from "@/data/gt-data";

/** Cross-file flags the vanilla code kept on `window`. */
declare global {
  interface Window {
    _gtNext?: string[] | null;
    _gtMap?: number;
    _flSkip?: number;
  }
}

/**
 * gt-core.js session patch — writes to both `gtSess` (module global read by
 * gtSeen) and the useGt store; also forwards `step` to the store (setGtSession
 * only mirrors cur/buoi/buoiFor there).
 */
export const setGt = (patch: {
  cur?: number;
  step?: string | number;
  buoi?: number;
  buoiFor?: number;
}): void => {
  setGtSession({
    ...(patch.cur !== undefined ? { cur: patch.cur } : {}),
    ...(patch.step !== undefined ? { step: String(patch.step) } : {}),
    ...(patch.buoi !== undefined ? { buoi: patch.buoi } : {}),
    ...(patch.buoiFor !== undefined ? { buoiFor: patch.buoiFor } : {}),
  });
  if (patch.step !== undefined) useGt.getState().setSession({ step: patch.step });
};

/* ---------- corner groups (gt-class.js) ---------- */
export const GT_GROUP: Record<string, string> = {
  goal: "board",
  words: "board",
  dlg: "board",
  gram: "board",
  pron: "noi",
  say: "noi",
  quiz: "ban",
  write: "viet",
};
export const GT_GSTEPS: Record<string, string[]> = {
  board: ["goal", "words", "dlg", "gram"],
  noi: ["pron", "say"],
  ban: ["quiz"],
  viet: ["write"],
};
export const GT_GNAME: Record<string, string> = {
  board: "Bảng lớn",
  noi: "Góc nói",
  ban: "Bàn học",
  viet: "Góc viết",
};

export function gtGroupDone(n: number, g: string): boolean {
  const b = gtCurB(n);
  const ks = GT_GSTEPS[g].filter((k) => gtBSteps(n, b).includes(k));
  return ks.every((k) => gtIsSeen(n, b, k));
}

export function gtNextGroup(n: number): string {
  const b = gtCurB(n);
  const k = gtBSteps(n, b).find((k2) => !gtIsSeen(n, b, k2));
  return k ? GT_GROUP[k] : "";
}
