/** Curriculum progression logic (curriculum.js): day-gated word unlocks. */
import { CAMPUS } from "@/config/campus";
import { LEVELS, PER_DAY } from "@/data/curriculum";
import type { Word } from "@/types/lesson";
import { ls } from "./storage";
import { dstr, daysBetween } from "./helpers";

export { LEVELS, PER_DAY } from "@/data/curriculum";
export { GRAMMAR } from "@/data/curriculum";

/** Days since the learner started level `lv` (1-based). Seeds start date when `start`. */
export function levelDay(lv: number, start: boolean): number {
  let st = ls.get("nh:start" + lv);
  if (!st && start) {
    st = dstr();
    ls.set("nh:start" + lv, st);
  }
  return st ? Math.max(1, daysBetween(st, dstr()) + 1) : 0;
}

/** How many words of level `lv` are unlocked (5/day free, or nh:max<lv> when paid). */
export function unlocked(lv: number): number {
  const words = LEVELS[lv] ?? [];
  return Math.min(
    words.length,
    Math.max(levelDay(lv, false) * PER_DAY, Number(ls.get("nh:max" + lv)) || 0),
  );
}

export function todayWords(lv: number): {
  day: number;
  words: Word[];
  done: boolean;
} {
  const words = LEVELS[lv] ?? [];
  const day = Math.max(1, levelDay(lv, false));
  const st = Math.min((day - 1) * PER_DAY, Math.max(0, words.length - PER_DAY));
  return { day, words: words.slice(st, st + PER_DAY), done: (day - 1) * PER_DAY >= words.length };
}

const LV_KEY = "nh:lv";

export function getCurLevel(): number {
  const v = Number(ls.get(LV_KEY));
  return [1, 2, 3].includes(v) ? v : 1;
}

export function setCurLevel(lv: number): void {
  if ([1, 2, 3].includes(lv)) ls.set(LV_KEY, String(lv));
}

export function driveUrl(lv: number): string {
  const d = CAMPUS.drive || {};
  return (d as Record<string, string | undefined>)["hsk" + lv] || d.all || "";
}
