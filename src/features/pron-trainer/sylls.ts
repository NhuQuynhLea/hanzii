/**
 * Pinyin syllable analysis + per-word trainer model
 * (scene-pron.js TRAINER_TPL: TM/sylls/POSE_OF/INI_TIP/FIN_TIP/TONE_TIP/
 * CMP_OF/TITLE/GROUPS/LIPTIP/build).
 * Vietnamese tips contain inline <b>/<em> markup — render with
 * dangerouslySetInnerHTML like the original innerHTML writes.
 */
import type { Word } from "@/types/lesson";

/** Toned vowel → [base vowel, tone]. */
const TM: Record<string, [string, number]> = {
  ā: ["a", 1], á: ["a", 2], ǎ: ["a", 3], à: ["a", 4],
  ē: ["e", 1], é: ["e", 2], ě: ["e", 3], è: ["e", 4],
  ī: ["i", 1], í: ["i", 2], ǐ: ["i", 3], ì: ["i", 4],
  ō: ["o", 1], ó: ["o", 2], ǒ: ["o", 3], ò: ["o", 4],
  ū: ["u", 1], ú: ["u", 2], ǔ: ["u", 3], ù: ["u", 4],
  ǖ: ["ü", 1], ǘ: ["ü", 2], ǚ: ["ü", 3], ǜ: ["ü", 4],
};

export interface Syl {
  /** base syllable without tone marks */
  s: string;
  /** tone 1–5 (5 = neutral) */
  t: number;
  /** initial consonant ("" for vowel start) */
  ini: string;
  /** final (rest of the syllable) */
  fin: string;
}

