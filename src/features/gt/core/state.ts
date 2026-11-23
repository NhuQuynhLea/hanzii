/**
 * GT (Giao tiếp cấp tốc) progression logic — ported from gt-core.js.
 * Also carries the pure gate/mission predicates gt-core consumed from
 * gt/gm.js (GT_GATES/gmGate*) and gt/missions.js (chDone) so unlock rules
 * behave identically; interactive features still go through callHook.
 */
import { GT_LESSONS, GT_STAGES, GT_STEPS, GT_TITLES, gtLabel } from "@/data/gt-data";
import type { GtLesson } from "@/types/gt";
import type { Word } from "@/types/lesson";
import { gtState, gtSave, useGt } from "@/stores/gt";
import { ledger, usePlayer } from "@/stores/player";
import { useUi } from "@/stores/ui";
import { ls } from "@/lib/storage";
import { permActive } from "@/services/entitlement";
import { callHook } from "@/services/hooks";
import { GT_CLASS } from "@/game/world/geometry";

export const GT_FREE = 5;
export const GT_NEED = 2;
/** Lessons that host a ⚔ gate battle (gm.js `GT_GATES`). */
export const GT_GATES = [5, 10, 15, 20, 25, 30, 35, 42, 47, 52, 55];

/** GT_LESSONS entries may carry optional fields not in the base GtLesson type. */
export interface GtLessonFull extends GtLesson {
  pronH?: string;
  pronP?: string;
  wordsMore?: Word[];
}
/** Per-buổi slice of a lesson (gt-core `gtSlice` result). */
export interface GtSlice extends GtLessonFull {
  buoi: number;
  nb: number;
  quizIdx: number[];
}

export const gtL = (n: number): GtLessonFull | undefined =>
  (GT_LESSONS as Record<number, GtLessonFull>)[n];

/* ---------------- stars ---------------- */

export interface GtStarInfo {
  n: number;
  parts: [string, boolean, string][];
}

export function gtStarInfo(n: number): GtStarInfo {
  const L = gtL(n);
  const s = gtState();
  if (!L) return { n: 0, parts: [] };
  const q = (s.quiz && s.quiz[n]) || {};
  const qOk = Object.values(q).filter(Boolean).length;
  const qNeed = Math.ceil(L.quiz.length * 0.8);
  const led = ledger();
  const sayDone = L.say.filter(([zh]) =>
    Object.keys(led).some((k) => k.startsWith("say:" + zh + ":")),
  ).length;
  const sayNeed = Math.min(3, L.say.length);
  const lis = !!(s.listen && s.listen[n]);
  const parts: [string, boolean, string][] = [
    ["Hoàn thành các nhiệm vụ", !!s.done[n], ""],
    ["Thử thách: đúng ngay lần đầu", qOk >= qNeed, `${qOk}/${L.quiz.length} câu, cần ${qNeed}`],
    [
      "Nghe – nói trong nhiệm vụ",
      sayDone >= sayNeed || lis,
      lis && sayDone < sayNeed
        ? "đã nghe đúng trong nhiệm vụ"
        : `nghe đúng trong nhiệm vụ, hoặc ghi âm ${sayDone}/${sayNeed} câu`,
    ],
  ];
  return { n: parts.filter((x) => x[1]).length, parts };
}

export const gtStars = (n: number): number => gtStarInfo(n).n;

/* ---------------- gates (gm.js predicates — pure data) ---------------- */

export const gmGateOf = (i: number): boolean => GT_GATES.includes(i);

export function gmGateRange(g: number): [number, number] {
  const k = GT_GATES.indexOf(g);
  return [k ? GT_GATES[k - 1] + 1 : 1, g];
}

const gmGateBig = (g: number): boolean => [15, 30, 42, 55].includes(g);

export function gmGateName(g: number): string {
  const big = gmGateBig(g);
  const [a, b] = gmGateRange(g);
  return big
    ? `Đại chiến cuối quyển ${(GT_STAGES.find((s) => g >= s.from && g <= s.to) || GT_STAGES[0]).name}`
    : `Trận đấu ${gtLabel(a).split(" – ")[0]} ${a > 30 ? a - 30 : a}–${b > 30 ? b - 30 : b}`;
}

export function gmGates(): Record<string, string> {
  try {
    return JSON.parse(ls.get("nh:gates") || "{}");
  } catch {
    return {};
  }
}

export const gmGatePassed = (g: number): boolean => !!gmGates()[g];

export function gmGateReady(g: number): boolean {
  const [a, b] = gmGateRange(g);
  const s = gtState();
  for (let i = a; i <= b; i++) if (!GT_LESSONS[i] || !s.done[i]) return false;
  return true;
}

