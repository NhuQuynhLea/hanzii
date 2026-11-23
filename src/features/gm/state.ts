/**
 * Gamification logic — ported from gm.js.
 * Persistent state (`nh:gm`, `nh:cards`) lives in @/stores/gm; this module
 * adds titles, shop data, the streak-goal/chest flow, combos, the 60s pool,
 * gate helpers and the GT-class router (openGTClass).
 */
import type { Word } from "@/types/lesson";
import { ls } from "@/lib/storage";
import { dstr, daysBetween } from "@/lib/helpers";
import { GT_LESSONS, GT_STAGES, gtLabel } from "@/data/gt-data";
import { GT_CLASS, FLR } from "@/game/world/geometry";
import { me } from "@/game/engine/state";
import { usePlayer } from "@/stores/player";
import { toast } from "@/stores/ui";
import { useGm, gmGet, gmSave, GM_SLOTS, GM_FREEZE_MAX, GM_FREEZE_PRICE, type GmSlot } from "@/stores/gm";
import { useGt, gtState } from "@/stores/gt";
import { callHook } from "@/services/hooks";
import { sfx } from "@/services/sfx";

/* gt-core.js curriculum constants (owned by the GT feature when ported). */
export const GT_FREE = 5;
export const GT_NEED = 2;

/* ===== danh hiệu & cửa hàng ===== */
export const GM_TITLES: [number, string][] = [
  [1, "Tân binh"], [3, "Học trò"], [5, "Chăm chỉ"], [8, "Giỏi giang"],
  [10, "Tinh anh"], [13, "Cao thủ"], [16, "Bậc thầy"], [20, "Đại sư"],
];

export function gmTitle(lv: number): string {
  let t = GM_TITLES[0][1];
  GM_TITLES.forEach(([l, n]) => {
    if (lv >= l) t = n;
  });
  return t;
}

/** Shop item: [id, name, price, needLv, extra?] (extra = emoji màu khung). */
export type GmShopItem = [number, string, number, number, (string | undefined)?];

export const GM_SHOP: Record<GmSlot, { name: string; items: GmShopItem[] }> = {
  hat: { name: "Mũ", items: [[1, "Mũ lưỡi trai", 40, 1], [2, "Nón lá", 60, 1], [3, "Mũ tốt nghiệp", 120, 5], [4, "Vương miện", 250, 10]] },
  glass: { name: "Kính", items: [[1, "Kính tròn", 30, 1], [2, "Kính râm", 50, 1]] },
  pet: { name: "Thú cưng", items: [[1, "Mèo con", 80, 1, "🐱"], [2, "Cún con", 80, 1, "🐶"], [3, "Gấu trúc", 150, 6, "🐼"], [4, "Rồng nhỏ", 300, 12, "🐉"]] },
  tag: { name: "Khung tên", items: [[1, "Khung vàng", 60, 1, "#C9952F"], [2, "Khung ngọc", 60, 1, "#0F766E"], [3, "Khung tím", 100, 8, "#6D28D9"]] },
};

export { GM_SLOTS, GM_FREEZE_MAX, GM_FREEZE_PRICE };

/* ===== store-backed accessors (gmGet/gmXu/gmDiff/gmStreak/gmToday/gmAc) ===== */
export const gmXu = (): number => useGm.getState().xu();
export const gmDiff = (a: string, b: string): number => (a && b ? daysBetween(a, b) : 999);
export const gmStreak = (): number => useGm.getState().streak();
export const gmToday = (): boolean => useGm.getState().today();
export const gmAc = (): string => useGm.getState().ac();

/* ===== chuỗi ngày & rương thưởng ===== */
export function gmGoalHit(): void {
  const cur = useGm.getState().g;
  const g = { ...cur, hist: [...cur.hist], own: [...cur.own], chests: [...cur.chests], titles: cur.titles ? [...cur.titles] : cur.titles };
  const t = dstr();
  if (g.last === t) return;
  const d = gmDiff(g.last, t);
  let used = false;
  if (d === 1) g.cnt++;
  else if (d === 2 && g.frz > 0) {
    g.frz--;
    g.cnt++;
    used = true;
  } else g.cnt = 1;
  g.last = t;
  g.best = Math.max(g.best, g.cnt);
  g.hist = [...new Set([...g.hist, t])].slice(-60);
  let chest = 0;
  if (g.cnt % 7 === 0 && !g.chests.includes(g.cnt)) {
    g.chests.push(g.cnt);
    chest = g.cnt;
    g.bonus += 50;
    if (g.frz < GM_FREEZE_MAX) g.frz++;
  }
  gmSave(g);
  me.ac = gmAc();
  toast(`🔥 Chuỗi ${g.cnt} ngày! Xong mục tiêu hôm nay` + (used ? " (đã dùng 1 thẻ đóng băng)" : ""));
  if (chest) setTimeout(() => callHook("gmChest", chest), 1200);
}

