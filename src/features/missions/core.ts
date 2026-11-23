/**
 * Mission core logic — non-React port of game/js/gt/missions.js
 * (msIdFor/msGet/msGen/msNumZh/msTok/msGl/msFr/ms_get/chGet/chDone/chMark/gtNextAct)
 * plus the gt-core.js helpers it depends on (gtSlice/gtNS/gtBSteps/gtSeen/
 * gtCheckDone/gtStarCheck/gtUnlocked/gtCurB) and the duo.js text helpers
 * (duoDict/duoTok/duoPlain/gtPy) that msGen/msTok/token tiles need.
 */
import { GT_LESSONS, GT_STEPS, gtLabel } from "@/data/gt-data";
import type { GtLesson } from "@/types/gt";
import type { Word } from "@/types/lesson";
import { shuffle } from "@/lib/helpers";
import { ls } from "@/lib/storage";
import { pyOf } from "@/features/ui-bits";
import { permActive } from "@/services/entitlement";
import { callHook } from "@/services/hooks";
import { ledger, usePlayer } from "@/stores/player";
import { gmGet, gmSave } from "@/stores/gm";
import { gtSave, gtState, useGt } from "@/stores/gt";
import { toast } from "@/stores/ui";
import {
  GM_SHOP,
  MISSIONS,
  MS_FOR,
  MS_GIFT,
  MS_GLOSS,
  MS_NPC,
  MS_RE,
  MS_ROLE,
  MS_SCN,
  type MsMission,
  type MsStep,
} from "./data";

/* ================= duo.js text helpers (needed by msTok/msGen) ================= */

let DUO_DICT: Map<string, [string, string]> | null = null;

/** zh word → [pinyin, vi] map over every GT lesson (duo.js `duoDict`). */
export function duoDict(): Map<string, [string, string]> {
  if (DUO_DICT) return DUO_DICT;
  const m = new Map<string, [string, string]>();
  Object.values(GT_LESSONS).forEach((L) =>
    ((L as GtLesson & { wordsAll?: Word[] }).wordsAll || L.words).forEach(([z, p, v]) => {
      if (!m.has(z)) m.set(z, [p, v]);
    }),
  );
  DUO_DICT = m;
  return m;
}

/** Greedy dictionary segmentation (duo.js `duoTok`). */
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

/** Hanzi only (duo.js `duoPlain`). */
export function duoPlain(zh: string): string {
  return zh.replace(/[^一-鿿]/g, "");
}

let GT_PYS: Map<string, string> | null = null;

/** Best-effort pinyin lookup over GT content (duo.js `gtPy`). */
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
          GT_PYS!.set(x[0], x[1] as string);
          GT_PYS!.set(duoPlain(x[0]), x[1] as string);
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
    G = MS_GLOSS;
  const X: Record<string, string> = {
    王: "wáng", 兰: "lán", 兰兰: "Lánlan", 怎么样: "zěnmeyàng", 怎: "zěn", 么: "me", 样: "yàng",
    跟: "gēn", 说: "shuō", 阿: "ā", 阿明: "Ā Míng", 明: "míng", 小: "xiǎo", 雪: "xuě",
    小雪: "Xiǎo Xuě", 手机: "shǒujī", 手: "shǒu", 机: "jī", 看: "kàn", 学校: "xuéxiào",
    学: "xué", 校: "xiào", 太: "tài", 们: "men", 了: "le", 您们: "nínmen",
  };
  const look = (w: string): string => (d.get(w) || [""])[0] || (G[w] || [""])[0] || X[w] || (w.length > 1 ? "" : pyOf(w));
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

/* ================= gt-core.js helpers ================= */

export const GT_FREE = 5;
export const GT_NEED = 2;

export function gtAllPaid(): boolean {
  return permActive();
}

export function gtNS(n: number): number {
  const L = GT_LESSONS[n];
  return L ? Math.max(2, Math.min(3, L.dialog.length)) : 1;
}

export function gtChunk<T>(a: T[], S: number, b: number): T[] {
  const per = Math.ceil(a.length / S);
  return a.slice((b - 1) * per, b * per);
}

