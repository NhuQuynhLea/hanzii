/**
 * 🗂 Từ của tôi — SRS bucket shelf (lib.js `libMyWords`).
 */
import { useMemo } from "react";
import { useWm } from "@/stores/wm";
import { useUi } from "@/stores/ui";
import { callHook } from "@/services/hooks";
import { speak } from "@/services/tts";
import { Hz } from "@/features/ui-bits";
import { gtDict } from "./data";
import { libReview } from "./flow";

const BUCKETS: [key: "moi" | "nho" | "thuoc", label: string, color: string][] = [
  ["moi", "Mới gặp", "#C8102E"],
  ["nho", "Đang nhớ", "#1C1A6B"],
  ["thuoc", "Đã thuộc", "#0F766E"],
];

export function LibMyWords() {
  const map = useWm((s) => s.map);
  // buckets() applies decay and may save; recompute whenever the map changes.
  const B = useMemo(() => useWm.getState().buckets(), [map]);
  const dict = gtDict();
  const all = B.moi.length + B.nho.length + B.thuoc.length;

  if (!all)
    return (
      <div>
        <p className="text-[13px] text-[#5B5A7A]">
          Chưa có từ nào. Học Thử thách đầu tiên ở lớp, từ mới sẽ tự xếp lên kệ này.
        </p>
        <button
          type="button"
          className="mt-3 rounded-xl bg-[#EA0000] px-4 py-2 text-[13px] font-bold text-white"
          onClick={() => {
            useUi.getState().closeRoom();
            setTimeout(() => callHook("openLesson"), 60);
          }}
        >
          ▶ Lên lớp học
        </button>
      </div>
    );

  return (
    <div>
      {B.sai.length ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#F3C3C3] bg-[#FDECEC] px-3 py-2">
          <b className="text-[13px] text-[#A61E22]">❌ {B.sai.length} từ hay sai</b>
          <span className="min-w-0 flex-1 truncate text-[12px] text-[#5B5A7A]">{B.sai.slice(0, 8).join(" – ")}</span>
          <button
            type="button"
            onClick={() => libReview(B.sai, "Từ hay sai", "sai")}
            className="shrink-0 rounded-xl bg-[#EA0000] px-3 py-1.5 text-[12px] font-bold text-white"
          >
            Ôn ngay
          </button>
        </div>
      ) : null}
      <div className="flex flex-col gap-3">
        {BUCKETS.map(([k, t, c]) => {
          const arr = B[k];
          return (
            <div key={k} className="rounded-xl border border-[#E4E5F0] bg-white p-3" style={{ borderTop: `3px solid ${c}` }}>
              <div className="mb-2 text-[13px] font-bold" style={{ color: c }}>
                {t} – {arr.length}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {arr.slice(0, 30).map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => speak(z)}
                    className="rounded-lg border border-[#E4E5F0] px-2 py-1 transition hover:border-[#EA0000]"
                  >
                    <Hz t={z} py={dict.get(z)?.[0]} className="text-[15px]" />
                  </button>
                ))}
                {arr.length > 30 ? <span className="self-center text-[12px] text-[#8A8FA8]">+{arr.length - 30}</span> : null}
              </div>
              <button
                type="button"
                disabled={!arr.length}
                onClick={() => libReview(arr, t, k)}
                className="mt-2 rounded-full border-2 border-[#050349] px-3 py-1 text-[12px] font-bold text-[#050349] transition enabled:hover:bg-[#050349] enabled:hover:text-white disabled:opacity-40"
              >
                Ôn {Math.min(6, arr.length)} từ
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