/* ===== cấp độ ===== */
export function gmLevelUp(lv: number, rewards: string[]): void {
  callHook("gtConfetti");
  toast(`⭐ Lên cấp ${lv} – ${gmTitle(lv)}` + (rewards && rewards.length ? " – Mở khoá: " + rewards.join(", ") : ""));
  const nxt = GM_SLOTS.flatMap((k) => GM_SHOP[k].items.filter((it) => it[3] === lv).map((it) => it[1]));
  if (nxt.length) setTimeout(() => toast("Cửa hàng mở thêm: " + nxt.join(", ")), 2600);
}

/* ===== gmPaint: HUD refresh fan-out (store emits `gmPaint` on save) ===== */
const paintFns = new Set<() => void>();
export function onGmPaint(fn: () => void): () => void {
  paintFns.add(fn);
  return () => paintFns.delete(fn);
}
export function gmPaint(): void {
  paintFns.forEach((f) => {
    try {
      f();
    } catch {
      /* isolate */
    }
  });
}

/* ===== pop animation (gm.js `gmPop`, .gm-pop keyframe via WAAPI) ===== */
export function gmPop(elm: HTMLElement | null): void {
  if (!elm) return;
  if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  elm.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.12)", offset: 0.4 }, { transform: "scale(1)" }],
    { duration: 350, easing: "ease-out" },
  );
}

/* ===== thẻ từ (store-backed; gmSetCheck ported on top) ===== */
export const gmCards = () => useGm.getState().cards;
export const gmCardSave = (c?: ReturnType<typeof gmCards>) => useGm.getState().saveCards(c);
export const gmCardSeen = (zh: string) => useGm.getState().cardSeen(zh);

export function gmSetCheck(): void {
  const st = useGm.getState();
  const c = { ...st.cards, sets: { ...st.cards.sets } };
  let changed = false;
  Object.keys(GT_LESSONS).forEach((n) => {
    const ws = GT_LESSONS[+n].words.map((w) => w[0]);
    if (!c.sets[n] && ws.every((z) => c.own[z])) {
      c.sets[n] = 1;
      changed = true;
      const g = { ...gmGet() };
      g.bonus += 20;
      gmSave(g);
      toast(`🃏 Đủ bộ thẻ ${gtLabel(+n)}! +20 xu`);
      sfx("win");
    }
  });
  if (changed) st.saveCards(c);
}

export function gmCardOwn(zh: string): void {
  if (useGm.getState().cards.own[zh]) return;
  useGm.getState().cardOwn(zh);
  gmSetCheck();
}

/* ===== combo trong luyện tập ===== */
let gmCombo = 0;
export const gmComboNow = (): number => gmCombo;

export function gmComboHit(ok: boolean, _box?: HTMLElement | null, n?: number | string, qi?: number): void {
  if (ok) {
    gmCombo++;
    sfx(gmCombo >= 3 ? "combo" : "ok");
    if (gmCombo >= 3) usePlayer.getState().award(`gt:combo:${n}:${qi}`, 1, `combo x${gmCombo}`);
  } else {
    gmCombo = 0;
    sfx("bad");
  }
  // `.gm-combo` badge rendered by the GT quiz UI (Phase 7)
  const b = document.querySelector<HTMLElement>('[role="dialog"] .gm-combo') || document.querySelector<HTMLElement>(".gm-combo");
  if (b) {
    b.textContent = gmCombo >= 2 ? `🔥 Combo x${gmCombo}` : "Combo: trả lời đúng liên tiếp để nhân thưởng";
    b.classList.toggle("hot", gmCombo >= 2);
    if (gmCombo >= 2) gmPop(b);
  }
}

/** gt-core `gtUnlocked` via hook; falls back to the same formula
 *  (stars via `gtStars` hook + our own gate check) until it is registered. */
export function gtUnlockedOf(i: number): boolean {
  const viaHook = callHook<boolean>("gtUnlocked", i);
  if (viaHook !== undefined) return viaHook;
  return (
    !!GT_LESSONS[i] &&
    (i <= GT_FREE || (callHook<number>("gtStars", i - 1) ?? 0) >= GT_NEED) &&
    (!gmGateOf(i - 1) || gmGatePassed(i - 1))
  );
}

/* ===== thử thách 60 giây — word pool ===== */
export function gmPool(): Word[] {
  const ws: Word[] = [];
  Object.keys(GT_LESSONS)
    .map(Number)
    .filter((n) => gtUnlockedOf(n))
    .forEach((n) =>
      GT_LESSONS[n].words.forEach((w) => {
        if (!ws.some((x) => x[0] === w[0])) ws.push(w);
      }),
    );
  return ws;
}

