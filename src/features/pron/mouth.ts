/**
 * Khẩu hình — mouth-shape model + per-syllable articulation plan.
 * Ported verbatim from game/js/pron.js (MV / INI_V / INI_TIP / V_DESC /
 * TONE_TIP / sylPlan / mouthDraw / animateMouth).
 *
 * The SVG itself is rendered by PronDialog; mouthDraw keeps the original
 * imperative attribute writes so the path math stays byte-identical.
 */
import { PY_INI } from "@/lib/pinyin";

/** Mouth pose: o=open, w=wide, r=round, t=tongue-up, f=fricative-bite. */
export interface MouthPose {
  o: number;
  w: number;
  r: number;
  t: number;
  f: number;
}

export const MV: Record<string, MouthPose> = {
  rest: { o: 0.04, w: 0.35, r: 0, t: 0, f: 0 },
  a: { o: 0.95, w: 0.55, r: 0, t: 0, f: 0 },
  o: { o: 0.58, w: 0.12, r: 0.85, t: 0, f: 0 },
  e: { o: 0.45, w: 0.5, r: 0, t: 0, f: 0 },
  i: { o: 0.12, w: 1, r: 0, t: 0.2, f: 0 },
  u: { o: 0.16, w: 0, r: 1, t: 0, f: 0 },
  ü: { o: 0.13, w: 0, r: 0.9, t: 0.25, f: 0 },
  er: { o: 0.38, w: 0.4, r: 0.1, t: 0.65, f: 0 },
  n: { o: 0.22, w: 0.45, r: 0, t: 1, f: 0 },
  ng: { o: 0.36, w: 0.4, r: 0, t: 0, f: 0 },
  b: { o: 0, w: 0.38, r: 0, t: 0, f: 0 },
  f: { o: 0.1, w: 0.45, r: 0, t: 0, f: 1 },
  d: { o: 0.26, w: 0.45, r: 0, t: 1, f: 0 },
  g: { o: 0.36, w: 0.4, r: 0, t: 0, f: 0 },
  j: { o: 0.12, w: 0.9, r: 0, t: 0.3, f: 0 },
  zh: { o: 0.2, w: 0.15, r: 0.55, t: 0.7, f: 0 },
  z: { o: 0.08, w: 0.85, r: 0, t: 0.35, f: 0 },
};

export const INI_V: Record<string, string> = {
  b: "b", p: "b", m: "b", f: "f", d: "d", t: "d", n: "d", l: "d",
  g: "g", k: "g", h: "g", j: "j", q: "j", x: "j",
  zh: "zh", ch: "zh", sh: "zh", r: "zh", z: "z", c: "z", s: "z",
  y: "i", w: "u",
};

export const INI_TIP: Record<string, string> = {
  b: "Mím hai môi rồi mở ra, không bật hơi.",
  p: "Mím hai môi rồi bật mạnh một luồng hơi (để tờ giấy trước miệng sẽ thấy giấy rung).",
  m: "Mím hai môi, cho hơi ra đằng mũi.",
  f: "Răng trên chạm nhẹ vào môi dưới, hơi lách ra.",
  d: "Đầu lưỡi chạm chân răng trên rồi bật ra, không bật hơi.",
  t: "Như d nhưng bật hơi mạnh.",
  n: "Đầu lưỡi chạm chân răng trên, hơi ra đằng mũi.",
  l: "Đầu lưỡi chạm chân răng trên, hơi đi hai bên lưỡi.",
  g: "Cuống lưỡi nâng chạm vòm mềm rồi bật ra, không bật hơi.",
  k: "Như g nhưng bật hơi mạnh.",
  h: "Hơi cọ xát ở cuống lưỡi, gần giống “kh” nhẹ.",
  j: "Mặt lưỡi áp vào vòm cứng, môi dẹt như cười, không bật hơi.",
  q: "Như j nhưng bật hơi mạnh.",
  x: "Mặt lưỡi gần vòm cứng, môi dẹt, hơi lách ra nhẹ.",
  zh: "Cong đầu lưỡi lên chạm vòm cứng, môi hơi tròn, không bật hơi.",
  ch: "Như zh nhưng bật hơi mạnh.",
  sh: "Cong đầu lưỡi lên gần vòm cứng, hơi lách ra.",
  r: "Cong lưỡi như sh nhưng rung dây thanh.",
  z: "Đầu lưỡi chạm sau răng trên, bật ra như “ts” nhẹ, không bật hơi.",
  c: "Như z nhưng bật hơi mạnh.",
  s: "Đầu lưỡi gần sau răng trên, hơi lách ra như “x” tiếng Việt.",
  y: "Bắt đầu với môi dẹt như i.",
  w: "Bắt đầu với môi chu tròn như u.",
};

