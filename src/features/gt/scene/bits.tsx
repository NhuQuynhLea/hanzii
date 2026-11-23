/**
 * Shared GT UI atoms — gt-core.js `gtHzBtn` (hanzi + pinyin + optional note,
 * speaks on click) and the duo tile/`hzP` wrappers.
 */
import type { CSSProperties, ReactNode } from "react";
import { speak } from "@/services/tts";

/** gt-core.js `gtHzBtn(zh,py,extra)`. */
export function GtHzButton({
  zh,
  py,
  extra,
  className = "",
  style,
}: {
  zh: string;
  py?: string;
  extra?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={() => speak(zh.replace(/[，。！？]/g, " "))}
      className={`flex flex-col items-center rounded-xl border-2 border-[#E3E6EF] bg-white px-3 py-1.5 ${className}`}
      style={style}
    >
      <span className="font-['Noto_Serif_SC',serif] text-[20px] leading-[1.2] text-[#14163A]" lang="zh-CN">
        {zh}
      </span>
      {py ? <span className="text-[12.5px] text-[#6B7085]">{py}</span> : null}
      {extra ? <span className="text-[12px] font-bold text-[#EA0000]">{extra}</span> : null}
    </button>
  );
}

/** duo.js `hzP(t,cls)` — hanzi with small pinyin caption. */
export function HzP({
  t,
  py,
  className = "",
  align = "center",
}: {
  t: string;
  py?: string;
  className?: string;
  align?: "center" | "start";
}) {
  return (
    <span className={`inline-flex flex-col leading-[1.15] ${align === "center" ? "items-center" : "items-start"} ${className}`}>
      <span className="font-['Noto_Serif_SC',serif]" lang="zh-CN">
        {t}
      </span>
      {py ? <span className="mt-[2px] text-[12px] font-medium leading-[1.2] text-[#6B7085]">{py}</span> : null}
    </span>
  );
}

/** duo.js `duoTileEl(z)` — tile button (py resolved by caller via gtPy). */
export function DuoTile({
  z,
  py,
  children,
  ...rest
}: {
  z?: string;
  py?: string;
  children?: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex min-h-[48px] flex-col items-center justify-center rounded-xl border-2 border-[#E3E6EF] bg-white px-3.5 py-1.5 text-[15px] text-[#14163A] transition disabled:opacity-50 ${rest.className || ""}`}
    >
      {children ?? (
        <>
          <span className="font-['Noto_Serif_SC',serif] text-[20px] leading-[1.15]" lang="zh-CN">
            {z}
          </span>
          {py ? <span className="mt-[1px] text-[11px] text-[#6B7085]">{py}</span> : null}
        </>
      )}
    </button>
  );
}
