/**
 * Lesson list + persistent selection state for the pronunciation room.
 *
 * `pronLessons` mirrors `window.NH_LESSONS`: under GT_ONLY the original
 * gt-floors.js rebuilds it from GT_LESSONS with a `gi` (gt lesson index)
 * used by `gtUnlocked`.
 */
import type { NhLesson } from "@/types/lesson";
import { NH_LESSONS } from "@/data/nh-lessons";
import { GT_LESSONS, GT_TITLES } from "@/data/gt-data";
import { GT_ONLY } from "@/game/world/geometry";
import { getCurLevel } from "@/lib/curriculum";
import { ls } from "@/lib/storage";
import { daysBetween, dstr } from "@/lib/helpers";

export type PronLesson = NhLesson & { gi?: number };

/** pron.js globals — kept at module scope so they persist across opens. */
export const pronState: { lv: number | null; les: Record<number, number> } = {
  lv: null,
  les: { 1: 1, 2: 1, 3: 1 },
};

/** pron.js open-time init: `if(fixLv) pronLv=fixLv; else if(pronLv==null) pronLv=curLevel`. */
export function pronLvSet(fixLv: number | null): void {
  if (fixLv) pronState.lv = fixLv;
  else if (pronState.lv == null) pronState.lv = getCurLevel();
}

/** `window.NH_LESSONS || []` — GT build is verbatim gt-floors.js. */
export function pronLessons(): PronLesson[] {
  if (GT_ONLY) {
    const cls = (i: number) => (i <= 15 ? 1 : i <= 30 ? 2 : 3);
    return Object.keys(GT_LESSONS)
      .map(Number)
      .sort((a, b) => a - b)
      .map((i) => ({
        lv: cls(i),
        n: i > 30 ? i - 30 : i,
        gi: i,
        zh: GT_TITLES[i][0],
        vi: GT_TITLES[i][1],
        w: GT_LESSONS[i].words,
      }));
  }
  return NH_LESSONS;
}

/** Free-tier day counter (`nh:pstart<lv>`) — pron.js `pronDay`. */
export function pronDay(lv: number): number {
  let st = ls.get("nh:pstart" + lv);
  if (!st) {
    st = dstr();
    ls.set("nh:pstart" + lv, st);
  }
  return Math.max(1, daysBetween(st, dstr()) + 1);
}