export const gmGateOpenList = (): number[] =>
  GT_GATES.filter((g) => gmGateReady(g) && !gmGatePassed(g));

/* ---------------- unlock ---------------- */

export function gtAllPaid(): boolean {
  try {
    return !!permActive();
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

export function gtLockWhy(i: number): string {
  if (!GT_LESSONS[i] && i > 15)
    return gtAllPaid()
      ? "Bạn đã mở khoá toàn bộ – bài này ra mắt 30/11."
      : "🔒 Ra mắt ngày 30/11 (hoặc trả 69.000đ để mở khoá toàn bộ).";
  if (!GT_LESSONS[i] && gtAllPaid()) return "Bạn đã mở khoá toàn bộ – bài này sẽ hiện ngay khi có.";
  if (!GT_LESSONS[i])
    return GT_TITLES[i - 1]
      ? `🔒 Học xong ${gtLabel(i - 1)} và tích đủ ${GT_NEED}★ để mở.`
      : "🔒 Học các bài trước để mở.";
  if (gmGateOf(i - 1) && !gmGatePassed(i - 1)) return `🔒 Cần thắng ⚔ ${gmGateName(i - 1)}.`;
  return `🔒 Cần ${GT_NEED}★ ở ${gtLabel(i - 1)} để mở.`;
}

export const gtStarTxt = (k: number): string => "★".repeat(k) + "☆".repeat(3 - k);

/* ---------------- stats / current lesson ---------------- */

export interface GtRange {
  from: number;
  to: number;
}

export interface GtWordStats {
  learned: number;
  all: number;
  stars: number;
  done: number;
  cur: number;
  built: number;
}

export function gtWordStats(C0: GtRange = { from: 1, to: 55 }): GtWordStats {
  const st = gtState();
  const learned = new Set<string>();
  const all = new Set<string>();
  let stars = 0;
  let done = 0;
  let cur = 0;
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
    built: Object.keys(GT_LESSONS).filter((k) => +k >= C0.from && +k <= C0.to).length,
  };
}

/** gm.js `gtClassLesson`: current lesson to study inside a class. */
export function gtClassLesson(lv: number): number {
  const c = GT_CLASS[lv];
  if (!c) return 0;
  const s = gtState();
  let first = 0;
  let last = 0;
  for (let i = c.from; i <= c.to; i++) {
    if (gtUnlocked(i)) {
      if (!first) first = i;
      last = i;
      if (!s.done[i] || (gtStars(i) < GT_NEED && i >= GT_FREE)) return i;
    }
  }
  return last || first;
}

/** GT_CLASS index containing lesson n (1 default). */
export function classOf(n: number): number {
  const k = Object.keys(GT_CLASS).find((k) => n >= GT_CLASS[+k].from && n <= GT_CLASS[+k].to);
  return k ? +k : 1;
}

/* ---------------- buổi (session) slicing ---------------- */

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
  if (!L) return [];
  const ks = b === 1 ? GT_STEPS.map((x) => x[0]) : ["words", "dlg", "gram", "write", "quiz", "say"];
  return ks.filter((k) => k !== "write" || gtChunk(L.write, gtNS(n), b).length > 0);
}

export function gtIsSeen(n: number, b: number, k: string): boolean {
  const v = gtState().seen[n] || {};
  return !!(v[k + "@" + b] || v[k]);
}

export const gtBDone = (n: number, b: number): boolean =>
  gtBSteps(n, b).every((k) => gtIsSeen(n, b, k));

export function gtCurB(n: number): number {
  const S = gtNS(n);
  for (let b = 1; b <= S; b++) if (!gtBDone(n, b)) return b;
  return S;
}

export function gtSlice(L0: GtLessonFull, n: number, b: number): GtSlice {
  const S = gtNS(n);
  const qIdx = gtChunk(
    L0.quiz.map((_, i) => i),
    S,
    b,
  ).sort((a, c) => (/đọc/.test(L0.quiz[a][0]) ? 1 : 0) - (/đọc/.test(L0.quiz[c][0]) ? 1 : 0));
  const dl = [L0.dialog[Math.min(b - 1, L0.dialog.length - 1)]].concat(
    b === S && L0.dialog.length > S ? L0.dialog.slice(S) : [],
  );
  return Object.assign({}, L0, {
    words: gtChunk(L0.words, S, b),
    dialog: dl,
    grammar: gtChunk(L0.grammar, S, b),
    write: gtChunk(L0.write, S, b),
    quiz: qIdx.map((i) => L0.quiz[i]),
    quizIdx: qIdx,
    say: gtChunk(L0.say, S, b),
    buoi: b,
    nb: S,
  });
}