/** Greedy syllable segmenter used by the trainer (different from lib pySplit). */
export function sylls(py: string): Syl[] {
  const out: Syl[] = [];
  py
    .toLowerCase()
    .replace(/[^a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü' ]/g, " ")
    .split(/[\s']+/)
    .filter(Boolean)
    .forEach((ch) => {
      let base = "";
      const tones: [number, number][] = [];
      for (const c of ch) {
        if (TM[c]) {
          base += TM[c][0];
          tones.push([base.length - 1, TM[c][1]]);
        } else base += c;
      }
      const re = /^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?[aeiouüv]+(ng|n|r)?/;
      let i = 0;
      while (i < base.length) {
        const m = base.slice(i).match(re);
        if (!m) {
          i++;
          continue;
        }
        let s = m[0];
        const nx = base[i + s.length];
        if (nx && /[aeiouü]/.test(nx)) {
          if (s.endsWith("ng")) s = s.slice(0, -1);
          else if (s.endsWith("n") && s.length > 1) s = s.slice(0, -1);
        }
        if (s.endsWith("r") && s.length > 2 && nx && /[aeiouü]/.test(nx)) s = s.slice(0, -1);
        const t = (tones.find(([p]) => p >= i && p < i + s.length) || [0, 5])[1];
        const ini = (s.match(/^(zh|ch|sh|[bpmfdtnlgkhjqxrzcs])/) || [""])[0];
        out.push({ s, t, ini, fin: s.slice(ini.length) });
        i += s.length;
      }
    });
  return out;
}

/* ======== DỮ LIỆU ÂM ======== */
export type PoseKey =
  | "rest" | "sh" | "zh" | "ch" | "r" | "s" | "z" | "q" | "h" | "hv" | "l" | "lab" | "f";

export const POSE_OF: Record<string, PoseKey> = {
  b: "lab", p: "lab", m: "lab", f: "f", d: "l", t: "l", n: "l", l: "l",
  g: "h", k: "h", h: "h", j: "q", q: "q", x: "q",
  zh: "zh", ch: "ch", sh: "sh", r: "r", z: "z", c: "z", s: "s", "": "rest",
};

export const INI_TIP: Record<string, string> = {
  b: "<b>b</b> đọc gần “p” tiếng Việt nhưng nhẹ, không bật hơi.",
  p: "<b>p</b> bật hơi mạnh: đặt tay trước miệng sẽ thấy luồng hơi.",
  m: "<b>m</b> giống “m” tiếng Việt.",
  f: "<b>f</b> răng trên chạm nhẹ môi dưới, giống “ph”.",
  d: "<b>d</b> đọc gần “t” tiếng Việt, không bật hơi (không phải “d” hay “đ”).",
  t: "<b>t</b> bật hơi mạnh, gần “th” tiếng Việt.",
  n: "<b>n</b> giống “n” tiếng Việt, hơi ra mũi.",
  l: "<b>l</b> đầu lưỡi chạm lợi trên, giống “l” tiếng Việt.",
  g: "<b>g</b> đọc gần “c/k” tiếng Việt, không bật hơi.",
  k: "<b>k</b> bật hơi mạnh, gần “kh” bật mạnh.",
  h: "<b>h</b> gần “kh” tiếng Việt (nhẹ hơn), hơi cọ ở cuống lưỡi, không phải “h” thoát từ họng.",
  j: "<b>j</b> gần “ch” tiếng Việt, đầu lưỡi tì răng dưới, không bật hơi.",
  q: "<b>q</b> như j nhưng bật hơi mạnh.",
  x: "<b>x</b> mặt lưỡi nâng gần vòm, hơi cọ nhẹ, đầu lưỡi tì răng dưới.",
  zh: "<b>zh</b> gần “tr” tiếng Việt nhưng cong lưỡi hơn, không bật hơi.",
  ch: "<b>ch</b> như zh nhưng bật hơi mạnh.",
  sh: "<b>sh</b> cong lưỡi, giống “s” giọng miền Nam như “sương”.",
  r: "<b>r</b> cong lưỡi gần như sh nhưng không chạm vòm, dây thanh rung; không rung đầu lưỡi.",
  z: "<b>z</b> đầu lưỡi thẳng chạm sau răng trên, gần “ts” nhẹ, không bật hơi.",
  c: "<b>c</b> như z nhưng bật hơi mạnh (“tsh”).",
  s: "<b>s</b> lưỡi thẳng, giống “x” tiếng Việt như “xa”.",
  "": "Bắt đầu bằng nguyên âm: mở miệng tự nhiên, không chặn hơi.",
};

export const FIN_TIP: [RegExp, string][] = [
  [/ü|^u$/, "<b>ü</b>: nói “i” rồi giữ lưỡi, tròn môi như “u”. Sau j, q, x, y thì u viết là ü."],
  [/ng$/, "<b>-ng</b> cuối: cuống lưỡi nâng lên, như “-ng” trong “ông”."],
  [/[^n]n$|^n$|an$|en$|in$|un$/, "<b>-n</b> cuối: đầu lưỡi chạm lợi trên, như “-n” trong “an”."],
  [/^e$|^en|^eng/, "<b>e</b> đọc như “ơ” hơi lùi về sau."],
  [/^r$/, "<b>-r</b> (儿化): cong lưỡi ở cuối âm."],
];

export const TONE_TIP: Record<number, string> = {
  1: "<b>Thanh 1</b>: cao và đều như hát một nốt.",
  2: "<b>Thanh 2</b>: đi lên như khi hỏi lại “Hả?”, gần thanh sắc nhưng dài hơn.",
  3: "<b>Thanh 3</b>: xuống thấp rồi lên lại, gần thanh hỏi. Đứng trước thanh khác thì chỉ cần xuống thấp.",
  4: "<b>Thanh 4</b>: rơi dứt khoát từ cao xuống, như ra lệnh “Đi!”, không cụt như thanh nặng.",
  5: "<b>Thanh nhẹ</b>: ngắn và nhẹ, không cần lên xuống.",
};

/** Âm hay bị nhầm với âm đầu này ("hv" = h kiểu Việt, thoát họng). */
const CMP_OF: Record<string, string> = {
  b: "p", p: "b", d: "t", t: "d", g: "k", k: "g",
  zh: "z", z: "zh", ch: "c", c: "ch", sh: "s", s: "sh",
  r: "l", l: "r", n: "l", j: "zh", q: "ch", x: "s", h: "hv",
};

export const TITLE: Record<string, string> = {
  lab: "môi mím lại rồi bật ra",
  f: "răng trên chạm môi dưới",
  l: "đầu lưỡi chạm lợi trên",
  h: "cuống lưỡi nâng lên",
  q: "mặt lưỡi chạm vòm cứng",
  zh: "cong lưỡi, chạm vòm rồi bật ra",
  ch: "cong lưỡi, bật hơi mạnh",
  sh: "cong đầu lưỡi lên",
  r: "cong lưỡi, không chạm vòm",
  z: "lưỡi thẳng, chạm sau răng trên",
  s: "lưỡi thẳng, tì sau răng dưới",
  rest: "lưỡi thả lỏng, mở miệng",
  hv: "hơi ra thẳng từ họng",
};

export interface CmpInfo {
  ini: string;
  pose: PoseKey;
  zh: string | null;
  py: string;
  /** HTML: "<b>x</b> trong 字 py" hoặc "<b>h</b> kiểu tiếng Việt" */
  label: string;
  /** HTML: "<em>x</em>: …" */
  title: string;
}

export interface BuiltWord {
  zh: string;
  py: string;
  vi: string;
  S: Syl[];
  pose: PoseKey;
  ini: string;
  /** HTML title: "<em>ini</em>: …" */
  title: string;
  /** HTML tips */
  tips: string[];
  cmp: CmpInfo | null;
  /** [zh, py, lý do dễ nhầm] */
  quiz: [string, string, string][];
}

/** build(w) — word analysis for the trainer panels. VOCAB = level word list. */
export function buildWord(w: Word, vocab: Word[]): BuiltWord {
  const [zh, py, vi] = w;
  const S = sylls(py);
  const main = S.find((x) => x.ini) || S[0] || { ini: "", fin: "", t: 5, s: "" };
  const tips = [INI_TIP[main.ini] || INI_TIP[""]];
  const ft = FIN_TIP.find(([re]) => re.test(main.fin));
  if (ft) tips.push(ft[1]);
  [...new Set(S.map((x) => x.t))].forEach((t) => tips.push(TONE_TIP[t]));
  if (S.some((x, i) => x.t === 3 && S[i + 1] && S[i + 1].t === 3))
    tips.push("<b>Hai thanh 3 liền nhau</b>: thanh 3 đứng trước đọc thành thanh 2.");
  const cI = CMP_OF[main.ini];
  let cmp: CmpInfo | null = null;
  if (cI) {
    const ex =
      cI === "hv"
        ? null
        : vocab.find((v) => {
            const s = sylls(v[1])[0];
            return s && s.ini === cI;
          }) || null;
    cmp = {
      ini: cI,
      pose: cI === "hv" ? "hv" : POSE_OF[cI],
      zh: ex ? ex[0] : null,
      py: ex ? ex[1] : "",
      label:
        cI === "hv"
          ? "<b>h</b> kiểu tiếng Việt"
          : `<b>${cI}</b>${ex ? ` trong ${ex[0]} ${ex[1]}` : ""}`,
      title: `<em>${cI === "hv" ? "h" : cI}</em>: ${TITLE[cI === "hv" ? "hv" : POSE_OF[cI]]}`,
    };
  }
  const base = (x: Word) => sylls(x[1]).map((s) => s.s).join("");
  const meBase = base(w);
  const sim = vocab
    .filter((v) => v[0] !== zh)
    .map((v) => {
      const b = base(v);
      let sc = 0;
      if (b === meBase) sc += 10;
      if (sylls(v[1]).length === S.length) sc += 3;
      const s0 = sylls(v[1])[0] || ({} as Syl);
      if (s0.ini === main.ini) sc += 2;
      if (s0.fin === main.fin) sc += 2;
      if (CMP_OF[main.ini] && s0.ini === CMP_OF[main.ini]) sc += 3;
      return [sc + Math.random(), v] as [number, Word];
    })
    .sort((a, b) => b[0] - a[0])
    .slice(0, 3)
    .map((x) => x[1]);
  const why = (v: Word): string => {
    const a = sylls(v[1]),
      b = S;
    if (a.map((s) => s.s).join("") === b.map((s) => s.s).join("")) return "khác ở thanh điệu";
    if (a[0] && b[0] && a[0].ini !== b[0].ini)
      return `âm đầu ${a[0].ini || "nguyên âm"} khác ${b[0].ini || "nguyên âm"}`;
    return "khác vần";
  };
  return {
    zh,
    py,
    vi,
    S,
    pose: POSE_OF[main.ini] || "rest",
    ini: main.ini,
    title: `<em>${main.ini || "nguyên âm"}</em>: ${TITLE[POSE_OF[main.ini] || "rest"]}`,
    tips,
    cmp,
    quiz: [[zh, py, "đúng từ cần nghe"], ...sim.map((v) => [v[0], v[1], why(v)] as [string, string, string])],
  };
}

/* ======== GƯƠNG SOI KHẨU HÌNH — nhóm âm ======== */
export const GROUPS: [string, PoseKey, string[]][] = [
  ["b p m", "lab", ["b", "p", "m"]],
  ["f", "f", ["f"]],
  ["d t n l", "l", ["d", "t", "n", "l"]],
  ["g k h", "h", ["g", "k", "h"]],
  ["j q x", "q", ["j", "q", "x"]],
  ["zh ch sh r", "sh", ["zh", "ch", "sh", "r"]],
  ["z c s", "s", ["z", "c", "s"]],
  ["Nguyên âm, ü", "rest", [""]],
];

export const LIPTIP: Record<string, string> = {
  lab: "Nhìn gương: hai môi phải khép kín rồi mới bật ra.",
  f: "Nhìn gương: răng trên chạm môi dưới, thấy rõ răng trên.",
  l: "Nhìn gương: miệng hé, đầu lưỡi chạm phía sau răng trên.",
  h: "Nhìn gương: miệng mở vừa, môi không tròn.",
  q: "Nhìn gương: môi dẹt sang hai bên (với ü thì tròn môi).",
  sh: "Nhìn gương: môi hơi chu ra phía trước, răng gần khép.",
  s: "Nhìn gương: môi dẹt, răng gần khép, thấy khe răng.",
  rest: "Nhìn gương: a mở to, i môi dẹt, u và ü tròn môi chu ra.",
};

export const TONE_TITLE = [
  "",
  "Thanh 1: cao và đều",
  "Thanh 2: từ giữa đi lên cao",
  "Thanh 3: xuống thấp rồi lên lại",
  "Thanh 4: từ cao rơi xuống thấp",
  "Thanh nhẹ: ngắn và nhẹ",
];