export function gtBSteps(n: number, b: number): string[] {
  const L = GT_LESSONS[n];
  const ks = b === 1 ? GT_STEPS.map((x) => x[0]) : ["words", "dlg", "gram", "write", "quiz", "say"];
  return ks.filter((k) => k !== "write" || gtChunk(L.write, gtNS(n), b).length);
}

export function gtIsSeen(n: number, b: number, k: string): boolean {
  const v = gtState().seen[n] || {};
  return !!(v[k + "@" + b] || v[k]);
}

export function gtBDone(n: number, b: number): boolean {
  return gtBSteps(n, b).every((k) => gtIsSeen(n, b, k));
}

export function gtCurB(n: number): number {
  const S = gtNS(n);
  for (let b = 1; b <= S; b++) if (!gtBDone(n, b)) return b;
  return S;
}

export interface GtSlice extends GtLesson {
  quizIdx: number[];
  buoi: number;
  nb: number;
}

export function gtSlice(L: GtLesson, n: number, b: number): GtSlice {
  const S = gtNS(n),
    qIdx = gtChunk(
      L.quiz.map((_q, i) => i),
      S,
      b,
    ).sort((a, c) => (/đọc/.test(L.quiz[a][0]) ? 1 : 0) - (/đọc/.test(L.quiz[c][0]) ? 1 : 0));
  const dl = [L.dialog[Math.min(b - 1, L.dialog.length - 1)]].concat(
    b === S && L.dialog.length > S ? L.dialog.slice(S) : [],
  );
  return Object.assign({}, L, {
    words: gtChunk(L.words, S, b),
    dialog: dl,
    grammar: gtChunk(L.grammar, S, b),
    write: gtChunk(L.write, S, b),
    quiz: qIdx.map((i) => L.quiz[i]),
    quizIdx: qIdx,
    say: gtChunk(L.say, S, b),
    buoi: b,
    nb: S,
  });
}

export function gtSeen(n: number, k: string): void {
  const s = { ...gtState(), seen: { ...gtState().seen } };
  const g = useGt.getState();
  const b = g.buoiFor === n ? g.buoi : gtCurB(n);
  const key = k + "@" + b;
  s.seen[n] = { ...(s.seen[n] || {}) };
  if (!s.seen[n][key]) {
    const was = gtBDone(n, b);
    s.seen[n][key] = 1;
    gtSave(s);
    if (!was && gtBDone(n, b)) {
      if (gtNS(n) > 1)
        usePlayer.getState().award(`gt:b:${n}:${b}`, 5, `xong Buổi ${b}/${gtNS(n)} – ${gtLabel(n)}`);
      callHook("gmGoalHit");
    }
  }
}

const gtStarLast: Record<number, number> = {};

