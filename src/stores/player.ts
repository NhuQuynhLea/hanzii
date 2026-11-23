import { create } from "zustand";
import type { PlayerState } from "@/types/player";
import { ls } from "@/lib/storage";
import { dstr } from "@/lib/helpers";
import { callHook, emitHook } from "@/services/hooks";
import { useUi } from "./ui";
import { GT_ONLY } from "@/game/world/geometry";
import { unlocked } from "@/lib/curriculum";
import { COLORS } from "@/types/player";
import { me as engineMe } from "@/game/engine/state";

export { COLORS };

export interface Stats {
  days: string[];
  ai: number;
  read: string[];
  greet: number;
  classes: string[];
  quizPerfect: number;
  wins: { match: number; build: number; order: number; tone: number };
  perfect: Record<string, number>;
  badges: Record<string, string>;
}

const STAT0 = (): Stats => ({
  days: [],
  ai: 0,
  read: [],
  greet: 0,
  classes: [],
  quizPerfect: 0,
  wins: { match: 0, build: 0, order: 0, tone: 0 },
  perfect: {},
  badges: {},
});

export function stats(): Stats {
  try {
    const o = JSON.parse(ls.get("nh:stats") || "{}");
    const d = STAT0();
    return Object.assign(d, o, {
      wins: Object.assign(d.wins, o.wins || {}),
      perfect: Object.assign({}, o.perfect || {}),
      badges: Object.assign({}, o.badges || {}),
    });
  } catch {
    return STAT0();
  }
}

function saveStats(S: Stats): void {
  ls.set("nh:stats", JSON.stringify(S));
}

