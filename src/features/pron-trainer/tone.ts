/**
 * Tone target curves + microphone pitch tracking + scoring
 * (scene-pron.js TRAINER_TPL: TF/effTones/target/tMean/pitch/toCurve/
 * judgeSeg/judge/fakeCurve).
 */
import type { Syl } from "./sylls";

/** Ideal tone contour on the 1–5 pitch scale, u = progress inside syllable. */
const TF: Record<number, (t: number) => number> = {
  1: () => 5,
  2: (t) => 3 + 2 * t,
  3: (t) => (t < 0.4 ? 2 - t / 0.4 : 1 + (3 * (t - 0.4)) / 0.6),
  4: (t) => 5 - 4 * t,
  5: () => 2.6,
};

/**
 * Effective tones after sandhi: 3+3 → 2+3; a tone-3 followed by another
 * syllable becomes "half third" (-3).
 */
export function effTones(S: Syl[]): number[] {
  const T = S.map((x) => x.t);
  for (let i = 0; i < T.length - 1; i++) if (T[i] === 3 && T[i + 1] === 3) T[i] = 2;
  if (T.length > 1) for (let i = 0; i < T.length - 1; i++) if (T[i] === 3) T[i] = -3;
  return T;
}

/** Target pitch (1–5) at normalized time t∈[0,1) across the whole word. */
export function toneTarget(S: Syl[], t: number): number {
  const T = effTones(S),
    n = T.length || 1,
    i = Math.min(n - 1, Math.floor(t * n)),
    u = t * n - i,
    k = T[i];
  return k === -3 ? 2 - 1 * u : (TF[k] || TF[5])(u);
}

/** Mean of the target curve (used to offset the learner's curve). */
export function tMean(S: Syl[]): number {
  let s = 0;
  for (let i = 0; i <= 40; i++) s += toneTarget(S, i / 40);
  return s / 41;
}

/* ======== GHI ÂM + DÒ CAO ĐỘ ======== */
export type PitchPoint = [number, number]; // [t seconds, hz|-1]

export interface CurveResult {
  /** normalized [t 0..1, pitch 1..5 scale] */
  curve: PitchPoint[];
  dur: number;
}

/** Autocorrelation pitch estimate; -1 when unvoiced/uncertain. */
export function pitch(buf: Float32Array, sr: number): number {
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / buf.length);
  if (rms < 0.012) return -1;
  const N = 1024,
    minL = Math.floor(sr / 500),
    maxL = Math.floor(sr / 70);
  let best = -1,
    bc = 0;
  for (let l = minL; l <= maxL; l++) {
    let s = 0,
      a = 0,
      b = 0;
    for (let i = 0; i < N; i++) {
      const x = buf[i],
        y = buf[i + l];
      s += x * y;
      a += x * x;
      b += y * y;
    }
    const c = s / Math.sqrt(a * b + 1e-9);
    if (c > bc) {
      bc = c;
      best = l;
    }
  }
  return bc > 0.82 && best > 0 ? sr / best : -1;
}

/** Raw [t,hz] samples → smoothed, median-normalized curve (null if too short). */
export function toCurve(raw: PitchPoint[]): CurveResult | null {
  const pts = raw.filter((p) => p[1] > 0);
  if (pts.length < 4) return null;
  const clean = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const r = pts[i][1] / clean[clean.length - 1][1];
    if (r < 1.7 && r > 0.6) clean.push(pts[i]);
  }
  if (clean.length < 4) return null;
  const sm = clean.map((p, i) => {
    const v = clean.slice(Math.max(0, i - 1), i + 2).map((x) => x[1]).sort((a, b) => a - b);
    return [p[0], v[Math.floor(v.length / 2)]] as PitchPoint;
  });
  const hz = sm.map((p) => p[1]).slice().sort((a, b) => a - b),
    med = hz[Math.floor(hz.length / 2)],
    t0 = sm[0][0],
    dur = Math.max(0.001, sm[sm.length - 1][0] - t0);
  return { curve: sm.map((p) => [(p[0] - t0) / dur, 3 + (12 * Math.log2(p[1] / med)) / 3]), dur };
}

function judgeSeg(c: PitchPoint[], t: number): [boolean, string] {
  if (c.length < 3) return [true, ""];
  const n = Math.max(1, Math.floor(c.length * 0.3)),
    avg = (a: PitchPoint[]) => a.reduce((s, p) => s + p[1], 0) / a.length,
    ys = c.map((p) => p[1]);
  const A = avg(c.slice(0, n)) * 3,
    C = avg(c.slice(-n)) * 3,
    m = Math.min(...ys) * 3,
    M = Math.max(...ys) * 3;
  if (t === 4) {
    const d = A - C;
    return d >= 4
      ? [true, "rơi rõ"]
      : d <= -2
        ? [false, "đang đi lên, nghe như thanh 2"]
        : [false, "chưa rơi đủ, hãy hạ mạnh từ cao xuống"];
  }
  if (t === 1) {
    return M - m < 3.5 && Math.abs(C - A) < 2
      ? [true, "cao và đều"]
      : C < A - 2
        ? [false, "bị rơi ở cuối, hãy giữ cao"]
        : [false, "chưa đều, giữ ngang như hát một nốt"];
  }
  if (t === 2) {
    const d = C - A;
    return d >= 3
      ? [true, "lên rõ"]
      : d <= -2
        ? [false, "đang rơi, nghe như thanh 4"]
        : [false, "chưa lên đủ, kéo giọng lên ở cuối"];
  }
  if (t === 3 || t === -3) {
    const dn = A - m,
      up = C - m;
    if (t === -3) return dn >= 1 || A - C >= 1.5 ? [true, "xuống thấp"] : [false, "chưa xuống thấp"];
    return dn >= 1 && up >= 2.5
      ? [true, "xuống rồi lên"]
      : dn >= 2 && up < 2
        ? [false, "mới xuống, chưa lên lại"]
        : [false, "hạ thấp trước rồi mới lên"];
  }
  return [true, "nhẹ"];
}

/** [ok, message] — per-syllable segment judging against effective tones. */
export function judge(S: Syl[], r: CurveResult | null): [boolean, string] {
  if (!r)
    return [false, "Chưa bắt được giọng. Hãy nói to hơn, gần micro hơn và đọc rõ từng âm."];
  const T = effTones(S),
    n = T.length;
  const res = T.map((t, i) => {
    const m = 0.1 / n,
      seg = r.curve.filter((p) => p[0] >= i / n + m && p[0] < (i + 1) / n - m);
    return judgeSeg(seg, t);
  });
  const ok = res.every((x) => x[0]);
  const parts = res
    .map((x, i) => `${S[i].s} ${x[0] ? "✓" : "✗"}${x[1] ? " (" + x[1] + ")" : ""}`)
    .join(" – ");
  let msg = ok ? "Rất tốt! Thanh điệu đúng hướng. " : "Gần được rồi, xem từng âm: ";
  msg += parts;
  if (r.dur < 0.2 * n) msg += ". Đọc hơi nhanh, kéo dài thêm một chút nhé.";
  return [ok, msg];
}

/** Synthetic curve for the "Xem ví dụ" buttons (no mic needed). */
export function fakeCurve(S: Syl[], f: (t: number) => number): CurveResult {
  const c: PitchPoint[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    c.push([t, f(t) + Math.sin(i * 1.7) * 0.05]);
  }
  return { curve: c, dur: 0.6 * S.length };
}
