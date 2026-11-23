/**
 * Shared GT/duo/lib helpers needed by social features (cdq, roleplay, fb).
 * Ported verbatim from duo.js, lib.js, missions.js, gt-core.js, gm.js —
 * these live here until the dedicated gt feature modules land (then dedupe).
 */
import { GT_LESSONS } from "@/data/gt-data";
import { GT_CLASS } from "@/game/world/geometry";
import { gtState } from "@/stores/gt";
import { useGm } from "@/stores/gm";
import { ledger } from "@/stores/player";
import { ls } from "@/lib/storage";
import { permActive } from "@/services/entitlement";
import { MS_GLOSS } from "@/features/missions/data";
import { pyOf } from "@/features/ui-bits";
import type { Word } from "@/types/lesson";
import type { GtLesson } from "@/types/gt";

/* ---------- duo.js: từ điển & tách từ ---------- */
let DUO_DICT: Map<string, [string, string]> | null = null;

export function duoDict(): Map<string, [string, string]> {
  if (DUO_DICT) return DUO_DICT;
  const m = new Map<string, [string, string]>();
  Object.values(GT_LESSONS).forEach((L) => {
    const words = ((L as GtLesson & { wordsAll?: Word[] }).wordsAll || L.words) as Word[];
    words.forEach(([z, p, v]) => {
      if (!m.has(z)) m.set(z, [p, v]);
    });
  });
  DUO_DICT = m;
  return m;
}

