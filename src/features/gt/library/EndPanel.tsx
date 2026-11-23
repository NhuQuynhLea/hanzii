/**
 * End-of-review summary (lib.js `libEnd` body: duo-w duo-end).
 */
import type { WmBuckets } from "@/stores/wm";
import { useUi } from "@/stores/ui";

export function LibEndPanel({
  acc,
  sec,
  title,
  buckets,
  onAgain,
}: {
  acc: number;
  sec: number;
  title: string;
  buckets: WmBuckets;
  onAgain: () => void;
}) {
  const mm = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  return (
    <div className="text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#050349] font-['Noto_Serif_SC',serif] text-3xl font-semibold text-[#E2B14A]">
        {acc >= 90 ? "好" : "练"}
      </div>
      <h3 className="mt-2 text-[16px] font-bold text-[#050349]">Xong – {title}</h3>
      <div className="mx-auto mt-3 grid max-w-[300px] grid-cols-2 gap-2">
        {[
          [`${acc}%`, "Chính xác"],
          [mm, "Thời gian"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-xl border border-[#E4E5F0] px-3 py-2">
            <small className="block text-[11px] font-semibold uppercase tracking-wide text-[#8A8FA8]">{l}</small>
            <b className="text-[17px] text-[#14213D]">{v}</b>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-[#5B5A7A]">
        🗂 Mới gặp {buckets.moi.length} – Đang nhớ {buckets.nho.length} – Đã thuộc {buckets.thuoc.length}
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => useUi.getState().closeRoom()}
          className="flex-1 rounded-xl border-2 border-[#E4E5F0] py-2 text-[14px] font-semibold text-[#3D3E5C] hover:border-[#050349]"
        >
          Về thư viện
        </button>
        <button
          type="button"
          autoFocus
          onClick={onAgain}
          className="flex-1 rounded-xl bg-[#EA0000] py-2 text-[14px] font-bold text-white hover:bg-[#C8102E]"
        >
          Ôn tiếp →
        </button>
      </div>
    </div>
  );
}
