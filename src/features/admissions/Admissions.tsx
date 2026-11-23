/** Văn phòng tuyển sinh (nav.js `openRoom("tuvan")`) — plans + lead form. */
import { useState } from "react";
import { CAMPUS } from "@/config/campus";
import { useUi } from "@/stores/ui";
import { vnd } from "@/lib/helpers";

export function Admissions() {
  const close = useUi((s) => s.closeRoom);
  const setAcad = useUi((s) => s.setAcad);
  const setBuy = useUi((s) => s.setBuyOpen);
  const [sent, setSent] = useState(false);
  const P = CAMPUS.prices;

  const go = (h: string) => () => {
    close();
    setAcad(true); // NH.open(h) → academy view (stub page; hash ignored for now)
    void h;
  };

  const plans: [string, string, string, [string, () => void][], boolean][] = [
    [
      "Học thử", "Miễn phí",
      "Lớp Nhập môn 1 trong khuôn viên: Thử thách, Nhiệm vụ, phòng phát âm, nhà sinh hoạt. Trên website có bài học thử HSK 1.",
      [["Học thử trên website", go("hoc-thu")]], false,
    ],
    [
      "Gói tự học website", vnd(P.web) + " / tháng",
      "Mở đủ 64 bài HSK 1–4 trên website, lộ trình riêng theo ngày, ôn tập đúng lúc.",
      [
        ["Xem gói trên website", go("khoa-hoc")],
        ["Xem lộ trình", go("lo-trinh")],
      ],
      true,
    ],
    [
      "Thẻ học viên vĩnh viễn", vnd(P.campus) + ", trả một lần",
      "Mở toàn bộ khuôn viên mãi mãi: mọi lớp và bài học, thư viện, khu vui chơi, tải giáo trình chuẩn bản PDF.",
      [["Mua thẻ học viên", () => setBuy(true)]], false,
    ],
    [
      "Học với giáo viên", "Từ " + vnd(P.one) + " / buổi",
      `Học 1-1 ${vnd(P.one)}/buổi 1 tiếng, nhóm Zalo 5 bạn ${vnd(P.zalo)}/tháng, hoặc lớp trực tuyến 5 bạn.`,
      [["Xem cách học với giáo viên", go("hoc-1-1")]], false,
    ],
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-3 rounded-2xl border-2 border-[#E2B14A]/60 bg-[#FFFBEF] p-3.5">
        <span className="font-['Noto_Serif_SC',serif] text-3xl font-semibold text-[#EA0000]">网</span>
        <div>
          <small className="text-[11px] font-bold uppercase tracking-wide text-[#8A8FA8]">Cô Mai giới thiệu</small>
          <b className="block text-[15px] text-[#050349]">Website tự học NowHanzi</b>
          <p className="mt-0.5 text-[12.5px] leading-snug text-[#3D3E5C]">
            Lộ trình HSK 1–4 với 64 bài bằng tiếng Việt: học, luyện, ôn đúng lúc và dùng được ngoài đời. Học thử miễn phí, mã kích hoạt dùng chung với khuôn viên.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              ["Xem website", go(""), "bg-[#050349] text-white"],
              ["Học thử", go("hoc-thu"), "border-2 border-[#E4E5F0] text-[#3D3E5C]"],
              ["Xem các khoá", go("khoa-hoc"), "border-2 border-[#E4E5F0] text-[#3D3E5C]"],
            ].map(([t, f, c]) => (
              <button key={t as string} type="button" onClick={f as () => void} className={`rounded-xl px-3 py-1.5 text-[12.5px] font-bold ${c}`}>
                {t as string}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-[#F6F4EF] p-3.5">
        <b className="text-[13.5px] text-[#050349]">Gói nào hợp với bạn?</b>
        <ul className="mt-1.5 space-y-1 text-[13px]">
          <li className="flex justify-between gap-2">
            <span>Muốn học bài bản theo HSK 1–4</span>
            <em className="not-italic font-semibold text-[#A61E22]">Gói tự học website</em>
          </li>
          <li className="flex justify-between gap-2">
            <span>Thích học giao tiếp qua thử thách, nhiệm vụ và chơi cùng bạn</span>
            <em className="not-italic font-semibold text-[#A61E22]">Thẻ học viên vĩnh viễn</em>
          </li>
          <li className="flex justify-between gap-2">
            <span>Cần người sửa phát âm, luyện nói hoặc luyện thi</span>
            <em className="not-italic font-semibold text-[#A61E22]">Học với giáo viên</em>
          </li>
        </ul>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {plans.map(([t, pr, d, btns, hl]) => (
          <div key={t} className={`rounded-2xl border-2 p-3.5 ${hl ? "border-[#E2B14A] bg-[#FFFBEF]" : "border-[#E4E5F0] bg-white"}`}>
            <h3 className="text-[14px] font-bold text-[#050349]">{t}</h3>
            <span className="text-[13px] font-bold text-[#A61E22]">{pr}</span>
            <p className="mt-1 text-[12px] leading-snug text-[#5B5A7A]">{d}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {btns.map(([bt, fn], i) => (
                <button key={bt} type="button" onClick={fn} className={`rounded-xl px-3 py-1.5 text-[12px] font-bold ${i === 0 ? "bg-[#050349] text-white" : "border-2 border-[#E4E5F0] text-[#3D3E5C]"}`}>
                  {bt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => setBuy(true)} className="w-full rounded-xl border-2 border-[#E4E5F0] py-2 text-[13px] font-bold text-[#3D3E5C]">
        Tôi đã có mã kích hoạt
      </button>
      {CAMPUS.zalo && (
        <>
          <a href={CAMPUS.zalo} target="_blank" rel="noopener" className="block rounded-xl bg-[#EA0000] py-2.5 text-center text-[14px] font-bold text-white">
            Nhắn Fanpage trung tâm
          </a>
          <div className="text-center text-[12px] font-semibold text-[#8A8FA8]">hoặc để lại số, chúng tôi gọi lại</div>
        </>
      )}
      <form
        className="space-y-2 rounded-xl border border-[#E4E5F0] p-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
      >
        <label htmlFor="lName" className="block text-[12px] font-bold text-[#050349]">
          Họ tên
        </label>
        <input id="lName" maxLength={60} required autoComplete="name" className="w-full rounded-lg border-2 border-[#E4E5F0] px-3 py-1.5 text-[14px]" />
        <label htmlFor="lPhone" className="block text-[12px] font-bold text-[#050349]">
          Số điện thoại
        </label>
        <input id="lPhone" type="tel" maxLength={20} required autoComplete="tel" className="w-full rounded-lg border-2 border-[#E4E5F0] px-3 py-1.5 text-[14px]" />
        <label htmlFor="lNote" className="block text-[12px] font-bold text-[#050349]">
          Mục tiêu học (không bắt buộc)
        </label>
        <input id="lNote" maxLength={150} placeholder="Ví dụ: thi HSK 3, đi làm, du học" className="w-full rounded-lg border-2 border-[#E4E5F0] px-3 py-1.5 text-[14px]" />
        <button type="submit" className="w-full rounded-xl bg-[#050349] py-2 text-[14px] font-bold text-white">
          Gửi thông tin
        </button>
        {sent && <p className="text-[12px] text-[#5B5A7A]">Đây là bản demo nên thông tin chưa được gửi đi. Bản chạy trên Render sẽ lưu vào Google Sheet.</p>}
      </form>
    </div>
  );
}
