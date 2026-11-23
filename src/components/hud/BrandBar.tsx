/** Top-left brand bar — logo, name, online status, points + academy buttons. */
import { usePresence } from "@/stores/presence";
import { usePlayer } from "@/stores/player";
import { callHook } from "@/services/hooks";
import { GmButton } from "@/features/gm";
import { asset } from "@/lib/utils";

export function BrandBar() {
  const online = usePresence((s) => s.online);
  const live = usePresence((s) => s.live);
  const points = usePlayer((s) => s.points);
  const entered = usePlayer((s) => s.entered);
  if (!entered) return null;

  return (
    <div className="fixed left-3 top-3 z-40 flex items-center gap-2.5 rounded-2xl bg-[#050349]/90 py-1.5 pl-2 pr-3 text-white shadow-lg">
      <img src={asset("assets/logo.png")} alt="" className="h-9 w-9" />
      <div className="leading-tight">
        <img src={asset("assets/word-light.png")} alt="NowHanzi" className="h-5" />
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-white/80">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: live ? "#4ADE80" : "#9CA3AF", boxShadow: live ? "0 0 6px #4ADE80" : "none" }}
          />
          {online}
        </div>
      </div>
      <GmButton />
      <button
        type="button"
        onClick={() => callHook("openBoard")}
        aria-label="Xem bảng điểm"
        className="ml-2 flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[13px] font-bold hover:bg-white/25"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        {points}
      </button>
      <button
        type="button"
        onClick={() => callHook("openAcademy")}
        aria-label="Mở lộ trình 48 bài"
        className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[13px] font-bold hover:bg-white/25"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
        <span className="hidden sm:inline">48 bài</span>
      </button>
      <button
        type="button"
        onClick={() => callHook("fbOpen", "thanh-tren")}
        aria-label="Nhắn Fanpage NowHanzi"
        title="Nhắn Fanpage NowHanzi – tư vấn 1-1 miễn phí"
        className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[13px] font-bold hover:bg-white/25"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4.5 3.5v-3.5h0a2 2 0 0 1-2-2z" />
        </svg>
        <span className="hidden sm:inline">Nhắn trung tâm</span>
      </button>
    </div>
  );
}
