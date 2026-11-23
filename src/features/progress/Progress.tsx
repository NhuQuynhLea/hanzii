/** Tiến độ học dialog (hud.js `openProgress`). */
import { progData } from "@/components/hud/ProgressPill";
import { LVN } from "@/game/world/geometry";
import { callHook } from "@/services/hooks";
import { useUi } from "@/stores/ui";

export function Progress() {
  const d = progData();
  const close = useUi((s) => s.closeRoom);
  const pct = (k: string) => {
    const a = d.acc[k];
    return a && a[1] ? `${Math.round((a[0] / a[1]) * 100)}% đúng – ${a[1]} câu` : null;
  };

  const Go = ({ t, f }: { t: string; f: () => void }) => (
    <button type="button" onClick={f} className="shrink-0 rounded-lg bg-[#050349] px-2.5 py-1 text-[12px] font-bold text-white">
      {t}
    </button>
  );

  return (
    <div className="space-y-4">
      <section>
        <h3 className="mb-2 text-[14px] font-bold text-[#050349]">Từ vựng đã học xong</h3>
        {[1, 2, 3].map((l) => {
          const x = d.lv[l];
          return (
            <div key={l} className="mb-1.5 flex items-center gap-3 text-[13px]">
              <span className="w-20 font-semibold text-[#3D3E5C]">{LVN(l)}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EFF1F8]">
                <i className="block h-full bg-[#EA0000]" style={{ width: `${x.total ? (x.done / x.total) * 100 : 0}%` }} />
              </span>
              <b className="w-12 text-right">
                {x.done}/{x.total}
              </b>
            </div>
          );
        })}
        <div className="mt-2 flex items-center justify-between rounded-lg bg-[#F6F4EF] px-3 py-2 text-[13px]">
          <span>
            Nhớ chắc (ôn đúng, lịch ôn từ 7 ngày): <b>{d.strong} từ</b>
          </span>
          <Go
            t="Học tiếp"
            f={() => {
              close();
              callHook("nvTasksGo", "learn");
            }}
          />
        </div>
      </section>
      <section>
        <h3 className="mb-2 text-[14px] font-bold text-[#050349]">Kỹ năng</h3>
        {(
          [
            ["Chữ Hán", d.chars ? `Đã tự viết ${d.chars} chữ` : null, "Viết ở bước 4 của bài học", null] as const,
            ["Nghe thanh điệu", pct("tone"), "Chưa có kết quả", ["Luyện nghe", () => callHook("openGame", "g4")] as const],
            ["Xếp câu", pct("order"), "Chưa có kết quả", ["Luyện xếp câu", () => callHook("openGame", "g3")] as const],
            ["Nói", d.speak ? `Đã luyện ${d.speak} lần` : null, "Ghi âm ở bước 5 của bài học", null],
          ] as const
        ).map(([t, v, empty, btn]) => (
          <div key={t} className="mb-1.5 flex items-center justify-between rounded-lg bg-[#F6F4EF] px-3 py-2 text-[13px]">
            <span>
              <b className="mr-1">{t}</b>
              {v || <small className="text-[#8A8FA8]">{empty}</small>}
            </span>
            {btn ? <Go t={btn[0]} f={btn[1]} /> : null}
          </div>
        ))}
        <p className="mt-1 text-[11px] text-[#8A8FA8]">Phần Nói chỉ đếm số lần luyện, chưa chấm điểm phát âm.</p>
      </section>
      {d.web && (
        <section>
          <h3 className="mb-2 text-[14px] font-bold text-[#050349]">Lộ trình 48 bài</h3>
          <div className="flex items-center justify-between rounded-lg bg-[#F6F4EF] px-3 py-2 text-[13px]">
            <span>
              Đã xong {d.web.done}/{d.web.total} bài
            </span>
            <Go
              t="Mở lộ trình"
              f={() => {
                close();
                useUi.getState().setAcad(true);
              }}
            />
          </div>
        </section>
      )}
      <p className="text-[11px] text-[#8A8FA8]">
        Tiến độ cho biết bạn đã học được gì trong lộ trình NowHanzi. Để biết mình có đạt chuẩn thi HSK không, hãy làm đề thi thử.
      </p>
    </div>
  );
}