export const V_DESC: Record<string, string> = {
  a: "há miệng rộng",
  o: "môi tròn vừa",
  e: "mở vừa, môi không tròn, âm lùi về sau (gần “ơ” kéo về “ư”)",
  ê: "mở vừa, môi dẹt (gần “ê”)",
  i: "môi dẹt sang hai bên như cười",
  u: "chu môi tròn nhỏ",
  ü: "lưỡi đặt như i, môi chu tròn như u",
  er: "mở vừa rồi cong đầu lưỡi lên",
  n: "kết thúc bằng đầu lưỡi chạm chân răng trên",
  ng: "kết thúc bằng cuống lưỡi nâng lên, miệng vẫn mở",
  zi: "giữ nguyên vị trí của phụ âm đầu, chỉ kéo dài âm",
};

export const TONE_TIP: string[] = [
  "Thanh nhẹ: đọc ngắn và nhẹ.",
  "Thanh 1: giọng cao và đều.",
  "Thanh 2: giọng đi lên, gần dấu sắc.",
  "Thanh 3: xuống thấp rồi lên.",
  "Thanh 4: rơi mạnh từ cao xuống.",
];

export interface SylPlan {
  /** sequence of MV keys to animate through */
  seq: string[];
  /** [nhãn, mô tả] pairs shown in the tip box */
  tips: [string, string][];
}

/** Break a base (tone-less) syllable into articulator poses + tips. */
export function sylPlan(base: string): SylPlan {
  const ini = (PY_INI.exec(base) || [""])[0] || "",
    fin0 = base.slice(ini.length).replace(/r$/, base.length > 2 && base !== "er" ? "" : "r");
  let fin = fin0;
  if (/^[jqxy]$/.test(ini) && fin.startsWith("u")) fin = "ü" + fin.slice(1);
  if (fin === "iu") fin = "iou";
  else if (fin === "ui") fin = "uei";
  else if (fin === "un") fin = "uen";
  else if (fin === "ao") fin = "au";
  else if (fin === "iao") fin = "iau";
  const seq: string[] = [],
    names: string[] = [];
  if (ini) seq.push(INI_V[ini]);
  if (/^(zh|ch|sh|r|z|c|s)$/.test(ini) && fin === "i") {
    names.push("zi");
    seq.push(INI_V[ini]);
  } else if (fin === "er") {
    seq.push("er");
    names.push("er");
  } else {
    let k = 0;
    while (k < fin.length) {
      if (fin.startsWith("ng", k)) {
        seq.push("ng");
        names.push("ng");
        k += 2;
        continue;
      }
      const c = fin[k];
      const v = c === "n" ? "n" : c;
      if (MV[v]) {
        seq.push(v);
        names.push(c === "e" && (/[iü]/.test(fin[k - 1] || "") || fin[k + 1] === "i") ? "ê" : v);
      }
      k++;
    }
  }
  const s2 = seq.filter((v, i) => i === 0 || v !== seq[i - 1]);
  const tips: [string, string][] = [];
  if (ini) tips.push(["Phụ âm " + ini, INI_TIP[ini] || ""]);
  const uniq = names.filter((v, i) => names.indexOf(v) === i);
  if (uniq.length)
    tips.push([
      "Vần " + (fin0 || base),
      uniq
        .map((v) => V_DESC[v])
        .filter(Boolean)
        .join(", rồi ") + ".",
    ]);
  return { seq: s2.length ? s2 : ["rest"], tips };
}

