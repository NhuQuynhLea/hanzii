/**
 * Widget "Mục tiêu hôm nay" (nv-quest.js `nvPaint` + #quest nav).
 * Repaint: 4s interval + hook "nvPaint" + storage("nowhanzi-learner-v1").
 */
import { useEffect, useState } from "react";
import { ls } from "@/lib/storage";
import { dstr } from "@/lib/helpers";
import { usePlayer } from "@/stores/player";
import { callHook, onHook } from "@/services/hooks";
import { nvTasks, nvFinish, IC_QUEST } from "./tasks";

/** community.js COMM (giờ học chung + mục tiêu tuần) — dữ liệu động qua hooks. */
const COMM = { hour: [20, 21], goal: 1000 };

interface GpInfo {
  code: string;
  name: string;
}
interface GpStats {
  week_points: number;
  goal: number;
  active_today: number;
  members: unknown[];
}

const qcomm =
  "mt-1.5 hidden min-[821px]:flex flex-col gap-0.5 rounded-xl bg-[#EA0000]/[0.06] px-2.5 py-2 text-[13px]";

export function NvQuest() {
  const entered = usePlayer((s) => s.entered);
  const scene = usePlayer((s) => (s.meSeq, s.me.sc));
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const repaint = () => setTick((x) => x + 1);
    const id = setInterval(repaint, 4000);
    const off = onHook("nvPaint", repaint);
    const onStore = (e: StorageEvent) => {
      if (e.key === "nowhanzi-learner-v1") repaint();
    };
    window.addEventListener("storage", onStore);
    return () => {
      clearInterval(id);
      off();
      window.removeEventListener("storage", onStore);
    };
  }, []);

  const ts = nvTasks();
  const n = ts.filter((x) => x.done).length;
  const cur = ts.find((x) => !x.done) || null;

  /* xong hết nhiệm vụ → mở thưởng một lần mỗi ngày */
  useEffect(() => {
    if (!entered) return;
    if (n === ts.length && ls.get("nh:q:fin") !== dstr()) {
      ls.set("nh:q:fin", dstr());
      const id = setTimeout(nvFinish, 600);
      return () => clearTimeout(id);
    }
  }, [entered, n, ts.length]);

  if (!entered || scene !== 0) return null;

  const sh = !!callHook<boolean>("studyHour");
  const mates = callHook<number>("classMates") ?? 0;
  const gp = callHook<GpInfo | null>("gpInfo");
  const gs = gp && gp.code ? callHook<GpStats | undefined>("gpStats") : undefined;
  const tot = callHook<number>("commTotal") ?? 0;
  const wkPts = callHook<number>("wkPoints") ?? 0;
  const cOk = !!callHook<boolean>("commOk");

  return (
    <nav
      aria-label="Mục tiêu hôm nay"
      className={`fixed left-3 top-[calc(84px+env(safe-area-inset-top,0px))] z-30 w-[min(260px,calc(100vw-24px))] rounded-2xl border border-white/55 bg-[rgba(255,248,236,.92)] px-2 py-1.5 text-[#050349] shadow-[0_10px_30px_rgba(15,20,35,.25)] backdrop-blur ${
        open ? "min-[821px]:rounded-[18px]" : "min-[821px]:rounded-full"
      } max-[820px]:bottom-[calc(132px+env(safe-area-inset-bottom,0px))] max-[820px]:top-auto min-[821px]:left-auto min-[821px]:right-[196px] min-[821px]:top-[calc(16px+env(safe-area-inset-top,0px))] min-[821px]:w-auto min-[821px]:min-w-[330px] min-[821px]:max-w-[380px] min-[821px]:px-2.5 min-[821px]:py-1`}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[40px] w-full cursor-pointer items-center justify-between gap-2 px-1.5 py-0.5 min-[821px]:min-h-[46px] min-[821px]:gap-3"
      >
        <em className="inline-grid place-items-center text-[#7A4E3A] not-italic">{IC_QUEST}</em>
        <b className="mr-auto font-bold min-[821px]:mr-0">Mục tiêu hôm nay</b>
        <span className="px-0.5 text-[13px] font-extrabold">
          {n}/{ts.length}
        </span>
        <s className="hidden items-center gap-[5px] no-underline min-[821px]:inline-flex">
          {ts.map((x) => (
            <u
              key={x.k}
              className={`block h-[9px] w-[9px] rounded-full no-underline ${x.done ? "bg-[#EA0000]" : "bg-black/25"}`}
            />
          ))}
        </s>
        <i className="ml-0.5 not-italic text-[#5B5A7A]">{open ? "▴" : "›"}</i>
      </button>

      {!open &&
        (cur ? (
          <button
            type="button"
            onClick={() => cur.go()}
            className="mt-1 flex min-h-[44px] w-full items-center gap-2 rounded-[10px] border border-[#EA0000] bg-[#FFF8EC] px-2.5 py-1.5 text-left text-[13px] font-semibold min-[821px]:hidden"
          >
            <span className="inline-grid shrink-0 place-items-center text-[#EA0000]">{cur.ic}</span>
            {cur.t}
          </button>
        ) : (
          <small className="block px-1.5 py-1 text-[12px] font-bold text-[#1F7A4D] min-[821px]:hidden">
            ✓ Hôm nay đã xong, hẹn mai!
          </small>
        ))}

      {open && (
        <ol className="my-1 flex list-none flex-col gap-1.5 p-0">
          {ts.map((x) => {
            const now = x === cur;
            return (
              <li key={x.k}>
                <button
                  type="button"
                  disabled={x.done}
                  onClick={() => x.go()}
                  className={`flex min-h-[44px] w-full items-center gap-2 rounded-[10px] border border-[#E3DACB] bg-[#FFF8EC] px-2.5 py-1.5 text-left text-[13px] font-semibold ${
                    x.done
                      ? "cursor-default line-through opacity-55"
                      : now
                        ? "border-[#EA0000] shadow-[0_0_0_2px_rgba(234,0,0,.15)]"
                        : ""
                  }`}
                >
                  <span
                    className={`inline-grid shrink-0 place-items-center ${x.done ? "" : "text-[#EA0000]"}`}
                  >
                    {x.done ? "✓" : x.ic}
                  </span>
                  {x.t}
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {open && (
        <>
          <div className={qcomm}>
            <b className="font-bold">
              {sh
                ? "⏰ Giờ học chung đang diễn ra"
                : `⏰ Giờ học chung ${COMM.hour[0]}:00–${COMM.hour[1]}:00`}
            </b>
            <span className="text-[#5B5A7A]">
              {sh
                ? `Học trong lớp cùng bạn khác: điểm x2${mates ? ` – ${mates} bạn đang học cùng` : ""}`
                : "Học cùng bạn khác trong giờ này được điểm x2"}
            </span>
          </div>
          {gp && gp.code && gs ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => callHook("openBoard", "nhom")}
              onKeyDown={(e) => {
                if (e.key === "Enter") callHook("openBoard", "nhom");
              }}
              className={`${qcomm} cursor-pointer border-l-[3px] border-[#2E7D4F]`}
            >
              <b className="font-bold">👥 {gp.name || "Nhóm học"}</b>
              <span className="text-[#5B5A7A]">
                Tuần {Math.min(gs.week_points, gs.goal)}/{gs.goal} điểm – hôm nay {gs.active_today}/{gs.members.length || 1}{" "}
                bạn đã học
              </span>
            </div>
          ) : null}
          <div className={qcomm}>
            <b className="font-bold">🏮 Thử thách cả trường tuần này</b>
            <span className="text-[#5B5A7A]">
              {cOk
                ? `${Math.min(tot, COMM.goal)}/${COMM.goal} điểm – bạn góp ${wkPts}`
                : "Kết nối mạng để xem tiến độ chung"}
            </span>
            <div className="mt-1 h-1.5 overflow-hidden rounded-[3px] bg-black/[0.08]">
              <i
                className="block h-full rounded-[3px] bg-[#EA0000]"
                style={{ width: `${Math.min(100, (tot / COMM.goal) * 100)}%` }}
              />
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
