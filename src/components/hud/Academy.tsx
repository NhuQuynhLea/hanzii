/**
 * Academy stub — the original embeds web/index.html (a separate site, source
 * unavailable). Renders the 48-lesson list from NH_LESSONS until the real
 * academy site is rebuilt.
 */
import { useUi } from "@/stores/ui";
import { NH_LESSONS } from "@/data/nh-lessons";
import { callHook } from "@/services/hooks";
import { LVN } from "@/game/world/geometry";

export function Academy() {
  const open = useUi((s) => s.acadOpen);
  const setAcad = useUi((s) => s.setAcad);
  if (!open) return null;

  return (
    <section className="fixed inset-0 z-50 flex flex-col bg-[#F6F4EF]" aria-label="Website NowHanzi">
      <div className="flex items-center gap-3 border-b border-[#E4E5F0] bg-[#050349] px-4 py-2.5 text-white">
        <button type="button" onClick={() => setAcad(false)} className="rounded-lg px-2 py-1 text-[13px] font-semibold hover:bg-white/15">
          ← Quay lại
        </button>
        <b className="text-[14px]">Website NowHanzi – {NH_LESSONS.length} bài</b>
        <button
          type="button"
          onClick={() => callHook("buyWeb")}
          className="ml-auto rounded-full bg-[#E2B14A] px-3 py-1 text-[12px] font-bold text-[#050349]"
        >
          🔓 Mở khoá toàn bộ
        </button>
      </div>
      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto p-5">
        <p className="mb-4 rounded-xl border border-[#E4E5F0] bg-white p-3 text-[13px] text-[#5C5E80]">
          Website lộ trình đang được xây dựng lại. Danh sách bài học lấy từ dữ liệu NowHanzi hiện có.
        </p>
        <div className="grid gap-2">
          {NH_LESSONS.map((L, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-[#E4E5F0] bg-white px-4 py-2.5">
              <span className="font-['Noto_Serif_SC',serif] w-8 text-center text-lg text-[#EA0000]">{L.n}</span>
              <div className="flex-1">
                <b className="text-[14px] text-[#050349]">
                  {LVN(L.lv)} · {L.zh}
                </b>
                <p className="text-[12px] text-[#5C5E80]">{L.vi}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