/** duo.js `duoTok` — greedy dictionary segmentation (max 4 chars). */
export function duoTok(zh: string): string[] {
  const d = duoDict(),
    s = zh.replace(/[^一-鿿]/g, ""),
    out: string[] = [];
  let i = 0;
  while (i < s.length) {
    let k = Math.min(4, s.length - i),
      hit: string | null = null;
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

/** duo.js `duoPlain` — chỉ giữ chữ Hán. */
export function duoPlain(zh: string): string {
  return zh.replace(/[^一-鿿]/g, "");
}

/* ---------- duo.js `gtPy` — tra pinyin cho chuỗi chữ Hán ---------- */
let GT_PYS: Map<string, string> | null = null;

const GT_X: Record<string, string> = {
  王: "wáng", 兰: "lán", 兰兰: "Lánlan", 怎么样: "zěnmeyàng", 怎: "zěn", 么: "me", 样: "yàng",
  跟: "gēn", 说: "shuō", 阿: "ā", 阿明: "Ā Míng", 明: "míng", 小: "xiǎo", 雪: "xuě",
  小雪: "Xiǎo Xuě", 手机: "shǒujī", 手: "shǒu", 机: "jī", 看: "kàn", 学校: "xuéxiào",
  学: "xué", 校: "xiào", 太: "tài", 们: "men", 了: "le", 您们: "nínmen",
};

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
          GT_PYS!.set(x[0], x[1]);
          GT_PYS!.set(duoPlain(x[0]), x[1]);
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
  const d = duoDict(),
    G = MS_GLOSS as Record<string, [string, string]>,
    X = GT_X;
  const look = (w: string): string =>
    (d.get(w) || [""])[0] || (G[w] || [""])[0] || X[w] || (w.length > 1 ? "" : pyOf(w));
  const out: string[] = [];
  let i = 0;
  while (i < pl.length) {
    let k = Math.min(4, pl.length - i),
      hit = "";
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

/* ---------- missions.js `msTok`/`msGl` (bong bóng tra từ; MS_GLOSS từ missions/data) ---------- */
export { MS_GLOSS };

/** missions.js `msTok` — tách câu thành token (chữ tra được nghĩa) + ký tự thường. */
export function msTok(zh: string): [string, number][] {
  const d = duoDict(),
    out: [string, number][] = [];
  let i = 0;
  const has = (w: string) => MS_GLOSS[w] || d.has(w);
  while (i < zh.length) {
    const c = zh[i];
    if (!/[一-鿿]/.test(c)) {
      out.push([c, 0]);
      i++;
      continue;
    }
    let k = Math.min(4, zh.length - i),
      hit: string | null = null;
    for (; k >= 1; k--) {
      const w = zh.substr(i, k);
      if (/^[一-鿿]+$/.test(w) && has(w)) {
        hit = w;
        break;
      }
    }
    hit = hit || c;
    out.push([hit, 1]);
    i += hit.length;
  }
  return out;
}

export function msGl(w: string): [string, string] | null {
  const g = MS_GLOSS[w];
  if (g) return g;
  const d = duoDict().get(w);
  return d ? [d[0], d[1]] : null;
}

/* ---------- lib.js `libToneVars` — 4 biến thể thanh của 1 âm ---------- */
const LIB_TM: Record<string, string> = {
  a: "āáǎà", e: "ēéěè", i: "īíǐì", o: "ōóǒò", u: "ūúǔù", ü: "ǖǘǚǜ",
};

export function libToneVars(py: string): string[] | null {
  for (let i = 0; i < py.length; i++)
    for (const b in LIB_TM) {
      if (LIB_TM[b].includes(py[i])) {
        return [0, 1, 2, 3].map((k) => py.slice(0, i) + LIB_TM[b][k] + py.slice(i + 1));
      }
    }
  return null;
}

/* ---------- gt-core.js / gm.js: sao, cổng, mở khoá ---------- */
export const GT_FREE = 5;
export const GT_NEED = 2;

/** gm.js `GT_GATES` + gates passed (`nh:gates`). */
export const GT_GATES = [5, 10, 15, 20, 25, 30, 35, 42, 47, 52, 55];

export function gmGateOf(i: number): boolean {
  return GT_GATES.includes(i);
}

export function gmGatePassed(g: number): boolean {
  try {
    const G = JSON.parse(ls.get("nh:gates") || "{}") as Record<string, string>;
    return !!G[g];
  } catch {
    return false;
  }
}

export function gtStarInfo(n: number): { n: number; parts: [string, boolean, string][] } {
  const L = GT_LESSONS[n],
    s = gtState();
  if (!L) return { n: 0, parts: [] };
  const q = (s.quiz && s.quiz[n]) || {},
    qOk = Object.values(q).filter(Boolean).length,
    qNeed = Math.ceil(L.quiz.length * 0.8);
  const led = ledger(),
    sayDone = L.say.filter(([zh]) => Object.keys(led).some((k) => k.startsWith("say:" + zh + ":"))).length,
    sayNeed = Math.min(3, L.say.length);
  const lis = !!(s.listen && s.listen[n]);
  const parts: [string, boolean, string][] = [
    ["Hoàn thành các nhiệm vụ", !!s.done[n], ""],
    ["Thử thách: đúng ngay lần đầu", qOk >= qNeed, `${qOk}/${L.quiz.length} câu, cần ${qNeed}`],
    [
      "Nghe – nói trong nhiệm vụ",
      sayDone >= sayNeed || lis,
      lis && sayDone < sayNeed ? "đã nghe đúng trong nhiệm vụ" : `nghe đúng trong nhiệm vụ, hoặc ghi âm ${sayDone}/${sayNeed} câu`,
    ],
  ];
  return { n: parts.filter((x) => x[1]).length, parts };
}

export function gtStars(n: number): number {
  return gtStarInfo(n).n;
}

export function gtAllPaid(): boolean {
  try {
    return permActive();
  } catch {
    return false;
  }
}

export function gtUnlocked(i: number): boolean {
  if (GT_LESSONS[i] && gtAllPaid()) return true;
  return (
    !!GT_LESSONS[i] &&
    (i <= GT_FREE || gtStars(i - 1) >= GT_NEED) &&
    (!gmGateOf(i - 1) || gmGatePassed(i - 1))
  );
}

/** gm.js `gtClassLesson` — bài đang học của lớp (theo cột sao). */
export function gtClassLesson(lv: number): number {
  const c = GT_CLASS[lv];
  if (!c) return 0;
  const s = gtState();
  let first = 0,
    last = 0;
  for (let i = c.from; i <= c.to; i++) {
    if (gtUnlocked(i)) {
      if (!first) first = i;
      last = i;
      if (!s.done[i] || (gtStars(i) < GT_NEED && i >= GT_FREE)) return i;
    }
  }
  return last || first;
}

export function gtWordStats(C0?: { from: number; to: number }): {
  learned: number;
  all: number;
  stars: number;
  done: number;
  cur: number;
  built: number;
} {
  C0 = C0 || { from: 1, to: 55 };
  const st = gtState(),
    learned = new Set<string>(),
    all = new Set<string>();
  let stars = 0,
    done = 0,
    cur = 0;
  for (let i = C0.from; i <= C0.to; i++) {
    const L = GT_LESSONS[i];
    if (!L) continue;
    L.words.forEach((w) => all.add(w[0]));
    if (st.done[i]) {
      done++;
      L.words.forEach((w) => learned.add(w[0]));
    }
    stars += gtStars(i);
    if (!cur && gtUnlocked(i) && !st.done[i]) cur = i;
  }
  return {
    learned: learned.size,
    all: all.size,
    stars,
    done,
    cur,
    built: Object.keys(GT_LESSONS).filter((k) => +k >= C0!.from && +k <= C0!.to).length,
  };
}

/** gm.js `gmStreak` (dùng store). */
export function gmStreak(): number {
  return useGm.getState().streak();
}

/** gt-data.js `gtLabel`. */
export function gtLabel(i: number): string {
  return i > 30 ? `Cơ sở – Bài ${i - 30}` : `Nhập môn – Bài ${i}`;
}
