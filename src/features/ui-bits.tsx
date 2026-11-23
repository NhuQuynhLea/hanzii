/**
 * Shared feature-UI atoms (ui.js `hzBtn`/`hzSpan`/`wordRow`/`pyOf`).
 * Hanzi + pinyin stacked labels, speaker buttons, word list rows.
 */
import type { CSSProperties } from "react";
import type { Word } from "@/types/lesson";
import { LEVELS } from "@/data/curriculum";
import { speak } from "@/services/tts";
import { useUi } from "@/stores/ui";
import { callHook } from "@/services/hooks";

const PY_EXTRA: Record<string, string> = {
  学生: "xuésheng", 去: "qù", 北京: "Běijīng", 他: "tā", 老师: "lǎoshī", 在: "zài", 吃饭: "chīfàn",
  中国人: "Zhōngguó rén", 吗: "ma", 很: "hěn", 买了: "mǎi le", 一本: "yì běn", 书: "shū", 去过: "qùguo",
  比: "bǐ", 冷: "lěng", 说得: "shuō de", 很好: "hěn hǎo", 正在: "zhèngzài", 看书: "kàn shū", 呢: "ne",
  因为: "yīnwèi", 下雨: "xià yǔ", 所以: "suǒyǐ", 没: "méi", 把: "bǎ", 门: "mén", 关上: "guān shang",
  做完: "zuò wán", 了: "le", 天气: "tiānqì", 越来越: "yuè lái yuè", 如果: "rúguǒ", 就: "jiù",
  不去了: "bú qù le", 到家: "dào jiā", 给你: "gěi nǐ", 打电话: "dǎ diànhuà", 我的: "wǒ de", 手机: "shǒujī",
  被: "bèi", 拿走了: "ná zǒu le", 我们: "wǒmen", 女: "nǚ", 子: "zǐ", 日: "rì", 木: "mù", 亻: "rén",
  马: "mǎ", 口: "kǒu", 尔: "ěr", 田: "tián", 力: "lì", 宀: "mián", 氵: "shuǐ", 工: "gōng",
  相: "xiàng", 心: "xīn", 土: "tǔ", 火: "huǒ",
};

let PYMAP: Record<string, string> | null = null;
export function pyOf(t: string): string {
  if (!PYMAP) {
    PYMAP = { ...PY_EXTRA };
    for (const l in LEVELS) LEVELS[l].forEach((w) => {
      if (!PYMAP![w[0]]) PYMAP![w[0]] = w[1];
    });
  }
  if (PYMAP[t]) return PYMAP[t];
  const out: string[] = [];
  for (const ch of t) {
    if (PYMAP[ch]) out.push(PYMAP[ch]);
    else if (/[一-鿿]/.test(ch)) return "";
  }
  return out.join(" ");
}

/** Hanzi + pinyin stacked (hzwrap). */
export function Hz({ t, py, className = "", style }: { t: string; py?: string; className?: string; style?: CSSProperties }) {
  return (
    <span className={`inline-flex flex-col items-center font-['Noto_Serif_SC',serif] ${className}`} style={style} lang="zh-CN">
      <span className="leading-[1.15]">{t}</span>
      {(py ?? pyOf(t)) ? <span className="mt-[3px] whitespace-nowrap font-['Be_Vietnam_Pro',sans-serif] text-[13px] font-medium leading-[1.2] text-[#5B5A7A]">{py ?? pyOf(t)}</span> : null}
    </span>
  );
}

/** Hanzi button with pinyin caption (hzBtn). */
export function HzButton({
  t, py, onClick, disabled, className = "", ...rest
}: { t: string; py?: string; onClick?: () => void; disabled?: boolean; className?: string } & Record<string, unknown>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center rounded-xl border-2 border-[#E4E5F0] bg-white px-3 py-2 font-['Noto_Serif_SC',serif] text-lg font-semibold text-[#14213D] transition enabled:hover:border-[#EA0000] disabled:opacity-60 ${className}`}
      {...rest}
    >
      <span className="leading-[1.15]">{t}</span>
      {(py ?? pyOf(t)) ? <span className="mt-[2px] font-['Be_Vietnam_Pro',sans-serif] text-[11px] font-medium text-[#5B5A7A]">{py ?? pyOf(t)}</span> : null}
    </button>
  );
}