/* ===== cổng thử thách ===== */
export const GT_GATES = [5, 10, 15, 20, 25, 30, 35, 42, 47, 52, 55];
export const gmGateOf = (i: number): boolean => GT_GATES.includes(i);
export const gmGateRange = (g: number): [number, number] => {
  const k = GT_GATES.indexOf(g);
  const from = k ? GT_GATES[k - 1] + 1 : 1;
  return [from, g];
};
export const gmGateBig = (g: number): boolean => [15, 30, 42, 55].includes(g);
export function gmGateName(g: number): string {
  const big = gmGateBig(g);
  const [a, b] = gmGateRange(g);
  return big
    ? `Đại chiến cuối quyển ${GT_STAGES.find((s) => g >= s.from && g <= s.to)!.name}`
    : `Trận đấu ${gtLabel(a).split(" – ")[0]} ${a > 30 ? a - 30 : a}–${b > 30 ? b - 30 : b}`;
}
export function gmGates(): Record<number, string> {
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
export const gmGateOpenList = (): number[] => GT_GATES.filter((g) => gmGateReady(g) && !gmGatePassed(g));

/* ===== Giảng đường: mỗi phòng là một lớp Giao tiếp cấp tốc ===== */
let gtOnly = 0;
export const getGtOnly = (): number => gtOnly;
export const setGtOnly = (v: number): void => {
  gtOnly = v;
};

export function gtClassLesson(lv: number): number {
  const c = GT_CLASS[lv];
  if (!c) return 0;
  const s = gtState();
  let first = 0;
  let last = 0;
  for (let i = c.from; i <= c.to; i++) {
    if (gtUnlockedOf(i)) {
      if (!first) first = i;
      last = i;
      if (!s.done[i] || ((callHook<number>("gtStars", i) ?? 0) < GT_NEED && i >= GT_FREE)) return i;
    }
  }
  return last || first;
}

/** window flags shared with the GT feature (gt/scene declares the globals). */
const win = (): { _gtMap?: number; _gtNext?: string[] | null } =>
  window as { _gtMap?: number; _gtNext?: string[] | null };

export function openGTClass(lv: number): void {
  ls.set("nh:tab", "gt");
  ls.set("nh:q:gt", dstr());
  gtOnly = lv;
  const n = gtClassLesson(lv);
  const C = GT_CLASS[lv];
  const gt = useGt.getState();
  if (gt.cur && (gt.cur < C.from || gt.cur > C.to)) gt.setSession({ cur: 0 });
  if (win()._gtMap) {
    win()._gtMap = 0;
    useGt.getState().setSession({ cur: 0 });
  } else if (win()._gtNext && n) {
    const L = win()._gtNext!;
    const buoi = callHook<number>("gtCurB", n) ?? 1;
    const st = callHook<string[]>("gtBSteps", n, buoi) ?? [];
    const cand = L.filter((k) => st.includes(k));
    const step = cand.find((k) => !callHook<boolean>("gtIsSeen", n, buoi, k)) || cand[0] || st[0];
    useGt.getState().setSession({ cur: n, buoi, buoiFor: n, step });
    win()._gtNext = null;
  } else if (n && !useGt.getState().cur) {
    useGt.getState().setSession({ cur: n, step: "goal" });
  }
  // openLessonList (not "openLesson"): openLesson routes back through
  // openGTClass on the GT floor → infinite recursion. The lesson-list
  // dialog renders the GT roadmap, or GtLesson when gt.cur is set above.
  callHook("openLessonList");
  callHook("nvPaint");
}

/* ===== nút trên bảng lớp (gm.js `cbLesson`/`cbMap` wiring) ===== */
export function cbLesson(): void {
  const n = me && me.sc === 1 && FLR.lop === "gt" ? gtClassLesson(me.cl || 1) : 0;
  if (n) callHook("duoStart", n);
  else callHook("openLesson");
}
export function cbMap(): void {
  win()._gtMap = 1;
  callHook("openLesson");
}

/* ===== community helpers for the league tab (Phase 8) ===== */
export interface CommDoc {
  id: string;
  nickname?: string;
  week_points?: unknown;
  week?: string;
  hsk_level?: unknown;
}
export const commDb = (): boolean => !!callHook<boolean>("cdb");
export const commDocs = (): CommDoc[] => (callHook<CommDoc[]>("cDocs") as CommDoc[] | undefined) || [];
export const commUid = (): string | undefined => callHook<string>("cuid") as string | undefined;
export const wkPoints = (): number => callHook<number>("wkPoints") ?? 0;
