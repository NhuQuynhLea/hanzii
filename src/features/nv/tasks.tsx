/**
 * Danh sách nhiệm vụ ngày (nv-quest.js `nvTasks`/`webPlan`/`nvCurrent`/`nvFinish`).
 */
import type { ReactNode } from "react";
import { ls } from "@/lib/storage";
import { dstr } from "@/lib/helpers";
import { LEVELS, PER_DAY, todayWords, getCurLevel } from "@/lib/curriculum";
import { NH_LESSONS } from "@/data/nh-lessons";
import { GT_ONLY, FLR, gtClassName } from "@/game/world/geometry";
import { me } from "@/game/engine/state";
import { enterClass, leaveClass, leavePron, leaveRoomScene } from "@/game/engine/navigation";
import { callHook, emitHook } from "@/services/hooks";
import { useUi, toast } from "@/stores/ui";
import { usePlayer, ledger } from "@/stores/player";
import { Hz } from "@/features/ui-bits";
import { nvDue } from "./srs";
import { nvOpenReview } from "./review";
import { nvOpenChat } from "./chat";
import { openNvRoom } from "./room";

export interface NvTask {
  k: string;
  ic: ReactNode;
  t: string;
  done: boolean;
  go: () => void;
}

const svg = (d: ReactNode, size = 16, sw = 2): ReactNode => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {d}
  </svg>
);

const IC_WEB = svg(
  <>
    <path d="M22 10 12 5 2 10l10 5 10-5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </>,
);
const IC_REV = svg(
  <>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </>,
);
const IC_LEARN = svg(
  <>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </>,
);
const IC_CHAT = svg(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />);

export const IC_QUEST = svg(
  <>
    <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
    <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
  </>,
  18,
  1.8,
);

/* Tiến độ lộ trình 48 bài: đọc từ bộ nhớ chung của website 48 bài (chạy cùng nguồn trong khung). */
interface WebLessonState {
  status?: string;
  completedAt?: string | number;
}
interface WebPlan {
  next?: { id: string; lv: number; n: number; vi: string };
  doneToday: boolean;
  count: number;
  total: number;
}

function webPlan(): WebPlan | null {
  let st: {
    lessons?: Record<string, WebLessonState | undefined>;
    onboarding?: { startLevel?: number };
  } | null = null;
  try {
    st = JSON.parse(localStorage.getItem("nowhanzi-learner-v1") || "null");
  } catch {
    /* noop */
  }
  const all = NH_LESSONS.map((l) => ({ id: l.lv + "-" + l.n, lv: l.lv, n: l.n, vi: l.vi }));
  if (!all.length) return null;
  const P = (st && st.lessons) || {};
  const done = (id: string) => !!P[id] && P[id]!.status === "completed";
  const start = (st && st.onboarding && st.onboarding.startLevel) || 1;
  const today = dstr();
  const doneToday = Object.values(P).some(
    (x) => x && x.completedAt && dstr(new Date(x.completedAt)) === today,
  );
  const next =
    all.find((l) => P[l.id] && P[l.id]!.status === "in_progress") ||
    all.find((l) => l.lv >= start && !done(l.id)) ||
    all.find((l) => !done(l.id));
  return { next, doneToday, count: all.filter((l) => done(l.id)).length, total: all.length };
}

export function nvTasks(): NvTask[] {
  const t = dstr();
  const lv = getCurLevel();
  const L = ledger();
  const due = nvDue(lv);
  const wp = webPlan();
  const learned = Object.keys(L).some((k) => k.startsWith("bm:on:") && k.endsWith(t));
  const tasks: NvTask[] = [];
  if (!GT_ONLY && wp && wp.next) {
    const nx = wp.next;
    tasks.push({
      k: "web",
      ic: IC_WEB,
      t: wp.doneToday
        ? "Lộ trình 48 bài: đã học 1 bài hôm nay"
        : `Lộ trình: Bài ${nx.n} HSK ${nx.lv} – ${nx.vi}`,
      done: wp.doneToday,
      go: () => useUi.getState().setAcad(true, "bai-" + nx.id),
    });
  }
  tasks.push(
    {
      k: "rev",
      ic: IC_REV,
      t: due.length ? `Ôn ${due.length} từ cũ (3 phút)` : "Ôn từ cũ: hôm nay không có từ đến hạn",
      done: ls.get("nh:q:rev") === t || !due.length,
      go: () => nvOpenReview(),
    },
    {
      k: "learn",
      ic: IC_LEARN,
      t:
        FLR.lop === "gt"
          ? `Học bài Giao tiếp ở lớp ${gtClassName(lv)}`
          : `Luyện thêm 5 từ ở Lớp HSK ${lv}`,
      done: FLR.lop === "gt" ? ls.get("nh:q:gt") === t : learned,
      go: () => {
        if (me.sc === 1 && me.cl === lv) {
          callHook("openLesson");
          return;
        }
        if (me.sc === 2) leavePron();
        else if (me.sc >= 3) leaveRoomScene();
        else if (me.sc === 1) leaveClass();
        enterClass(lv);
        toast("Ngồi vào một bàn trống để bắt đầu học nhé.");
      },
    },
    {
      k: "chat",
      ic: IC_CHAT,
      t: "Trò chuyện cùng Thầy Vương bằng từ mới",
      done: ls.get("nh:q:chat") === t,
      go: () => nvOpenChat(),
    },
  );
  return tasks;
}

export function nvTasksGo(k: string): void {
  const t = nvTasks().find((x) => x.k === k);
  if (t) t.go();
}

export function nvCurrent(): NvTask | null {
  return nvTasks().find((x) => !x.done) || null;
}

/** Thưởng khi xong cả 3 nhiệm vụ (nv-quest.js `nvFinish`). */
export function nvFinish(): void {
  const lv = getCurLevel();
  const t = todayWords(lv);
  const nx = (LEVELS[lv] ?? []).slice(t.day * PER_DAY, t.day * PER_DAY + PER_DAY);
  openNvRoom(
    "棒",
    "Hôm nay đủ rồi!",
    "Bạn đã hoàn thành cả 3 nhiệm vụ",
    <div className="flex flex-col items-center gap-2.5 py-2.5 text-center">
      <div className="text-[2.6rem] font-extrabold leading-none text-[#EA0000]">🎉</div>
      <p className="m-0 text-[14px] text-[#3D3E5C]">
        Học đều mỗi ngày quan trọng hơn học nhiều một lúc. Nghỉ ngơi thôi, mai mình học tiếp nhé!
      </p>
      {nx.length ? (
        <>
          <b className="text-[14px] text-[#050349]">Ngày mai bạn sẽ học:</b>
          <div className="flex flex-wrap justify-center gap-3">
            {nx.map((w) => (
              <Hz key={w[0]} t={w[0]} py={w[1]} className="text-[26px] font-semibold" />
            ))}
          </div>
        </>
      ) : null}
      <button
        type="button"
        onClick={() => useUi.getState().closeRoom()}
        className="rounded-xl bg-[#EA0000] px-4 py-2 text-[14px] font-bold text-white"
      >
        Hẹn mai!
      </button>
    </div>,
  );
  usePlayer.getState().award(`nv:fin:${dstr()}`, 10, "hoàn thành nhiệm vụ hôm nay");
  emitHook("nvPaint");
}