/** Speaker button (spk). */
export function Spk({ zh, small, onPlay }: { zh: string; small?: boolean; onPlay?: (zh: string) => void }) {
  return (
    <button
      type="button"
      aria-label={"Nghe " + zh}
      onClick={(e) => {
        e.stopPropagation();
        speak(zh);
        if (onPlay) onPlay(zh);
      }}
      className={`grid shrink-0 place-items-center rounded-full border border-[#E4E5F0] bg-white transition hover:bg-[#FFF3EC] ${small ? "h-7 w-7 text-[13px]" : "h-9 w-9 text-[15px]"}`}
    >
      🔊
    </button>
  );
}

/** Word list row (wordRow): hanzi+pinyin | meaning | speaker. */
export function WordRow({ w, onPlay }: { w: Word; onPlay?: (zh: string) => void }) {
  const [zh, py, vi] = w;
  return (
    <li className="flex items-center gap-3 border-b border-[#EFF1F8] py-1.5 last:border-0">
      <Hz t={zh} py={py} className="min-w-[72px] text-[20px]" />
      <span className="flex-1 text-[14px] text-[#3D3E5C]">{vi}</span>
      <Spk zh={zh} small onPlay={onPlay} />
    </li>
  );
}

/** Section header row (secth). */
export function SectH({ title, tag, ok }: { title: string; tag?: string; ok?: boolean }) {
  return (
    <div className="mb-2 mt-4 flex items-center justify-between">
      <h3 className="text-[15px] font-bold text-[#050349]">{title}</h3>
      {tag ? <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ok ? "bg-[#F0F7F1] text-[#2E7D4F]" : "bg-[#EFF1F8] text-[#5B5A7A]"}`}>{tag}</span> : null}
    </div>
  );
}

/** Tab strip (tabs). */
export function Tabs({ tabs, active, onPick }: { tabs: [string, string][]; active: string; onPick: (k: string) => void }) {
  return (
    <div className="mb-3 flex gap-1.5 border-b border-[#E4E5F0] pb-2" role="tablist">
      {tabs.map(([k, t]) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={k === active}
          onClick={() => onPick(k)}
          className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${k === active ? "bg-[#050349] text-white" : "text-[#5B5A7A] hover:bg-[#EFF1F8]"}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/** Level chip row (chips). */
export function ChipRow({ items, active, onPick }: { items: [string, string][]; active: string; onPick: (k: string) => void }) {
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {items.map(([k, t]) => (
        <button
          key={k}
          type="button"
          onClick={() => onPick(k)}
          className={`rounded-full border-2 px-3 py-1 text-[12px] font-bold ${k === active ? "border-[#050349] bg-[#050349] text-white" : "border-[#E4E5F0] bg-white text-[#3D3E5C]"}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/** Result summary (resultBox/mypts). */
export function ResultBox({ big, small, onAgain, onBoard }: { big: string; small: string; onAgain?: () => void; onBoard?: () => void }) {
  return (
    <>
      <div className="my-4 rounded-2xl bg-[#050349] p-5 text-center text-white">
        <b className="block font-['Noto_Serif_SC',serif] text-3xl">{big}</b>
        <span className="text-[13px] text-white/75">{small}</span>
      </div>
      <div className="flex gap-2">
        {onAgain ? (
          <button type="button" onClick={onAgain} className="flex-1 rounded-xl border-2 border-[#E4E5F0] py-2 text-[14px] font-semibold text-[#3D3E5C] hover:border-[#050349]">
            Chơi lại
          </button>
        ) : null}
        {onBoard ? (
          <button type="button" onClick={onBoard} className="flex-1 rounded-xl border-2 border-[#E4E5F0] py-2 text-[14px] font-semibold text-[#3D3E5C] hover:border-[#050349]">
            Bảng thành tích
          </button>
        ) : null}
      </div>
    </>
  );
}

/** Pay-buttons row (payButtons). */
export function PayButtons({ onDark }: { onDark?: boolean }) {
  const openAcad = () => useUi.getState().setAcad(true);
  const openBuy = () => callHook("openBuy");
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={openAcad} className={`rounded-xl px-4 py-2 text-[13px] font-bold ${onDark ? "bg-white text-[#050349]" : "bg-[#EA0000] text-white"}`}>
        Học tiếp lộ trình 48 bài
      </button>
      <button type="button" onClick={openBuy} className={`rounded-xl border-2 px-4 py-2 text-[13px] font-bold ${onDark ? "border-white/60 text-white" : "border-[#050349] text-[#050349]"}`}>
        Xem các gói học
      </button>
    </div>
  );
}