export function gtBMin(n: number, b: number): number {
  const L = gtSlice(gtL(n)!, n, b);
  return Math.round(
    (L.words.length * 8 +
      L.dialog.reduce((a, x) => a + x.lines.length, 0) * 7 +
      L.grammar.length * 60 +
      L.write.length * 25 +
      L.quiz.length * 12 +
      60 +
      (b === 1 ? 120 : 0)) /
      60,
  );
}

/* ---------------- session globals (gtCur/gtStep/gtBuoi/gtBuoiFor) ---------------- */

export const gtSess = { cur: 0, step: "goal", buoi: 1, buoiFor: 0 };

/** Update lesson-session globals; also mirrors into the useGt store. */
export function setGtSession(patch: Partial<typeof gtSess>): void {
  Object.assign(gtSess, patch);
  useGt.getState().setSession({
    ...(patch.cur != null ? { cur: patch.cur } : {}),
    ...(patch.step != null ? { step: patch.step } : {}),
    ...(patch.buoi != null ? { buoi: patch.buoi } : {}),
    ...(patch.buoiFor != null ? { buoiFor: patch.buoiFor } : {}),
  });
}

const gtStarLast: Record<number, number> = {};

export function gtStarInit(n: number): void {
  gtStarLast[n] = gtStarLast[n] ?? gtStars(n);
}

export function gtSeen(n: number, k: string, b?: number): void {
  const s = gtState();
  const bb = b ?? (gtSess.buoiFor === n ? gtSess.buoi : gtCurB(n));
  const key = k + "@" + bb;
  const seen = { ...(s.seen[n] || {}) };
  if (!seen[key]) {
    const was = gtBDone(n, bb);
    seen[key] = 1;
    gtSave({ ...s, seen: { ...s.seen, [n]: seen } });
    if (!was && gtBDone(n, bb)) {
      if (gtNS(n) > 1)
        usePlayer.getState().award(`gt:b:${n}:${bb}`, 5, `xong Buổi ${bb}/${gtNS(n)} – ${gtLabel(n)}`);
      callHook("gmGoalHit");
    }
  }
}

export function gtStarCheck(n: number): void {
  const k = gtStars(n);
  if (gtStarLast[n] != null && k > gtStarLast[n]) {
    useUi
      .getState()
      .toast(
        `${gtStarTxt(k)} ${gtLabel(n)}` +
          (n >= GT_FREE && k >= GT_NEED && GT_LESSONS[n + 1] ? ` – đã mở ${gtLabel(n + 1)}!` : ""),
      );
  }
  gtStarLast[n] = k;
}

export function gtCheckDone(n: number): void {
  const s = gtState();
  if (s.done[n]) return;
  if (Array.from({ length: gtNS(n) }, (_, i) => gtBDone(n, i + 1)).every(Boolean)) {
    gtSave({ ...s, done: { ...s.done, [n]: 1 } });
    usePlayer
      .getState()
      .award("gt:done:" + n, 20, "hoàn thành " + gtLabel(n) + " Giao tiếp cấp tốc");
    callHook("gtConfetti");
  }
}

/* ---------------- missions (nh:ch / nh:ms reads; ids via hooks) ---------------- */

export function chGet(): Record<string, number> {
  try {
    return JSON.parse(ls.get("nh:ch") || "{}");
  } catch {
    return {};
  }
}

export const chDone = (n: number, b: number): boolean => !!chGet()[n + ":" + b];

export function msPlayed(id: string): boolean {
  try {
    return !!JSON.parse(ls.get("nh:ms") || "{}")[id];
  } catch {
    return false;
  }
}

/** missions.js `msIdFor` — provided by the missions feature via hook. */
export const msIdFor = (n: number, b: number): string =>
  (callHook<string>("msIdFor", n, b) as string | undefined) || "";

/** missions.js `msGet` — provided by the missions feature via hook. */
export const msGet = <T>(id: string): T | undefined => callHook<T>("msGet", id);

/** missions.js `gtNextAct`: "ch" (challenge) or "ms" (mission). */
export const gtNextAct = (n: number, b: number): "ch" | "ms" =>
  (callHook<string>("gtNextAct", n, b) as "ch" | "ms" | undefined) ??
  (!msIdFor(n, b) || !chDone(n, b) ? "ch" : "ms");

/** duo.js `duoStart` — missions registers the wrapped "duoStart" hook
 *  (opens the mission when the buổi's challenge is already done). `skip`
 *  is the original `duoStart._skip` flag, set via the "duoSkip" hook. */
export const duoStart = (n: number, b: number, skip?: boolean): void => {
  if (skip) callHook("duoSkip", true);
  try {
    callHook("duoStart", n, b);
  } finally {
    if (skip) callHook("duoSkip", false);
  }
};

export { GT_TITLES, gtLabel };
