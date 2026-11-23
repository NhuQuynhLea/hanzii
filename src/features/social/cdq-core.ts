/**
 * cdq.js core — trạng thái + sinh đề + bạn ảo cho trò chơi bàn Nhà sinh hoạt.
 * Không chứa DOM/React; phần UI nằm trong cdq.tsx.
 */
import { GT_LESSONS } from "@/data/gt-data";
import { usePresence } from "@/stores/presence";
import { sendPresence } from "@/services/presence/runtime";
import { libToneVars } from "./gt-share";
import type { CommPeer } from "./community";
import type { PlayerState } from "@/types/player";
import type { Word } from "@/types/lesson";

export const CDG: Record<string, { name: string; ic: string; ik: string; sub: string; N: number; T: number }> = {
  do: { name: "Đố nhanh", ic: "🎲", ik: "quiz", sub: "5 câu – chọn nghĩa, nghe chọn chữ", N: 5, T: 9000 },
  ghep: { name: "Ghép cặp tốc độ", ic: "🧩", ik: "match", sub: "Ghép 6 cặp chữ – nghĩa, xong càng nhanh càng nhiều điểm", N: 1, T: 45000 },
  thanh: { name: "Nghe đoán thanh", ic: "🎵", ik: "tone", sub: "5 câu – nghe từ, chọn đúng dấu thanh", N: 5, T: 9000 },
};
export const CDQ_LEAD = 4000;
export const CDQ_BOTS = [
  { n: "Minh", zh: "阿明", h: 2, lv: 3, sk: 0.72 },
  { n: "Tiểu Tuyết", zh: "小雪", h: 3, lv: 4, sk: 0.8 },
  { n: "Tiểu Mỹ", zh: "小美", h: 3, lv: 2, sk: 0.62 },
];

/* ---------- câu hỏi ---------- */
export type CdqQ =
  | { t: "ghep"; pairs: Word[] }
  | { t: "tone"; w: Word; o: string[] }
  | { t: "mean" | "listen"; w: Word; o: Word[] };

export interface CdqBot {
  n: string;
  zh: string;
  h: number;
  lv: number;
  sk: number;
  score: number;
  ans: { at: number; ok: boolean }[];
}

export interface CdqState {
  i: number;
  seed: number;
  t0: number;
  g: string;
  gm: string;
  N: number;
  T: number;
  Q: CdqQ[];
  cur: number;
  score: number;
  k1: number;
  la: number;
  mine: Record<number, 0 | 1>;
  bots: CdqBot[];
  miss: number;
}

/** Remote qz payload đã qua sanitize trong runtime.absorb. */
export interface Qz {
  tb: number;
  sd: number;
  t0: number;
  sc: number;
  k: number;
  la: number;
  g: string;
  gm: string;
}

export let cdq: CdqState | null = null;
export const cdqGet = () => cdq;
export const cdqSet = (v: CdqState | null) => (cdq = v);

