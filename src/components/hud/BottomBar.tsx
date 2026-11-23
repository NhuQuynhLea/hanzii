/**
 * Bottom cluster — class bar (sc=1), pron bar (sc=2), room leave bar (sc>=3),
 * emote buttons (campus), help line.
 */
import { usePlayer } from "@/stores/player";
import { callHook } from "@/services/hooks";
import { leaveClass, leavePron, leaveRoomScene } from "@/game/engine/navigation";
import { sendEmote } from "@/services/emotes";
import { FLR, GT_ONLY } from "@/game/world/geometry";
import { getCurLevel, driveUrl } from "@/lib/curriculum";

const EMOTES: [string, string, string][] = [
  ["wave", "你好", "Chào"],
  ["xiexie", "谢谢", "Cảm ơn"],
  ["jiayou", "加油", "Cố lên"],
];

export function BottomBar() {
  const scene = usePlayer((s) => (s.meSeq, s.me.sc));
  const seat = usePlayer((s) => (s.meSeq, s.me.seat));
  const entered = usePlayer((s) => s.entered);
  const cl = usePlayer((s) => (s.meSeq, s.me.cl));
  if (!entered) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex items-end justify-center gap-2">
      {scene === 1 && (
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl bg-[#050349]/90 p-1.5 shadow-lg">
          <button type="button" onClick={() => callHook("openLesson")} className="rounded-xl bg-[#EA0000] px-3 py-1.5 text-[13px] font-bold text-white">
            Bài học
          </button>
          <button type="button" onClick={() => callHook("openRoadmap")} className="rounded-xl px-3 py-1.5 text-[13px] font-semibold text-white/90 hover:bg-white/15">
            Lộ trình
          </button>
          {FLR.lop !== "gt" && (
            <button type="button" onClick={() => callHook("openAcademy")} className="rounded-xl px-3 py-1.5 text-[13px] font-semibold text-white/90 hover:bg-white/15">
              48 bài
            </button>
          )}
          {!GT_ONLY && (
            <button type="button" onClick={() => callHook("askFloor", "lop")} className="rounded-xl px-3 py-1.5 text-[13px] font-semibold text-white/90 hover:bg-white/15">
              ⇅ {FLR.lop === "gt" ? "Tầng 1" : "Tầng 2"}
            </button>
          )}
          <a
            href={driveUrl(cl || getCurLevel()) || undefined}
            target="_blank"
            rel="noopener"
            className="rounded-xl px-3 py-1.5 text-[13px] font-semibold text-white/90 hover:bg-white/15"
            onClick={(e) => {
              if (!driveUrl(cl || getCurLevel())) {
                e.preventDefault();
                callHook("openRoom", "thu");
              }
            }}
          >
            Tài liệu
          </a>
          <button
            type="button"
            onClick={leaveClass}
            className="rounded-xl px-3 py-1.5 text-[13px] font-semibold text-white/90 hover:bg-white/15"
            style={{ display: seat >= 0 ? "none" : undefined }}
          >
            Rời lớp
          </button>
        </div>
      )}

      {scene === 2 && (
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl bg-[#050349]/90 p-1.5 shadow-lg">
          <button type="button" onClick={leavePron} className="rounded-xl bg-[#EA0000] px-3 py-1.5 text-[13px] font-bold text-white">
            Rời phòng
          </button>
        </div>
      )}

      {scene >= 3 && (
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl bg-[#050349]/90 p-1.5 shadow-lg">
          <button type="button" onClick={leaveRoomScene} className="rounded-xl bg-[#EA0000] px-3 py-1.5 text-[13px] font-bold text-white">
            Ra ngoài
          </button>
        </div>
      )}

      {scene === 0 && (
        <div className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-[#050349]/90 p-1.5 shadow-lg">
          {EMOTES.map(([k, zh, vi]) => (
            <button
              key={k}
              type="button"
              onClick={() => sendEmote(k)}
              className="rounded-xl px-2.5 py-1.5 text-[13px] font-semibold text-white/90 hover:bg-white/15"
            >
              <span className="font-['Noto_Serif_SC',serif]">{zh}</span>
              <span className="hidden sm:inline"> {vi}</span>
            </button>
          ))}
        </div>
      )}

      {scene === 0 && (
        <p className="pointer-events-none fixed bottom-0 left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-white/70 md:block">
          Đi: phím mũi tên hoặc W A S D, hoặc bấm vào sân. Đi tới cửa là vào hoặc ra phòng ngay.
        </p>
      )}
    </div>
  );
}
