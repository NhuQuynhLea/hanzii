/** Bia hồ sen (hud.js `openLotus`) — 荷塘月色, Chu Tự Thanh 1927. */
import { speak } from "@/services/tts";
import { Spk } from "../ui-bits";

const LOTUS: [string, string, string][] = [
  ["曲曲折折的荷塘上面，弥望的是田田的叶子。", "Qūqū zhézhé de hétáng shàngmian, míwàng de shì tiántián de yèzi.", "Trên mặt hồ sen quanh co uốn lượn, nhìn đâu cũng thấy lá sen xanh tròn trải rộng."],
  ["月光如流水一般，静静地泻在这一片叶子和花上。", "Yuèguāng rú liúshuǐ yìbān, jìngjìng de xiè zài zhè yí piàn yèzi hé huā shang.", "Ánh trăng như dòng nước, lặng lẽ tràn xuống khắp lá và hoa."],
];
const LOTUS_W: [string, string, string][] = [
  ["荷", "hé", "hoa sen"], ["荷塘", "hétáng", "hồ sen"], ["叶子", "yèzi", "lá"],
  ["月光", "yuèguāng", "ánh trăng"], ["流水", "liúshuǐ", "nước chảy"], ["静静地", "jìngjìng de", "lặng lẽ"],
];

export function Lotus() {
  return (
    <div className="space-y-4">
      <p className="text-[12px] text-[#8A8FA8]">
        Chu Tự Thanh viết bài tản văn này về một hồ sen trong khuôn viên đại học nơi ông dạy học. Câu văn hơi khó, cứ đọc để cảm nhận nhịp điệu tiếng Trung.
      </p>
      {LOTUS.map(([zh, py, vi], i) => (
        <section key={i} className="rounded-xl bg-[#F6F4EF] p-4">
          <div className="font-['Noto_Serif_SC',serif] text-[19px] font-semibold leading-relaxed text-[#14213D]" lang="zh-CN">
            {zh}
          </div>
          <div className="mt-1.5 text-[13px] italic text-[#A61E22]">{py}</div>
          <div className="mt-1 text-[13px] text-[#5B5A7A]">{vi}</div>
          <button type="button" onClick={() => speak(zh)} className="mt-2 rounded-lg bg-[#050349] px-3 py-1.5 text-[12px] font-bold text-white">
            🔊 Nghe câu
          </button>
        </section>
      ))}
      <section>
        <h3 className="mb-2 text-[14px] font-bold text-[#050349]">Từ đáng học</h3>
        {LOTUS_W.map(([zh, py, vi]) => (
          <div key={zh} className="mb-1.5 flex items-center justify-between rounded-lg bg-[#F6F4EF] px-3 py-2 text-[13px]">
            <span>
              <b className="mr-1.5 font-['Noto_Serif_SC',serif] text-[15px]" lang="zh-CN">
                {zh}
              </b>
              {py} – {vi}
            </span>
            <Spk zh={zh} small />
          </div>
        ))}
      </section>
    </div>
  );
}
