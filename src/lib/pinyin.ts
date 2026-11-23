/** Pinyin syllable splitting & tone helpers (td.js tail, games.js, tts.js). */

export const PY_INI = /^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?/;
export const PY_SYL =
  /^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?(iang|iong|uang|ueng|ian|iao|ing|ong|uai|uan|üan|ang|eng|ai|ao|an|ei|en|er|ia|ie|in|iu|ou|ua|uo|ui|un|ün|üe|ue|a|o|e|i|u|ü)r?$/;

const TONE_MARKS = /[̄́̌̀]/g;

/** Remove tone marks from a pinyin string. */
export function pyPlain(ch: string): string {
  return ch
    .normalize("NFD")
    .replace(TONE_MARKS, "")
    .normalize("NFC");
}

/** Tone number of a marked pinyin syllable: 1–4, 0 = neutral. */
export function toneOf(py: string): number {
  const n = py.normalize("NFD");
  return /̄/.test(n)
    ? 1
    : /́/.test(n)
      ? 2
      : /̌/.test(n)
        ? 3
        : /̀/.test(n)
          ? 4
          : 0;
}

export function baseOf(py: string): string {
  return py
    .normalize("NFD")
    .replace(TONE_MARKS, "")
    .normalize("NFC");
}

/** Apply tone mark `t` (1–4) to the correct vowel of a base syllable. */
export function markTone(base: string, t: number): string {
  const M = ["", "̄", "́", "̌", "̀"];
  const s = base.normalize("NFD");
  const low = s.toLowerCase();
  let idx = -1;
  if (low.includes("a")) idx = low.indexOf("a");
  else if (low.includes("e")) idx = low.indexOf("e");
  else if (low.includes("ou")) idx = low.indexOf("o");
  else
    for (let i = low.length - 1; i >= 0; i--)
      if ("aeiou".includes(low[i])) {
        idx = i;
        break;
      }
  if (idx < 0) return base;
  let pos = idx + 1;
  if (s[pos] === "̈") pos++;
  return (s.slice(0, pos) + M[t] + s.slice(pos)).normalize("NFC");
}

export interface PySyllable {
  /** original (marked) text of this syllable */
  show: string;
  /** plain base (no tone marks, v->ü) */
  base: string;
  /** tone 0–4 */
  tone: number;
}

/** Split a pinyin string into syllables, keeping tone marks (DFS segmenter). */
export function pySplit(py: string, want?: number): PySyllable[] {
  const parts = py
    .trim()
    .split(/[\s'’]+/)
    .filter(Boolean);
  const out: PySyllable[] = [];
  for (const part of parts) {
    const raw = [...part];
    const low = raw
      .map((c) => pyPlain(c).toLowerCase().replace("v", "ü"))
      .join("");
    const memo = new Map<string, number[][] | null>();
    const dfs = (i: number, left: number): number[][] | null => {
      const key = i + "," + left;
      if (memo.has(key)) return memo.get(key)!;
      let res: number[][] | null = null;
      if (i === low.length) res = left === 0 || left < 0 ? [] : null;
      else
        for (let L = Math.min(7, low.length - i); L >= 1 && !res; L--) {
          const s = low.slice(i, i + L);
          if (!PY_SYL.test(s)) continue;
          const rest = dfs(i + L, left - 1);
          if (rest) res = [[i, i + L], ...rest];
        }
      memo.set(key, res);
      return res;
    };
    let segs: number[][] | null = null;
    const need = want && parts.length === 1 ? want : null;
    if (need) segs = dfs(0, need);
    if (!segs) segs = dfs(0, -99);
    if (!segs) segs = [[0, low.length]];
    segs.forEach(([a, b]) =>
      out.push({
        show: raw.slice(a, b).join(""),
        base: low.slice(a, b),
        tone: toneOf(raw.slice(a, b).join("")),
      }),
    );
  }
  return out;
}

/** Tone exemplar data for the tone cards (tts.js `TONES`). */
export const TONES: [string, string, string, string, string][] = [
  ["妈", "mā", "mẹ", "Thanh 1: cao, đều", "M4 10 L96 10"],
  ["麻", "má", "cây gai", "Thanh 2: đi lên", "M4 34 L96 6"],
  ["马", "mǎ", "con ngựa", "Thanh 3: xuống rồi lên", "M4 20 Q40 44 60 34 T96 8"],
  ["骂", "mà", "mắng", "Thanh 4: rơi mạnh", "M4 6 L96 38"],
];
