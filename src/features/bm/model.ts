/**
 * Shared model for the 6-step "bài mới" wizard (bm.js constants + helpers).
 * Vietnamese copy kept verbatim.
 */
import type { BmDbEntry } from "@/types/lesson";
import { BM } from "@/data/bm-data";
import { todayWords } from "@/lib/curriculum";
import { shuffle } from "@/lib/helpers";

export const BM_STEPS = ["Nghe và nhìn", "Xem viết từng nét", "Ghép thành chữ", "Viết theo nét", "Nói và ghi âm", "Câu ví dụ"];
export const BM_TIPS = [
  "Nghe thầy đọc rồi nhìn kỹ chữ nhé.",
  "Xem chữ tự viết từng nét theo đúng thứ tự, tên nét hiện ngay bên dưới.",
  "Các nét gộp lại thành bộ thủ, các bộ thủ ghép lại thành chữ.",
  "Viết lần lượt từng nét theo đúng thứ tự. Sai thì thầy gợi ý.",
  "Đọc to rồi ghi âm, nghe lại và so với giọng mẫu.",
  "Giờ dùng chữ vừa học trong một câu ngắn.",
];

/** bmToday: today's (up to) 5 words of level `lv` resolved through BM.db. */
export function bmToday(lv: number): BmDbEntry[] {
  const t = todayWords(lv);
  return (t.words || [])
    .map((w) => BM.db[w[0]])
    .filter(Boolean)
    .slice(0, 5);
}

/** bm.js WBS — whiteboard-variant responsive board size (dialog always has "wb" here). */
export function wbSize(n: number): number {
  return Math.round(Math.max(n, Math.min(window.innerHeight * 0.44, window.innerWidth * 0.84, 380)));
}

/** bm.js `nameOf` — tên nét from BM.si, fall back to the raw stroke key. */
export function strokeName(k: string): string {
  const e = BM.si[k];
  return e ? e[0] : k;
}

/* ---------- Quiz (bmMakeQuiz) ---------- */

export interface BmQuestion {
  type: "comp" | "listen" | "vi";
  ask: string;
  py?: string;
  ans: string;
  opts: string[];
  say: string;
}

export function bmMakeQuiz(words: BmDbEntry[]): BmQuestion[] {
  const ws = words;
  const qs: BmQuestion[] = [];
  const pool = Object.values(BM.db);
  const withComps: BmDbEntry["chars"] = [];
  ws.forEach((w) =>
    w.chars.forEach((ch) => {
      if (ch.comps.length > 1) withComps.push(ch);
    }),
  );
  const distract = (w: BmDbEntry, f: (x: BmDbEntry) => string): string[] =>
    shuffle(pool.filter((x) => x !== w && f(x) !== f(w)))
      .slice(0, 3)
      .map(f);
  shuffle(ws).forEach((w, i) => {
    if (i % 3 === 2 && withComps.length) {
      const ch = withComps[i % withComps.length];
      const others = shuffle(Object.keys(BM.chars).filter((x) => x !== ch.c)).slice(0, 3);
      qs.push({
        type: "comp",
        ask: ch.comps.map((c) => c[0]).join(" + "),
        ans: ch.c,
        opts: shuffle([ch.c, ...others]),
        say: "Các bộ này ghép thành chữ nào?",
      });
    } else if (i % 3 === 1) {
      qs.push({
        type: "listen",
        ask: w.zh,
        ans: w.zh,
        opts: shuffle([w.zh, ...distract(w, (x) => x.zh)]),
        say: "Nghe rồi chọn từ đúng.",
      });
    } else {
      qs.push({
        type: "vi",
        ask: w.zh,
        py: w.py,
        ans: w.vi,
        opts: shuffle([w.vi, ...distract(w, (x) => x.vi)]),
        say: "Từ này nghĩa là gì?",
      });
    }
  });
  return qs;
}

/* ---------- shared classnames (bm.js <style> block, Tailwind form) ---------- */

/** .ghost button */
export const BTN_GHOST =
  "min-h-[46px] rounded-full border border-[#E4E5F0] bg-transparent px-4 py-[0.65rem] font-medium text-[#3D3E5C] transition hover:bg-black/5 disabled:opacity-50";
/** .cta button */
export const BTN_CTA =
  "min-h-[46px] rounded-full border-0 bg-[#EA0000] px-4 py-[0.8rem] font-semibold text-white disabled:opacity-50";
/** .opt button (base) */
export const BTN_OPT =
  "min-h-[54px] rounded-[14px] border-[1.5px] border-[#E4E5F0] bg-transparent p-3 font-medium text-[#3D3E5C] transition enabled:hover:bg-black/5";
export const OPT_OK = "border-[#3BB273] bg-[#E3F5E9] text-[#14532D]";
export const OPT_BAD = "border-[#EA0000] bg-[#FDE8E8] text-[#7F1D1D]";

/** .bm-card */
export const BM_CARD =
  "flex flex-col items-center gap-[0.6rem] rounded-[18px] border border-[#EADFCB] bg-white p-4 text-center";
/** .bm-row */
export const BM_ROW = "flex flex-wrap justify-center gap-2";
/** .bm-py */
export const BM_PY = "text-[1.3rem] font-bold text-[#050349]";
/** .bm-vi */
export const BM_VI = "text-[1rem] text-[#3D3C5C]";
/** .bm-big */
export const BM_BIG = "font-['Noto_Serif_SC',serif] text-[84px] font-semibold leading-[1] text-[#EA0000]";
/** .bm-tip */
export const BM_TIP = "rounded-[10px] bg-[#FFF6DD] px-[0.6rem] py-[0.45rem] text-[0.85rem] text-[#7A5A1A]";
/** cross-hair writing-board background (.bm-write / step-1 box) */
export const BM_GRID_BG =
  "linear-gradient(#EADFCB,#EADFCB) center/100% 1px no-repeat,linear-gradient(#EADFCB,#EADFCB) center/1px 100% no-repeat";
