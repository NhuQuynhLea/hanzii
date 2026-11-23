/**
 * duo.js data layer — dictionary/tokenizer, exercise builder, pinyin lookup
 * (gtPy), and the session openers `duoStart`/`duoRun` which mount the
 * <DuoRunner/> component inside the room dialog.
 */
import { createElement } from "react";
import { GT_LESSONS, GT_TITLES } from "@/data/gt-data";
import { keys, setTarget } from "@/game/engine/state";
import { useUi } from "@/stores/ui";
import { useGt } from "@/stores/gt";
import { callHook } from "@/services/hooks";
import { pyOf } from "@/features/ui-bits";
import { shuffle } from "@/lib/helpers";
import type { GtLesson, GtDialogScene, GtDialogLine, GtRule, GtQuizItem } from "@/types/gt";
import type { Word } from "@/types/lesson";
import { gtCurB, gtNS, gtSlice, gtChunk } from "@/features/gt/scene/core";
import { DuoRunner, type DuoInit } from "./DuoRunner";
export type { DuoInit };

export const GT_DUO = true;

/* ---------- exercise model ---------- */
export interface DuoEx {
  t: string;
  w?: Word;
  g?: Word[] | number;
  pairs?: Word[];
  tones?: [string, string, string, string][];
  r?: GtRule;
  q?: GtQuizItem;
  qi?: number;
  l?: GtDialogLine;
  lines?: GtDialogLine[];
  d?: GtDialogScene;
  p?: [string, string];
  W?: Word[];
  isNew?: boolean;
}

export interface DuoSessionData {
  n: number;
  b: number;
  L: GtLesson | null;
  W: Word[];
  ex: DuoEx[];
  review?: string;
  rvTitle?: string;
}

/* ---------- duoDict / duoTok / duoPlain ---------- */
let DUO_DICT: Map<string, [string, string]> | null = null;

export function duoDict(): Map<string, [string, string]> {
  if (DUO_DICT) return DUO_DICT;
  const m = new Map<string, [string, string]>();
  Object.values(GT_LESSONS).forEach((L) =>
    (((L as GtLesson & { wordsAll?: Word[] }).wordsAll || L.words) as Word[]).forEach(([z, p, v]) => {
      if (!m.has(z)) m.set(z, [p, v]);
    }),
  );
  DUO_DICT = m;
  return m;
}

export function duoTok(zh: string): string[] {
  const d = duoDict();
  const s = zh.replace(/[^一-鿿]/g, "");
  const out: string[] = [];
  let i = 0;
  while (i < s.length) {
    let k = Math.min(4, s.length - i);
    let hit: string | null = null;
    for (; k > 1; k--) {
      if (d.has(s.substr(i, k))) {
        hit = s.substr(i, k);
        break;
      }
    }
    out.push(hit || s[i]);
    i += hit ? hit.length : 1;
  }
  return out;
}

export function duoPlain(zh: string): string {
  return zh.replace(/[^一-鿿]/g, "");
}

/* ---------- duoBuild ---------- */
export function duoBuild(n: number, b: number): DuoSessionData {
  const L0 = GT_LESSONS[n];
  const L = gtSlice(L0, n, b);
  const W = L.words.slice();
  const lines = L.dialog.flatMap((s) => s.lines);
  const ex: DuoEx[] = [];
  const easy = n <= 2;
  if (b === 1 && L0.tones && L0.tones.length) {
    ex.push({ t: "tone", tones: L0.tones }, { t: "toneq", tones: L0.tones });
  }
  for (let i = 0; i < W.length; i += 3) {
    const g = W.slice(i, i + 3);
    ex.push({ t: "teach", g });
    if (g.length >= 3) ex.push({ t: "match", pairs: shuffle(g.slice()) });
    else g.forEach((w, j) => ex.push({ t: j % 2 ? "listen" : "mean", w }));
  }
  const pr = L0.rules && gtChunk(L0.rules, gtNS(n), b)[0];
  if (pr) ex.push({ t: "rule", r: pr }, { t: "ruleq", r: pr });
  const gr = L.grammar[0];
  if (gr) ex.push({ t: "rule", r: gr, g: 1 }, { t: "ruleq", r: gr, g: 1 });
  const prac: DuoEx[] = [];
  L.quiz.forEach((q, i) => prac.push({ t: "quiz", q, qi: L.quizIdx[i] }));
  const short = shuffle(
    lines.filter((l) => {
      const t = duoTok(l[2]);
      return t.length >= 2 && t.length <= (easy ? 5 : 7);
    }),
  );
  if (short[0]) prac.push({ t: "tiles", l: short[0] });
  const fb = shuffle(lines).find(
    (l) => W.some((w) => duoPlain(l[2]).includes(w[0]) && duoPlain(l[2]) !== w[0]),
  );
  if (fb && !easy) {
    const w = W.filter((w2) => duoPlain(fb[2]).includes(w2[0])).sort(
      (a, c) => c[0].length - a[0].length,
    )[0];
    prac.push({ t: "blank", l: fb, w, W });
  }
  ex.push(...shuffle(prac));
  if (!easy && L.say.length) ex.push({ t: "speak", p: L.say[0] });
  return { n, b, L, W, ex };
}

/* ---------- gtPy ---------- */
let GT_PYS: Map<string, string> | null = null;