export function gtStarTxt(k: number): string {
  return "★".repeat(k) + "☆".repeat(3 - k);
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

export function gtStarCheck(n: number): void {
  const k = gtStars(n);
  if (gtStarLast[n] != null && k > gtStarLast[n]) {
    toast(
      `${gtStarTxt(k)} ${gtLabel(n)}` +
        (n >= GT_FREE && k >= GT_NEED && GT_LESSONS[n + 1] ? ` – đã mở ${gtLabel(n + 1)}!` : ""),
    );
  }
  gtStarLast[n] = k;
}

export function gtCheckDone(n: number): void {
  const s = { ...gtState(), seen: { ...gtState().seen }, done: { ...gtState().done } };
  if (s.done[n]) return;
  if ([...Array(gtNS(n))].every((_x, i) => gtBDone(n, i + 1))) {
    s.done[n] = 1;
    gtSave(s);
    usePlayer.getState().award("gt:done:" + n, 20, "hoàn thành " + gtLabel(n) + " Giao tiếp cấp tốc");
    callHook("gtConfetti");
  }
}

export function gtUnlocked(i: number): boolean {
  if (GT_LESSONS[i] && gtAllPaid()) return true;
  return (
    !!GT_LESSONS[i] &&
    (i <= GT_FREE || gtStars(i - 1) >= GT_NEED) &&
    (!callHook("gmGateOf", i - 1) || !!callHook("gmGatePassed", i - 1))
  );
}

/* ================= missions.js pure functions ================= */

export function msIdFor(n: number, b: number): string | null {
  if (MS_FOR[n + ":" + b]) return MS_FOR[n + ":" + b];
  const L = GT_LESSONS[n];
  return L && L.dialog[b - 1] && MS_SCN[n + ":" + b] ? `g:${n}:${b}` : null;
}

export function msGet(id: string): MsMission | null {
  if (MISSIONS[id]) return MISSIONS[id];
  const m = /^g:(\d+):(\d+)$/.exec(id || "");
  if (!m) return null;
  const M = msGen(+m[1], +m[2]);
  if (M) MISSIONS[id] = M;
  return M;
}

export function msGen(n: number, b: number): MsMission | null {
  const L = GT_LESSONS[n],
    d = L && L.dialog[b - 1],
    C = MS_SCN[n + ":" + b];
  if (!d || !C) return null;
  const Ls = gtSlice(L, n, b);
  const bsp = (d.lines.find((l) => l[1] === "b") || [])[0] as string | undefined,
    asp = (d.lines.find((l) => l[1] === "a") || [])[0] as string | undefined;
  const npc =
    C[4] ||
    (bsp === "员" ? { name: "Nhân viên", zh: "服务员", h: 1, lv: 6, key: "staff" } : (bsp && MS_NPC[bsp]) || undefined) ||
    MS_NPC.王;
  const pool = Object.entries(GT_LESSONS)
    .filter(([k]) => +k <= n)
    .flatMap(([_k, X]) => X.dialog.flatMap((D) => (D === d ? [] : D.lines)))
    .map((l) => ({ zh: l[2], py: l[3], vi: l[4] }));
  const steps: MsStep[] = [
    { k: "story", t: d.scene.replace(/^Cảnh \d+ – /, "") + ` Bạn vào vai ${MS_ROLE[asp ?? ""] || "chính mình"}.` },
  ];
  const easy = n <= 2,
    NW = easy ? 2 : 3,
    MAXT = 3;
  const lineHas = (w: Word) => d.lines.some((l) => l[2].includes(w[0]));
  const ws = [...Ls.words.filter(lineHas), ...Ls.words.filter((w) => !lineHas(w))].slice(0, NW);
  ws.forEach((w) => steps.push({ k: "lw", w, pool: L.words }));
  let ai = 0;
  d.lines.forEach((l) => {
    const o = { zh: l[2], py: l[3], vi: l[4] };
    if (l[1] !== "a") {
      steps.push({ k: "npc", ...o });
      return;
    }
    const tok = duoTok(l[2]);
    ai++;
    if (ai > MAXT) {
      steps.push({ k: "auto", ...o });
      return;
    }
    if (ai % 2 === 0 && tok.length >= 2 && tok.length <= (n <= 3 ? 4 : 5)) {
      const end = /[^一-鿿]$/.test(l[2]) ? l[2].slice(-1) : "";
      steps.push({
        k: "build",
        task: `Nói: “${l[4]}”`,
        ans: tok,
        extra: shuffle(L.words.map((w) => w[0]).filter((z) => !tok.includes(z) && z.length <= 2)).slice(0, 2),
        end,
        py: l[3],
        vi: l[4],
        hint: `Câu cần nói: “${l[4]}”. Bắt đầu bằng 「${tok[0]}」.`,
      });
      return;
    }
    const near = shuffle(pool.filter((p) => p.zh !== o.zh && Math.abs(p.zh.length - o.zh.length) <= 6))
      .filter((p, i, a) => a.findIndex((q) => q.zh === p.zh) === i)
      .slice(0, easy ? 1 : 2);
    steps.push({
      k: "choose",
      task: ai === 1 && d.lines[0][1] === "a" ? `Mở lời với ${npc.name}` : `Đến lượt bạn trả lời ${npc.name}`,
      meaning: l[4],
      showMeaning: easy,
      opts: [
        { ...o, ok: 1 },
        ...near.map((p) => ({
          ...p,
          re: MS_RE[Math.floor(Math.random() * MS_RE.length)],
          hint: `Câu đó nghĩa là “${p.vi}”. Ở đây bạn muốn nói: “${o.vi}”.`,
        })),
      ],
    });
  });
  if (!easy) {
    const sa = d.lines.filter((l) => l[1] === "a").sort((x, y) => x[2].length - y[2].length)[0];
    if (sa)
      steps.push({ k: "say", task: "Thêm: nói thử câu bạn vừa dùng (có thể bỏ qua)", zh: sa[2], py: sa[3], vi: sa[4] });
  }
  const tips = Ls.grammar.slice(0, 1).map((g): [string, string] => [g.t, g.d.split(/(?<=\.)\s/)[0]]);
  return {
    n,
    b,
    title: C[0],
    place: C[1],
    scene: { bg: C[3], icon: C[2], place: C[1] },
    npc,
    npcKey: npc.key || "wang",
    steps,
    tips,
    reward: { fr: npc.name, sticker: `${C[2]} ${C[0]}` },
  };
}

/** Number → [chữ Hán, pinyin] (msNumZh). */
export function msNumZh(n: number): [string, string] {
  const D = "零一二三四五六七八九",
    P = ["líng", "yī", "èr", "sān", "sì", "wǔ", "liù", "qī", "bā", "jiǔ"];
  const t = Math.floor(n / 10),
    u = n % 10;
  let z = "";
  const p: string[] = [];
  if (t) {
    if (t > 1) {
      z += D[t];
      p.push(P[t]);
    }
    z += "十";
    p.push("shí");
  }
  if (u || !t) {
    z += D[u];
    p.push(P[u]);
  }
  return [z, p.join("")];
}

/** Tokenise zh into [text, isWord] pairs, longest-match (msTok). */
export function msTok(zh: string): [string, number][] {
  const d = duoDict(),
    out: [string, number][] = [];
  let i = 0;
  const has = (w: string) => !!MS_GLOSS[w] || d.has(w);
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

/** Gloss lookup for a token (msGl). */
export function msGl(w: string): [string, string] | null {
  const g = MS_GLOSS[w];
  if (g) return g;
  const d = duoDict().get(w);
  return d ? [d[0], d[1]] : null;
}

/* ================= persisted mission/challenge state ================= */

export interface MsFrMap {
  _n?: Record<string, [string, string, number, number]>;
  [k: string]: unknown;
}

/** NPC friendship map `nh:fr` (msFr). */
export function msFr(): MsFrMap {
  try {
    return JSON.parse(ls.get("nh:fr") || "{}");
  } catch {
    return {};
  }
}

/** Play-count per mission id `nh:ms` (ms_get). */
export function msDone(): Record<string, number> {
  try {
    return JSON.parse(ls.get("nh:ms") || "{}");
  } catch {
    return {};
  }
}

/** Daily-challenge-done flags `nh:ch` (chGet). */
export function chGet(): Record<string, number> {
  try {
    return JSON.parse(ls.get("nh:ch") || "{}");
  } catch {
    return {};
  }
}

export function chDone(n: number, b: number): boolean {
  return !!chGet()[n + ":" + b];
}

export function chMark(n: number, b: number): void {
  const C = chGet();
  C[n + ":" + b] = 1;
  ls.set("nh:ch", JSON.stringify(C));
}

/** What the student should do next on buổi b of bài n (gtNextAct). */
export function gtNextAct(n: number, b: number): "ch" | "ms" {
  const id = msIdFor(n, b);
  return !id || !chDone(n, b) ? "ch" : "ms";
}

/** Last played mission id (ms_last) — "Chơi lại" target. */
let msLast = "cafe";
export const msLastGet = (): string => msLast;
export const msLastSet = (id: string): void => {
  msLast = id;
};

/** `duoStart._skip` — force the challenge flow even when a mission is unlocked. */
let duoSkip = false;
export const getDuoSkip = (): boolean => duoSkip;
export const setDuoSkip = (v: boolean): void => {
  duoSkip = v;
};

/** Mission-completion gift for finishing all buổi of bài n (msEnd logic). */
export function msGiftName(n: number, G: Record<string, number>): string {
  const all = [...Array(gtNS(n))].every((_x, i) => {
    const id = msIdFor(n, i + 1);
    return !!(id && G[id]);
  });
  const key = MS_GIFT[n];
  if (!all || !key) return "";
  const gm = { ...gmGet(), own: [...gmGet().own] };
  if (gm.own.includes(key)) return "";
  gm.own.push(key);
  gmSave(gm);
  const [sl, iid] = key.split(":");
  return (GM_SHOP[sl].items.find((x) => x[0] === +iid) || [0, "", 0, 0])[1] || "";
}