/** Apply pose `p` to the mouth SVG (ids: mOuter/mInner/mInnerC/mTeeth/mTongue/mBite). */
export function mouthDraw(svg: SVGSVGElement | null, p: MouthPose): void {
  if (!svg) return;
  const q = (id: string) => svg.querySelector(id);
  const cx = 120,
    cy = 112,
    hw = 40 + 20 * p.w - 20 * p.r,
    gap = Math.max(1, 2 + 46 * p.o),
    lip = 10 - 2 * p.r,
    up = cy - gap / 2,
    dn = cy + gap / 2;
  const ox = hw + 5,
    oy1 = up - lip,
    oy2 = dn + lip + 2,
    k = 0.55 + 0.4 * p.r;
  const outer = `M${cx - ox},${cy} C${cx - ox * k},${oy1 - 3} ${cx - ox * 0.3},${oy1} ${cx},${oy1 + 3.5 * (1 - p.r)} C${cx + ox * 0.3},${oy1} ${cx + ox * k},${oy1 - 3} ${cx + ox},${cy} C${cx + ox * k},${oy2 + 3} ${cx - ox * k},${oy2 + 3} ${cx - ox},${cy}Z`;
  const ix = hw * (0.84 - 0.22 * p.r),
    ik = 0.55 + 0.4 * p.r;
  const inner = `M${cx - ix},${cy} C${cx - ix * ik},${up - 1} ${cx + ix * ik},${up - 1} ${cx + ix},${cy} C${cx + ix * ik},${dn + 1} ${cx - ix * ik},${dn + 1} ${cx - ix},${cy}Z`;
  q("#mOuter")?.setAttribute("d", outer);
  q("#mInner")?.setAttribute("d", inner);
  q("#mInnerC")?.setAttribute("d", inner);
  const th = Math.min(10, gap * 0.35 + 2),
    T = q("#mTeeth");
  T?.setAttribute("x", String(cx - ix * 0.68));
  T?.setAttribute("y", String(up - 2));
  T?.setAttribute("width", String(ix * 1.36));
  T?.setAttribute("height", String(th));
  T?.setAttribute("opacity", String(Math.max(0, 1 - p.r * 0.9)));
  const ry = 6 + gap * 0.16,
    tg = q("#mTongue");
  tg?.setAttribute("cx", String(cx));
  tg?.setAttribute("rx", String(ix * 0.62));
  tg?.setAttribute("ry", String(ry));
  tg?.setAttribute("cy", String(dn - ry * 0.45 - p.t * Math.max(0, gap - ry - 4)));
  const B = q("#mBite");
  B?.setAttribute("x", String(cx - hw * 0.55));
  B?.setAttribute("y", String(cy - 5));
  B?.setAttribute("width", String(hw * 1.1));
  B?.setAttribute("height", "8");
  B?.setAttribute("opacity", String(p.f));
}

const mix = (a: MouthPose, b: MouthPose, t: number): MouthPose => {
  const o = {} as MouthPose;
  (Object.keys(a) as (keyof MouthPose)[]).forEach((k) => {
    o[k] = a[k] + (b[k] - a[k]) * t;
  });
  return o;
};

let mouthAnim = 0;

/** Cancel the running mouth animation (dialog close / new chain). */
export function stopMouth(): void {
  cancelAnimationFrame(mouthAnim);
}

/** Animate the mouth through the plan's pose sequence (rest → seq → rest). */
export function animateMouth(
  svg: SVGSVGElement | null,
  plan: SylPlan,
  ms: number,
  onDone?: () => void,
): void {
  cancelAnimationFrame(mouthAnim);
  const keys = ["rest", ...plan.seq, "rest"].map((v) => MV[v] || MV.rest),
    n = keys.length - 1,
    t0 = performance.now();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const step = (now: number) => {
    const u = Math.min(1, (now - t0) / ms),
      x = u * n,
      i = Math.min(n - 1, Math.floor(x)),
      f = reduce ? Math.round(x - i) : x - i,
      e = f < 0.5 ? 2 * f * f : 1 - 2 * (1 - f) * (1 - f);
    mouthDraw(svg, mix(keys[i], keys[i + 1], e));
    if (u < 1) mouthAnim = requestAnimationFrame(step);
    else if (onDone) onDone();
  };
  mouthAnim = requestAnimationFrame(step);
}
