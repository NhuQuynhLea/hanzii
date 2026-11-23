/**
 * Nhiệm vụ ngày — ngày học + SRS ôn giãn cách (nv-quest.js phần đầu).
 * Ôn giãn cách: 1, 3, 7, 14, 30 ngày.
 */
import { ls } from "@/lib/storage";
import { dstr, daysBetween } from "@/lib/helpers";
import { LEVELS, PER_DAY, todayWords, getCurLevel } from "@/lib/curriculum";
import type { Word } from "@/types/lesson";

export interface SrsEntry {
  /** bậc giãn cách (index trong NV_GAP) */
  b: number;
  /** ngày đến hạn ôn YYYY-MM-DD */
  due: string;
}
export type SrsMap = Record<string, SrsEntry>;

/** Ngày học thứ mấy (mốc "nh:first"). */
export function nvDay(): number {
  let f = ls.get("nh:first");
  if (!f) {
    f = dstr();
    ls.set("nh:first", f);
  }
  return daysBetween(f, dstr()) + 1;
}

export const NV_GAP = [1, 3, 7, 14, 30];

export function nvSrs(): SrsMap {
  try {
    return JSON.parse(ls.get("nh:srs") || "{}");
  } catch {
    return {};
  }
}

/** Ghi một thẻ SRS (API ghi duy nhất của bản gốc là ghi cả map "nh:srs"). */
export function nvSrsSet(zh: string, e: SrsEntry): void {
  const S = nvSrs();
  S[zh] = e;
  ls.set("nh:srs", JSON.stringify(S));
}

export function nvAddDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return dstr(d);
}

/** Từ các ngày trước đã đến hạn ôn (tối đa 8). */
export function nvDue(lv = getCurLevel()): Word[] {
  const t = todayWords(lv);
  const learned = (LEVELS[lv] ?? []).slice(0, Math.max(0, (t.day - 1) * PER_DAY));
  const S = nvSrs();
  const today = dstr();
  return learned.filter((w) => !S[w[0]] || S[w[0]].due <= today).slice(0, 8);
}