export function cdqRand(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cdqPool(): Word[] {
  const ns = Object.keys(GT_LESSONS)
    .map(Number)
    .filter((n) => n <= 5)
    .sort((a, b) => a - b);
  const seen = new Set<string>(),
    out: Word[] = [];
  ns.forEach((n) =>
    GT_LESSONS[n].words.forEach((w) => {
      if (!seen.has(w[0])) {
        seen.add(w[0]);
        out.push(w);
      }
    }),
  );
  return out;
}

export function cdqShuf<T>(a: T[], R: () => number): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(R() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function cdqBuild(seed: number, g: string): CdqQ[] {
  const R = cdqRand(seed),
    P = cdqPool(),
    used = new Set<string>(),
    pick = (pool: Word[]): Word => {
      let w: Word = pool[0],
        k = 0;
      do {
        w = pool[Math.floor(R() * pool.length)];
        k++;
      } while (used.has(w[0]) && k < 200);
      used.add(w[0]);
      return w;
    };
  if (g === "ghep") {
    const pairs: Word[] = [];
    while (pairs.length < 6) {
      const w = pick(P);
      if (!pairs.some((x) => x[2] === w[2])) pairs.push(w);
    }
    return [{ t: "ghep", pairs }];
  }
  if (g === "thanh") {
    const TP = P.filter((w) => !/\s/.test(w[1]) && w[0].length <= 2 && libToneVars(w[1]));
    return Array.from({ length: 5 }, () => {
      const w = pick(TP);
      return { t: "tone" as const, w, o: cdqShuf(libToneVars(w[1])!.slice(), R) };
    });
  }
  return Array.from({ length: 5 }, (_, k) => {
    const w = pick(P),
      o: Word[] = [w];
    let guard = 0;
    while (o.length < 4 && guard++ < 300) {
      const x = P[Math.floor(R() * P.length)];
      if (!o.some((y) => y[0] === x[0] || y[2] === x[2])) o.push(x);
    }
    return { t: k % 2 ? ("listen" as const) : ("mean" as const), w, o: cdqShuf(o, R) };
  });
}

export function cdqDur(g: string): number {
  const G = CDG[g] || CDG.do;
  return G.N * G.T;
}

/* ---------- ai đang ở bàn ---------- */
export const qzOf = (o: PlayerState): Qz | null => ((o as CommPeer).qz as Qz | null) || null;

/** Người thật khác đang chơi cùng ván (cùng bàn + cùng seed). */
export function cdqHumans(): PlayerState[] {
  if (!cdq) return [];
  const out: PlayerState[] = [];
  usePresence.getState().others.forEach((o) => {
    const q = qzOf(o);
    if (o.sc === 5 && q && q.tb === cdq!.i && q.sd === cdq!.seed) out.push(o);
  });
  return out;
}

/** Ván đang diễn ra ở bàn i (do người khác host). */
export function cdqActiveAt(i: number): Qz | null {
  const now = Date.now();
  let best: Qz | null = null;
  usePresence.getState().others.forEach((o) => {
    const q = qzOf(o);
    if (o.sc === 5 && q && q.tb === i && q.t0 && now < q.t0 + cdqDur(q.g) - 2500 && (!best || q.t0 > best.t0)) best = q;
  });
  return best;
}

/** Người (remote) đang ngồi ở bàn i. */
export function cdqAt(i: number): PlayerState[] {
  const L: PlayerState[] = [];
  usePresence.getState().others.forEach((o) => {
    const q = qzOf(o);
    if (o.sc === 5 && q && q.tb === i) L.push(o);
  });
  return L;
}

/* ---------- presence ---------- */
export function cdqSend(): void {
  if (!cdq) return;
  sendPresence({
    qz: { tb: cdq.i, sd: cdq.seed, t0: cdq.t0, sc: cdq.score, k: cdq.k1, la: cdq.la, g: cdq.g, gm: cdq.gm },
  });
}

export function cdqLeave(): void {
  if (cdq) sendPresence({ qz: { tb: -1 } });
  cdq = null;
}

/* ---------- điểm ---------- */
export function cdqBotScore(_b: CdqBot, _j: number, a: { at: number; ok: boolean }): number {
  if (!cdq) return 0;
  return cdq.g === "ghep" ? 300 + Math.round((cdq.T - a.at) / 1000) * 10 : 100 + Math.round(((cdq.T - a.at) / cdq.T) * 100);
}

export interface CdqPlayerRow {
  me?: boolean;
  bot?: boolean;
  n: string;
  h: number;
  lv: number;
  score: number;
  st?: 0 | 1;
  done: boolean;
}

export function cdqPlayers(lvOf: (p: number | undefined) => number, myH: number, myN: string, myP: number): CdqPlayerRow[] {
  if (!cdq) return [];
  const now = Date.now(),
    k = cdq.cur,
    list: CdqPlayerRow[] = [
      { me: true, n: myN || "Bạn", h: myH || 0, lv: lvOf(myP), score: cdq.score, st: cdq.mine[k], done: cdq.k1 > k },
    ];
  cdqHumans().forEach((o) => {
    const q = qzOf(o);
    if (!q) return;
    list.push({
      n: o.n,
      h: o.h || 0,
      lv: lvOf(o.p || 0),
      score: q.sc || 0,
      st: q.k > k && k >= 0 ? ((q.la ? 1 : 0) as 0 | 1) : undefined,
      done: q.k > k,
    });
  });
  cdq.bots.forEach((b) => {
    let sc = 0,
      st: 0 | 1 | undefined,
      dn = false;
    cdq!.Q.forEach((_, j) => {
      const a = b.ans[j],
        due = cdq!.t0 + j * cdq!.T + a.at;
      if (now >= due && a.ok) sc += cdqBotScore(b, j, a);
      if (j === k && now >= due) {
        st = a.ok ? 1 : 0;
        dn = true;
      }
    });
    b.score = sc;
    list.push({ bot: true, n: b.n, h: b.h, lv: b.lv, score: sc, st, done: dn });
  });
  return list;
}
