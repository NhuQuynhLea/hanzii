/**
 * GT library floor — static data + pure helpers (gt/lib.js + small shared
 * helpers it borrowed from gt/duo.js `duoDict`/`duoTok` and gt/gm.js gates).
 */
import { GT_LESSONS, GT_STAGES, GT_TITLES, gtLabel } from "@/data/gt-data";
import { useGt } from "@/stores/gt";
import { usePlayer, ledger } from "@/stores/player";
import { toast } from "@/stores/ui";
import { ls } from "@/lib/storage";
import { permActive } from "@/services/entitlement";
import type { GtDialogLine, GtDialogScene, GtLesson } from "@/types/gt";
import type { Word } from "@/types/lesson";

export const LIB_SHELF = ["🗂 Từ của tôi", "📚 Giáo trình", "⬇ Tài liệu"];
export const LIB_TABLE = ["❌ Ôn từ hay sai", "🎧 Nghe hội thoại", "🎵 Luyện thanh điệu", "✍ Tập viết"];

export const LIB_DOCS: {
  book: [string, string, string, string][];
  free: [string, string, string, string][];
  web: [string, string, string][];
} = {
  book: [
    ["Quyển 1", "入门篇（上）", "Bài 1–15 – PDF 17 MB", "~VHd0MERGNDFyaWYxbjJWZGRGcFFJUFpVNV9uaDFVQVAx"],
    ["Quyển 2", "入门篇（下）", "Bài 16–30 – PDF 100 MB", "~clFJUy1meEtfcWYxTHRYbGpVcDdsaTNxUExubTNUbGkx"],
    ["Quyển 3", "基础篇（上）", "Cơ sở, phần 1 – PDF 66 MB", "~elR0ZXNYNmdobFZoM1V4UUc3bllueUs5ODk5OUphSHgx"],
    ["Quyển 4", "基础篇（下）", "Cơ sở, phần 2 – PDF 79 MB", "~Vlo3ZDBaRjNQOG1WcUtRN2RvOHZVVnplYTdxRUwxQWwx"],
  ],
  free: [
    ["Sổ tay NowHanzi – Nhập môn 1 (Bài 1–5)", "Từ mới, mẫu câu, hội thoại mẫu – 16 trang", "files/nowhanzi-so-tay-nhap-mon-1.pdf", "NowHanzi-So-tay-Nhap-mon-1.pdf"],
    ["Bảng pinyin & thanh điệu", "Phụ âm, vần, 4 thanh, 3 quy tắc đổi thanh – 1–2 trang", "files/nowhanzi-bang-pinyin.pdf", "NowHanzi-Bang-pinyin.pdf"],
  ],
  web: [
    ["Chinese Grammar Wiki", "Tra ngữ pháp theo trình độ A1–C1 (tiếng Anh), miễn phí", "https://resources.allsetlearning.com/chinese/grammar/"],
    ["Wikibooks – Chinese (Mandarin)", "Giáo trình mở, đọc online hoặc tải PDF (tiếng Anh)", "https://en.wikibooks.org/wiki/Chinese_(Mandarin)"],
  ],
};

/* ---------- exercise spec handed to duoRun (owned by the duo feature) ---------- */
export interface DuoEx {
  t: string;
  w?: Word;
  pairs?: Word[];
  d?: GtDialogScene;
  l?: GtDialogLine;
  lines?: GtDialogLine[];
  tones?: GtLesson["tones"];
}

export interface DuoSpec {
  n: number;
  b: number;
  L: GtLesson | null;
  W: Word[];
  ex: DuoEx[];
  review?: string;
  rvTitle?: string;
}

/** End-of-review-session info (original read the global `duo`). */
export interface LibEndInfo {
  t0?: number;
  sec?: number;
  total?: number;
  wrong?: number;
  review?: string;
  rvTitle?: string;
}

/* ---------- gt/duo.js helpers lib.js used (pure GT_LESSONS lookups) ---------- */
let DICT: Map<string, [string, string]> | null = null;

/** duo.js `duoDict`: zh → [pinyin, nghĩa] across every GT lesson. */
export function gtDict(): Map<string, [string, string]> {
  if (DICT) return DICT;
  const m = new Map<string, [string, string]>();
  Object.values(GT_LESSONS).forEach((L) =>
    ((L as GtLesson & { wordsAll?: Word[] }).wordsAll || L.words).forEach(([z, p, v]) => {
      if (!m.has(z)) m.set(z, [p, v]);
    }),
  );
  DICT = m;
  return m;
}