/** Consecutive-day streak ending today (hud.js `streak`). */
export function streak(S: Stats): number {
  const set = new Set(S.days);
  let n = 0;
  const d = new Date();
  while (set.has(dstr(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export interface Badge {
  id: string;
  e: string;
  t: string;
  d: string;
  v: (S: Stats) => [number, number];
}

interface PlayerStore {
  /** THE mutable player object — engine/state.ts holds the same reference.
   *  Subscribe to `meSeq` (not `me`) to react to meta changes (name/hair/cl). */
  me: PlayerState;
  meSeq: number;
  entered: boolean;
  points: number;
  badgeCount: number;

  join(nick: string, color: string, hair: number): void;
  setMe(patch: Partial<PlayerState>): void;
  /** hud.js `award`: idempotent per ledger key, x2 during study hour. */
  award(key: string | null, n: number, why: string): boolean;
  bump(fn: (S: Stats) => void): void;
  checkBadges(): void;
  totalWords(): number;
}

export function ledger(): Record<string, number> {
  try {
    return JSON.parse(ls.get("nh:ledger") || "{}");
  } catch {
    return {};
  }
}

export const BADGES: Badge[] = [
  { id: "first", e: "🎒", t: "Bước chân đầu tiên", d: "Vào trung tâm lần đầu", v: (S) => [S.days.length, 1] },
  { id: "streak3", e: "🔥", t: "Chăm chỉ 3 ngày", d: "Vào học 3 ngày liên tiếp", v: (S) => [streak(S), 3] },
  { id: "streak7", e: "🏅", t: "Kiên trì 7 ngày", d: "Vào học 7 ngày liên tiếp", v: (S) => [streak(S), 7] },
  { id: "words50", e: "📚", t: "50 từ đầu tiên", d: "Mở khoá 50 từ vựng", v: () => [usePlayer.getState().totalWords(), 50] },
  { id: "quiz", e: "💯", t: "Điểm tuyệt đối", d: "Kiểm tra nhanh đúng 5/5", v: (S) => [S.quizPerfect, 1] },
  { id: "ai10", e: "🙋", t: "Ham học hỏi", d: "Trả lời đúng 10 câu đố của Thầy Vương", v: (S) => [S.ai, 10] },
  { id: "read5", e: "📖", t: "Mọt sách", d: "Đọc sách trong thư viện 5 ngày", v: (S) => [S.read.length, 5] },
  {
    id: "classes", e: "🏫", t: "Khám phá 3 lớp",
    d: GT_ONLY ? "Vào đủ 3 lớp Nhập môn 1, Nhập môn 2, Cơ sở" : "Vào đủ lớp HSK 1, 2, 3",
    v: (S) => [S.classes.length, 3],
  },
  { id: "greet", e: "👋", t: "Thân thiện", d: "Chào mọi người 10 lần", v: (S) => [S.greet, 10] },
  { id: "match", e: "🧩", t: "Vua nối từ", d: "Hoàn thành Nối từ 5 lần", v: (S) => [S.wins.match, 5] },
  { id: "build", e: "✍️", t: "Bậc thầy ghép chữ", d: "Ghép đúng 5/5 chữ", v: (S) => [S.perfect.build ? 1 : 0, 1] },
  { id: "order", e: "🧱", t: "Câu chuẩn từng chữ", d: "Xếp đúng 5/5 câu", v: (S) => [S.perfect.order ? 1 : 0, 1] },
  { id: "tone", e: "👂", t: "Đôi tai vàng", d: "Nghe đúng 6/6 thanh điệu", v: (S) => [S.perfect.tone ? 1 : 0, 1] },
  { id: "p100", e: "⭐", t: "100 điểm", d: "Tích được 100 điểm", v: () => [usePlayer.getState().points, 100] },
  { id: "p500", e: "🏆", t: "500 điểm", d: "Tích được 500 điểm", v: () => [usePlayer.getState().points, 500] },
];

export const usePlayer = create<PlayerStore>((set, get) => ({
  me: engineMe,
  meSeq: 0,
  entered: false,
  points: Number(ls.get("nh:pts")) || 0,
  badgeCount: Object.keys(stats().badges).length,

  join: (nick, color, hair) => {
    const me = get().me;
    me.n = nick;
    me.c = color;
    me.h = hair;
    ls.set("nh:n", nick);
    ls.set("nh:c", color);
    ls.set("nh:h", String(hair));
    me.x = 700 + 40 + Math.random() * 80 - 40; // 700+OX
    me.y = 900;
    set((s) => ({ meSeq: s.meSeq + 1, entered: true }));
    setTimeout(() => {
      get().bump((S) => {
        if (!S.days.includes(dstr())) S.days.push(dstr());
        S.days = S.days.slice(-90);
      });
      get().award(`checkin:${dstr()}`, 5, "điểm danh hôm nay");
    }, 900);
  },

  setMe: (patch) => {
    Object.assign(get().me, patch);
    set((s) => ({ meSeq: s.meSeq + 1 }));
  },

  award: (key, n, why) => {
    const st = get();
    if (!st.entered) return false;
    const L = ledger();
    if (key && L[key]) return false;
    if (key) {
      L[key] = 1;
      ls.set("nh:ledger", JSON.stringify(L));
    }
    // giờ học chung x2 (community.js hooks)
    const inStudyHour = callHook<boolean>("studyHour");
    const mates = callHook<number>("classMates") ?? 0;
    if (n > 0 && inStudyHour && mates > 0) {
      n *= 2;
      why += " – x2 giờ học chung";
    }
    const points = st.points + n;
    ls.set("nh:pts", String(points));
    set({ points });
    useUi.getState().toast(`+${n} điểm: ${why}`);
    emitHook("commSync");
    if (key && key.startsWith("read:"))
      st.bump((S) => {
        if (!S.read.includes(dstr())) S.read.push(dstr());
      });
    else st.checkBadges();
    emitHook("sendMove", true);
    emitHook("progPaint");
    return true;
  },

  bump: (fn) => {
    const S = stats();
    fn(S);
    saveStats(S);
    get().checkBadges();
  },

  checkBadges: () => {
    const st = get();
    if (!st.entered) return;
    const S = stats();
    let got = 0;
    BADGES.forEach((b) => {
      if (S.badges[b.id]) return;
      const [c, n] = b.v(S);
      if (c >= n) {
        S.badges[b.id] = dstr();
        got++;
        useUi.getState().toast(`${b.e} Huy hiệu mới: ${b.t} (+10 điểm)`);
      }
    });
    if (got) {
      saveStats(S);
      const points = st.points + 10 * got;
      ls.set("nh:pts", String(points));
      set({ points, badgeCount: Object.keys(S.badges).length });
      st.checkBadges();
      emitHook("sendMove", true);
    }
  },

  totalWords: () =>
    [1, 2, 3].reduce(
      (a, lv) => a + (ls.get("nh:start" + lv) ? unlocked(lv) : 0),
      0,
    ),
}));