export function gtPy(t: string): string {
  t = String(t || "").trim();
  if (!/[一-鿿]/.test(t)) return "";
  if (!GT_PYS) {
    GT_PYS = new Map();
    Object.values(GT_LESSONS).forEach((L) => {
      L.dialog.forEach((d) =>
        d.lines.forEach((l) => {
          GT_PYS!.set(l[2], l[3]);
          GT_PYS!.set(duoPlain(l[2]), l[3]);
        }),
      );
      (L.say || []).forEach((x) => {
        GT_PYS!.set(x[0], x[1]);
        GT_PYS!.set(duoPlain(x[0]), x[1]);
      });
      [...(L.grammar || []), ...(L.rules || [])].forEach((r) =>
        (r.ex || []).forEach((x) => {
          GT_PYS!.set(x[0], x[1] || "");
          GT_PYS!.set(duoPlain(x[0]), x[1] || "");
        }),
      );
    });
  }
  {
    const dw = duoDict().get(t);
    if (dw && dw[0]) return dw[0];
  }
  if (GT_PYS.has(t)) return GT_PYS.get(t)!;
  const pl = duoPlain(t);
  if (GT_PYS.has(pl)) return GT_PYS.get(pl)!;
  const d = duoDict();
  const G = callHook<Record<string, string[]>>("msGloss") || {};
  const X: Record<string, string> = {
    王: "wáng", 兰: "lán", 兰兰: "Lánlan", 怎么样: "zěnmeyàng", 怎: "zěn", 么: "me", 样: "yàng",
    跟: "gēn", 说: "shuō", 阿: "ā", 阿明: "Ā Míng", 明: "míng", 小: "xiǎo", 雪: "xuě",
    小雪: "Xiǎo Xuě", 手机: "shǒujī", 手: "shǒu", 机: "jī", 看: "kàn", 学校: "xuéxiào",
    学: "xué", 校: "xiào", 太: "tài", 们: "men", 了: "le", 您们: "nínmen",
  };
  const look = (w: string): string =>
    (d.get(w) || [""])[0] || (G[w] || [""])[0] || X[w] || (w.length > 1 ? "" : pyOf(w));
  const out: string[] = [];
  let i = 0;
  while (i < pl.length) {
    let k = Math.min(4, pl.length - i);
    let hit = "";
    for (; k >= 1; k--) {
      const py = look(pl.substr(i, k));
      if (py) {
        hit = py;
        break;
      }
    }
    if (!hit) {
      const p0 = pyOf(pl);
      return p0 || "";
    }
    out.push(hit);
    i += k;
  }
  return out.join(" ");
}

/* ---------- praise ---------- */
export function pickPraise(): string {
  return ["很好！Rất tốt", "太棒了！Tuyệt quá", "对了！Chính xác", "不错！Khá lắm", "真棒！Giỏi lắm"][
    Math.floor(Math.random() * 5)
  ];
}

/* ---------- lib.js tone helper (needed by the "tonew" exercise) ---------- */
const LIB_TM: Record<string, string> = { a: "āáǎà", e: "ēéěè", i: "īíǐì", o: "ōóǒò", u: "ūúǔù", ü: "ǖǘǚǜ" };

export function libToneVars(py: string): string[] | null {
  for (let i = 0; i < py.length; i++)
    for (const b in LIB_TM) {
      if (LIB_TM[b].includes(py[i])) {
        return [0, 1, 2, 3].map((k) => py.slice(0, i) + LIB_TM[b][k] + py.slice(i + 1));
      }
    }
  return null;
}

/* ---------- session bookkeeping ---------- */
export interface DuoSessionInfo {
  t0?: number;
  sec?: number;
  total?: number;
  wrong?: number;
  review?: string;
  rvTitle?: string;
}

let duoSessionInfo: DuoSessionInfo | null = null;

/** lib.js read the global `duo`; kept for the libEnd fallback ("duoSession"). */
export const getDuoSession = (): DuoSessionInfo | null => duoSessionInfo;
export const setDuoSession = (v: DuoSessionInfo | null): void => {
  duoSessionInfo = v;
};

/* ---------- session openers ---------- */
function openDuo(D: DuoInit, mark: string, title: string, sub: string): void {
  keys.clear();
  setTarget(null);
  useUi.getState().openRoom({
    mark,
    title,
    sub,
    variant: "duo",
    body: createElement(DuoRunner, { D }),
  });
}

/**
 * duoStart(n, b?, skipMission?) — original plus the missions.js wrapper folded
 * in: if this buổi has a completed-challenge mission pending, run that instead
 * (unless skip is set, the old `duoStart._skip` flag).
 */
export function duoStart(n: number, b?: number, skip?: boolean): void {
  if (!GT_LESSONS[n]) return;
  const B = b || gtCurB(n);
  const mid = callHook<string>("msIdFor", n, B);
  if (mid && !skip && callHook<boolean>("chDone", n, B)) {
    callHook("msStart", mid);
    return;
  }
  useGt.getState().setSession({ cur: n, buoi: B, buoiFor: n });
  const D = duoBuild(n, B);
  openDuo(
    D,
    "⚡",
    `Thử thách – Học & luyện – ${GT_TITLES[n][1]}`,
    `Buổi ${B}/${gtNS(n)} – khoảng ${Math.max(3, Math.round(D.ex.length * 0.35))} phút`,
  );
}

/** lib.js `duoRun` — review session sharing the Thử thách UI. */
export function duoRun(D: DuoInit, title: string, sub?: string): void {
  openDuo(
    D,
    "书",
    title,
    sub || `${D.ex.length} câu – khoảng ${Math.max(1, Math.round(D.ex.length * 0.3))} phút`,
  );
}
