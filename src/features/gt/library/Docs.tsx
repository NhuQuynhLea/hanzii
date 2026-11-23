/**
 * ⬇ Tài liệu — textbooks, free PDFs and external links (lib.js `libDocs`).
 */
import { useEffect, useState, type ReactNode } from "react";
import { permActive, onEntChange } from "@/services/entitlement";
import { callHook } from "@/services/hooks";
import { LIB_DOCS, libU, libDownload } from "./data";

function DocRow({ icon, off, children, action }: { icon: string; off?: boolean; children: ReactNode; action: ReactNode }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border border-[#E4E5F0] bg-white px-3 py-2 ${off ? "opacity-60" : ""}`}>
      <span className="text-xl">{icon}</span>
      <div className="min-w-0 flex-1 text-left">{children}</div>
      {action}
    </div>
  );
}

const openBtn =
  "shrink-0 rounded-full border-2 border-[#050349] px-3 py-1 text-[12px] font-bold text-[#050349] transition hover:bg-[#050349] hover:text-white";

export function LibDocs() {
  const [, setTick] = useState(0);
  // original: NH.onChange re-rendered the open docs panel on entitlement change
  useEffect(() => onEntChange(() => setTick((t) => t + 1)), []);
  const perm = permActive();
  const fb = callHook<ReactNode>("fbLine", "sgk-khoa");
  const buy = () => callHook("openBuy");

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="text-[14px] font-bold text-[#050349]">Sách giáo khoa chuẩn – 汉语口语速成</h3>
        <p className="mb-2 text-[12px] text-[#5B5A7A]">
          Bản PDF (bản thứ ba, chú thích tiếng Anh). Học viên có Thẻ học viên vĩnh viễn mở file trên Drive rồi bấm ⬇ để tải.
        </p>
        {!perm ? (
          <div className="mb-2 rounded-xl border border-dashed border-[#E2B14A] bg-[#FFFBF0] p-3">
            <b className="text-[13px] text-[#050349]">🔒 Dành cho học viên có Thẻ học viên vĩnh viễn</b>
            <p className="mt-0.5 text-[12px] text-[#5B5A7A]">
              Mua một lần, tải cả 4 quyển và dùng mãi mãi. Đã có mã kích hoạt? Bấm nút bên dưới để nhập mã.
            </p>
            <button type="button" onClick={buy} className="mt-2 rounded-xl bg-[#EA0000] px-4 py-2 text-[13px] font-bold text-white">
              Mua bản vĩnh viễn – nhập mã
            </button>
            {fb ?? null}
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          {LIB_DOCS.book.map(([q, zh, sub, url]) => (
            <DocRow key={q} icon={perm ? "📕" : "🔒"} off={!perm}
              action={
                perm ? (
                  <a href={libU(url)} target="_blank" rel="noopener" className={openBtn}>
                    📕 Mở PDF ↗
                  </a>
                ) : (
                  <button type="button" onClick={buy} className={openBtn}>
                    🔒 Mở khoá
                  </button>
                )
              }
            >
              <b className="text-[13px] text-[#14213D]">{q} – </b>
              <span className="font-['Noto_Serif_SC',serif] text-[14px] italic text-[#14213D]" lang="zh-CN">
                {zh}
              </span>
              <small className="block text-[11px] text-[#8A8FA8]">{sub}</small>
            </DocRow>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[14px] font-bold text-[#050349]">Tài liệu miễn phí của NowHanzi</h3>
        <p className="mb-2 text-[12px] text-[#5B5A7A]">Do NowHanzi biên soạn, tải về và in thoải mái.</p>
        <div className="flex flex-col gap-2">
          {LIB_DOCS.free.map(([t, sub, path, fn]) => (
            <DocRow key={fn} icon="📄"
              action={
                <button type="button" onClick={() => libDownload(path, fn, t)} className="shrink-0 rounded-xl bg-[#EA0000] px-3 py-1.5 text-[12px] font-bold text-white">
                  ⬇ Tải PDF
                </button>
              }
            >
              <b className="text-[13px] text-[#14213D]">{t}</b>
              <small className="block text-[11px] text-[#8A8FA8]">{sub}</small>
            </DocRow>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[14px] font-bold text-[#050349]">Tham khảo thêm (trang ngoài, miễn phí)</h3>
        <p className="mb-2 text-[12px] text-[#5B5A7A]">Mở trong tab mới.</p>
        <div className="flex flex-col gap-2">
          {LIB_DOCS.web.map(([t, sub, url]) => (
            <DocRow key={url} icon="🌐"
              action={
                <a href={url} target="_blank" rel="noopener" className={openBtn}>
                  Mở ↗
                </a>
              }
            >
              <b className="text-[13px] text-[#14213D]">{t}</b>
              <small className="block text-[11px] text-[#8A8FA8]">{sub}</small>
            </DocRow>
          ))}
        </div>
      </section>
    </div>
  );
}
