/**
 * Review flows (lib.js): libWords/libReview/libLessons/libScene/libTones/
 * libWrite/libTable + the library enter toast.
 * The actual exercise session UI is owned by the duo feature — these only
 * build the exercise list and hand it over via callHook("duoRun", D, title).
 */
import { GT_LESSONS, gtLabel } from "@/data/gt-data";
import { me } from "@/game/engine/state";
import { useGt } from "@/stores/gt";
import { useWm } from "@/stores/wm";
import { useUi, toast } from "@/stores/ui";
import { callHook } from "@/services/hooks";
import { shuffle } from "@/lib/helpers";
import type { Word } from "@/types/lesson";
import { gtDict, gtTok, libToneVars, gtUnlocked, type DuoEx, type DuoSpec } from "./data";

/** lib.js `duoRun` — delegated to the duo feature (features/gt/duo). */
export function duoRun(D: DuoSpec, title: string, sub?: string): void {
  callHook("duoRun", D, title, sub);
}

/** lib.js `libWords`: hanzi list → [zh, py, vi] rows that exist in the dictionary. */
export function libWords(zs: string[]): Word[] {
  const d = gtDict();
  return zs.map((z) => [z, ...(d.get(z) || [])] as Word).filter((w) => w[1]);
}

/** lib.js `libReview`: quick word-review session (max 6 words). */
export function libReview(zs: string[], title: string, kind?: string): void {
  const W = libWords(zs);
  if (!W.length) {
    toast("Chưa có từ để ôn ở ngăn này.");
    return;
  }
  const pick = shuffle(W.slice()).slice(0, 6),
    ex: DuoEx[] = pick.map((w, i) => ({ t: i % 2 ? "listen" : "mean", w }));
  if (pick.length >= 3) ex.splice(3, 0, { t: "match", pairs: shuffle(pick.slice()).slice(0, 4) });
  duoRun({ n: 0, b: 0, L: null, W: pick, ex, review: kind || "word", rvTitle: title }, `Ôn – ${title}`);
}

/** lib.js `libLessons`: lessons the learner may review (unlocked or done). */
export function libLessons(): number[] {
  const s = useGt.getState().state;
  return Object.keys(GT_LESSONS)
    .map(Number)
    .filter((n) => unlocked(n) || s.done[n]);
}

/** Prefer the canonical hook once the gt-core port registers it; else local copy. */
export function unlocked(i: number): boolean {
  return callHook<boolean>("gtUnlocked", i) ?? gtUnlocked(i);
}

/** lib.js `libScene`: pick a seen dialogue and build listen/translate/tiles rounds. */
export function libScene(): void {
  const ns = libLessons(),
    s = useGt.getState().state;
  const pool = ns.flatMap((n) =>
    GT_LESSONS[n].dialog.map((d, i) => ({
      n,
      d,
      i,
      seen: !!(s.seen[n] && Object.keys(s.seen[n]).some((k) => k.endsWith("@" + (i + 1)))),
    })),
  );
  const P = pool.filter((x) => x.seen).length ? pool.filter((x) => x.seen) : pool;
  if (!P.length) {
    toast("Chưa có hội thoại để nghe.");
    return;
  }
  const x = P[Math.floor(Math.random() * P.length)],
    lines = x.d.lines;
  const ex: DuoEx[] = [
    { t: "scene", d: x.d },
    ...shuffle(lines.slice())
      .slice(0, 2)
      .map((l) => ({ t: "trans", l, lines })),
  ];
  const sh = lines.find((l) => {
    const t = gtTok(l[2]);
    return t.length >= 2 && t.length <= 5;
  });
  if (sh) ex.push({ t: "tiles", l: sh });
  duoRun({ n: 0, b: 0, L: null, W: GT_LESSONS[x.n].words, ex, review: "scene", rvTitle: "Nghe hội thoại" }, `Nghe hội thoại – ${gtLabel(x.n)}`);
}

/** lib.js `libTones`: tone-drill session over one/two-char words with tone variants. */
export function libTones(): void {
  const ns = libLessons();
  const W = ns.flatMap((n) => GT_LESSONS[n].words).filter((w) => !/\s/.test(w[1]) && libToneVars(w[1]) && w[0].length <= 2);
  if (!W.length) {
    toast("Chưa có từ để luyện thanh.");
    return;
  }
  const ex: DuoEx[] = [];
  const T = GT_LESSONS[1] && GT_LESSONS[1].tones;
  if (T) ex.push({ t: "toneq", tones: T });
  shuffle(W.slice())
    .slice(0, 6)
    .forEach((w) => ex.push({ t: "tonew", w }));
  duoRun({ n: 0, b: 0, L: null, W, ex, review: "tone", rvTitle: "Luyện thanh điệu" }, "Luyện thanh điệu");
}

/**
 * lib.js `libWrite`: close the room, open the lesson list, then jump to the
 * "write" step of the current lesson. The GT lesson panel is owned by the
 * class/lesson feature — it exposes `openGTLesson(n, step)` (renderGTLesson
 * with gtCur=n, gtStep="write" in the original).
 */
export function libWrite(): void {
  const n = callHook<number>("gtClassLesson", me.cl || 1) || 1;
  useUi.getState().closeRoom();
  setTimeout(() => {
    callHook("openLesson");
    setTimeout(() => callHook("openGTLesson", n, "write"), 60);
  }, 30);
}

/** lib.js `libTable`: reading-table actions, index into LIB_TABLE. */
export function libTable(i: number): void {
  if (i === 0) {
    const B = useWm.getState().buckets();
    return B.sai.length ? libReview(B.sai, "Từ hay sai", "sai") : libReview([...B.moi, ...B.nho], "Từ đang nhớ", "nho");
  }
  if (i === 1) return libScene();
  if (i === 2) return libTones();
  return libWrite();
}

/** scene-lib.js `enterRoomScene` toast for the GT library (hook "thuToast"). */
export function thuToast(): string {
  try {
    const B = useWm.getState().buckets();
    return B.sai.length
      ? `Đã vào thư viện. Bạn có ${B.sai.length} từ hay sai, ghé bàn “Ôn từ hay sai” 2 phút nhé!`
      : "Đã vào thư viện. Kệ: Từ của tôi – Giáo trình – Tài liệu. Bàn đọc là các trò ôn 1–2 phút.";
  } catch {
    return "Đã vào thư viện.";
  }
}