/** duo.js `duoTok`: greedy longest-match tokeniser over the GT dictionary. */
export function gtTok(zh: string): string[] {
  const d = gtDict(),
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

/* ---------- tone variants (lib.js LIB_TM / libToneVars) ---------- */
export const LIB_TM: Record<string, string> = { a: "āáǎà", e: "ēéěè", i: "īíǐì", o: "ōóǒò", u: "ūúǔù", ü: "ǖǘǚǜ" };

/** All 4 tone variants of a pinyin string (first marked vowel). */
export function libToneVars(py: string): string[] | null {
  for (let i = 0; i < py.length; i++)
    for (const b in LIB_TM) {
      if (LIB_TM[b].includes(py[i])) return [0, 1, 2, 3].map((k) => py.slice(0, i) + LIB_TM[b][k] + py.slice(i + 1));
    }
  return null;
}

/* ---------- unlock/star helpers (gt-core.js + gm.js gates, verbatim) ---------- */
const GT_FREE = 5;
const GT_NEED = 2;
const GT_GATES = [5, 10, 15, 20, 25, 30, 35, 42, 47, 52, 55];

const gmGateOf = (i: number) => GT_GATES.includes(i);
const gmGateRange = (g: number): [number, number] => {
  const k = GT_GATES.indexOf(g);
  return [k ? GT_GATES[k - 1] + 1 : 1, g];
};
const gmGateBig = (g: number) => [15, 30, 42, 55].includes(g);
function gmGateName(g: number): string {
  const big = gmGateBig(g),
    [a, b] = gmGateRange(g);
  return big
    ? `Đại chiến cuối quyển ${GT_STAGES.find((s) => g >= s.from && g <= s.to)!.name}`
    : `Trận đấu ${gtLabel(a).split(" – ")[0]} ${a > 30 ? a - 30 : a}–${b > 30 ? b - 30 : b}`;
}
const gmGates = (): Record<string, string> => {
  try {
    return JSON.parse(ls.get("nh:gates") || "{}");
  } catch {
    return {};
  }
};
const gmGatePassed = (g: number) => !!gmGates()[g];

export function gtStars(n: number): number {
  const L = GT_LESSONS[n],
    s = useGt.getState().state;
  if (!L) return 0;
  const q = (s.quiz && s.quiz[n]) || {},
    qOk = Object.values(q).filter(Boolean).length,
    qNeed = Math.ceil(L.quiz.length * 0.8);
  const led = ledger(),
    sayDone = L.say.filter(([zh]) => Object.keys(led).some((k) => k.startsWith("say:" + zh + ":"))).length,
    sayNeed = Math.min(3, L.say.length);
  const lis = !!(s.listen && s.listen[n]);
  const parts = [!!s.done[n], qOk >= qNeed, sayDone >= sayNeed || lis];
  return parts.filter(Boolean).length;
}

export const gtStarTxt = (k: number): string => "★".repeat(k) + "☆".repeat(3 - k);

const gtAllPaid = () => {
  try {
    return permActive();
  } catch {
    return false;
  }
};

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
    return gtAllPaid() ? "Bạn đã mở khoá toàn bộ – bài này ra mắt 30/11." : "🔒 Ra mắt ngày 30/11 (hoặc trả 69.000đ để mở khoá toàn bộ).";
  if (!GT_LESSONS[i] && gtAllPaid()) return "Bạn đã mở khoá toàn bộ – bài này sẽ hiện ngay khi có.";
  if (!GT_LESSONS[i]) return GT_TITLES[i - 1] ? `🔒 Học xong ${gtLabel(i - 1)} và tích đủ ${GT_NEED}★ để mở.` : "🔒 Học các bài trước để mở.";
  if (gmGateOf(i - 1) && !gmGatePassed(i - 1)) return `🔒 Cần thắng ⚔ ${gmGateName(i - 1)}.`;
  return `🔒 Cần ${GT_NEED}★ ở ${gtLabel(i - 1)} để mở.`;
}

/* ---------- docs ---------- */

/** lib.js `libU`: decode "~"-prefixed reversed-base64 Drive ids. */
export function libU(u: string): string {
  if (u[0] !== "~") return u;
  try {
    return "https://drive.google.com/file/d/" + atob(u.slice(1)).split("").reverse().join("") + "/view";
  } catch {
    return "#";
  }
}

interface ClaudeDownloads {
  save(o: { filename: string; data: Blob }): Promise<void>;
}

/** lib.js `libDownload`: fetch + save PDF, award points once per file. */
export async function libDownload(path: string, fn: string, title: string): Promise<void> {
  let dl: ClaudeDownloads | null = null;
  try {
    const w = window as unknown as { claude?: { use?: (n: string) => Promise<ClaudeDownloads | null> } };
    dl = w.claude && w.claude.use ? await w.claude.use("downloads") : null;
  } catch {
    /* noop */
  }
  try {
    toast("Đang chuẩn bị file…");
    const res = await fetch(path);
    if (!res.ok) throw 0;
    const blob = await res.blob();
    if (!blob.size || !(await blob.slice(0, 5).text()).startsWith("%PDF")) throw 0;
    if (dl) {
      await dl.save({ filename: fn, data: blob });
      toast("Đã tải: " + title);
    } else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fn;
      a.click();
    }
    usePlayer.getState().award(`dl:${fn}`, 2, "tải tài liệu thư viện");
  } catch (e) {
    if (e && (e as { code?: string }).code === "declined") return;
    toast("Chưa tải được file. Thử lại sau nhé.");
  }
}
