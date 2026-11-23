/**
 * Tappable hanzi line + glossary popover — React port of missions.js
 * `msLine` (token buttons) and `msPop` (fixed floating gloss card).
 * Exported for reuse (roleplay.js used msLine too).
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { speak } from "@/services/tts";
import { msGl, msTok } from "./core";

interface Pop {
  w: string;
  py: string;
  vi: string;
  cx: number; // anchor center-x
  y: number; // top
}

/** Hanzi line where each dictionary token is tappable for its gloss. */
export function MsLine({ zh, onTap }: { zh: string; onTap?: () => void }) {
  const [pop, setPop] = useState<Pop | null>(null);
  const [left, setLeft] = useState(0);
  const popRef = useRef<HTMLDivElement>(null);

  // close on outside pointerdown (msPop)
  useEffect(() => {
    if (!pop) return;
    const f = (e: PointerEvent) => {
      if (!popRef.current?.contains(e.target as Node)) setPop(null);
    };
    const t = window.setTimeout(() => document.addEventListener("pointerdown", f), 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("pointerdown", f);
    };
  }, [pop]);

  // clamp the popover horizontally like the original (max(8, innerWidth-pw-8))
  useLayoutEffect(() => {
    if (!pop || !popRef.current) return;
    const pw = popRef.current.offsetWidth;
    const x = Math.max(8 + pw / 2, Math.min(window.innerWidth - pw / 2 - 8, pop.cx));
    setLeft(x - pw / 2);
  }, [pop]);

  const open = (anchor: HTMLElement, w: string) => {
    const g = msGl(w);
    if (!g) return;
    speak(w);
    const r = anchor.getBoundingClientRect();
    setPop({ w, py: g[0], vi: g[1], cx: r.left + r.width / 2, y: r.bottom + 6 });
    onTap?.();
  };

  return (
    <span className="font-['Noto_Serif_SC',serif] text-[22px] leading-[1.5]" lang="zh-CN">
      {msTok(zh).map(([w, c], i) =>
        c ? (
          <button
            key={i}
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              open(ev.currentTarget, w);
            }}
            className="ms-t border-0 border-b-2 border-dotted border-b-black/40 bg-transparent p-0 px-px font-[inherit] text-inherit hover:bg-[#1CB0F6]/10"
          >
            {w}
          </button>
        ) : (
          <span key={i}>{w}</span>
        ),
      )}
      {pop &&
        createPortal(
          <div
            ref={popRef}
            className="fixed z-[9999] flex max-w-[240px] flex-col items-center gap-0.5 rounded-xl bg-[#1C1A6B] px-3.5 py-2 text-center text-[14px] text-[#FFF8EC] shadow-[0_6px_20px_rgba(0,0,0,.25)]"
            style={{ left, top: pop.y }}
          >
            <b className="font-['Noto_Serif_SC',serif] text-[24px] font-normal" lang="zh-CN">
              {pop.w}
            </b>
            <span className="text-[#E2B14A]">{pop.py}</span>
            <span>{pop.vi}</span>
          </div>,
          document.body,
        )}
    </span>
  );
}
