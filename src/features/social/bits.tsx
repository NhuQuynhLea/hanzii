/**
 * Small shared UI bits for social features — NhIcon (icons.js/nh-icons.js
 * subset actually used by community/cdq/roleplay/fb), DuoTile (duoTileEl),
 * MsLine/MsPop (msLine/msPop glossary tokens), nhFx/nhBurst/gtConfetti fx.
 */
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { gtPy, msTok, msGl } from "./gt-share";
import { speak } from "@/services/tts";

/* ---------- icons.js `nhIcon` (nhỏ gọn, chỉ icon social dùng) ---------- */
export const NH_ICONS: Record<string, string> = {
  group: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c0-3.2 2.5-5.6 5.5-5.6s5.5 2.4 5.5 5.6"/><circle cx="16.5" cy="9" r="2.6"/><path d="M15.4 13.6c3 .1 5.1 2.3 5.1 5.4"/>',
  free: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/>',
  quiz: '<path d="M12 3.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"/>',
  match: '<rect x="3.5" y="4" width="7" height="7" rx="2"/><rect x="13.5" y="13" width="7" height="7" rx="2"/><path d="M10.5 7.5h3a3 3 0 0 1 3 3v2.5"/><path d="M14.8 11.2l1.7 1.8 1.7-1.8"/>',
  tone: '<path d="M3 15c2.2 0 2.2-6 4.5-6S9.8 18 12 18s2.3-12 4.5-12S18.8 15 21 15"/>',
  star: '<path d="M12 3.5l2.5 5.1 5.6.8-4 3.9 1 5.6L12 16.3 7 18.9l.9-5.6-4-3.9 5.6-.8z"/>',
  chat: '<path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4.5 3.5v-3.5h0a2 2 0 0 1-2-2z"/>',
  gift: '<rect x="4" y="9" width="16" height="4" rx="1"/><path d="M5.5 13v7h13v-7"/><path d="M12 9v11"/><path d="M12 9C9 9 7.5 7.8 7.5 6.3S9 4 10 4.7 12 9 12 9zm0 0c3 0 4.5-1.2 4.5-2.7S15 4 14 4.7 12 9 12 9z"/>',
};

export const NH_ICON_COLOR: Record<string, string> = {
  red: "text-[#EA0000]",
  navy: "text-[#050349]",
  jade: "text-[#2E7D4F]",
  gold: "text-[#E2B14A]",
  on: "text-[#E2B14A]",
  "": "text-[#5B5A7A]",
};

export function NhIcon({ k, cls = "", size = 26 }: { k: string; cls?: string; size?: number }) {
  return (
    <span className={`inline-flex shrink-0 ${NH_ICON_COLOR[cls] ?? cls ?? ""}`} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: NH_ICONS[k] || "" }}
      />
    </span>
  );
}

/* ---------- duo.js `duoTileEl` — nút chữ Hán + pinyin ---------- */
export function DuoTile({
  z,
  onClick,
  disabled,
  selected,
  done,
  bad,
  className = "",
}: {
  z: string;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  done?: boolean;
  bad?: boolean;
  className?: string;
}) {
  const p = gtPy(z);
  return (
    <button
      type="button"
      data-z={z}
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-col items-center rounded-xl border-2 px-2.5 py-1.5 transition ${
        done
          ? "border-transparent bg-[#F0F7F1] text-[#2E7D4F] opacity-60"
          : bad
            ? "border-[#C8102E] bg-[#FFF3EC]"
            : selected
              ? "border-[#EA0000] bg-[#FFF3EC]"
              : "border-[#E4E5F0] bg-white enabled:hover:border-[#EA0000]"
      } disabled:opacity-60 ${className}`}
    >
      <span className="font-['Noto_Serif_SC',serif] text-[17px] font-semibold leading-[1.2] text-[#14213D]">{z}</span>
      {p ? <small className="mt-[1px] text-[10.5px] font-medium text-[#8A8FA8]">{p}</small> : null}
    </button>
  );
}

/* ---------- missions.js `msLine`/`msPop` — chữ bấm tra nghĩa ---------- */
export interface MsPopState {
  w: string;
  g: [string, string];
  x: number;
  y: number;
}

/** Tokenised Chinese line; `onPop(w, anchor)` shows a gloss popup. */
export function MsLine({ zh, onPop }: { zh: string; onPop?: (w: string, e: MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <span className="font-['Noto_Serif_SC',serif]">
      {msTok(zh).map(([w, c], i) =>
        !c ? (
          <span key={i}>{w}</span>
        ) : (
          <button
            key={i}
            type="button"
            className="rounded px-[1px] font-semibold text-[#14213D] underline decoration-[#E2B14A] decoration-2 underline-offset-2 enabled:hover:bg-[#FFFBEF]"
            onClick={(ev) => {
              ev.stopPropagation();
              if (onPop) onPop(w, ev);
            }}
          >
            {w}
          </button>
        ),
      )}
    </span>
  );
}

/** Glossary popup anchored near the tapped token (msPop). */
export function MsPop({ pop, onClose }: { pop: MsPopState; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const f = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(() => document.addEventListener("pointerdown", f), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("pointerdown", f);
    };
  }, [onClose]);
  const style: CSSProperties = {
    left: Math.max(8, Math.min((typeof window !== "undefined" ? window.innerWidth : 400) - 150, pop.x)),
    top: pop.y,
  };
  return (
    <div
      ref={ref}
      className="fixed z-[60] w-[142px] rounded-xl border border-[#E4E5F0] bg-white p-2.5 text-center shadow-xl"
      style={style}
    >
      <b className="block font-['Noto_Serif_SC',serif] text-[17px] text-[#14213D]">{pop.w}</b>
      <span className="block text-[11.5px] font-medium text-[#C8102E]">{pop.g[0]}</span>
      <span className="block text-[11.5px] text-[#3D3E5C]">{pop.g[1]}</span>
    </div>
  );
}

/** missions.js gloss lookup + speak — helper building a MsPopState from a click. */
export function msPopFor(w: string, e: MouseEvent<HTMLButtonElement>): MsPopState | null {
  const g = msGl(w);
  if (!g) return null;
  speak(w);
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
  return { w, g, x: r.left + r.width / 2 - 71, y: r.bottom + 6 };
}

/* ---------- duo.js `nhBurst`/`nhFx` + gt-class.js `gtConfetti` (hiệu ứng DOM) ---------- */
const REDUCE = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function nhBurst(el: HTMLElement | null): void {
  try {
    if (REDUCE || !el) return;
    const r = el.getBoundingClientRect(),
      cx = r.left + r.width / 2,
      cy = r.top + r.height / 2,
      C = ["#C8102E", "#1C1A6B", "#0F766E", "#FF6B6B", "#4F46E5"];
    for (let i = 0; i < 14; i++) {
      const d = document.createElement("i"),
        a = (Math.PI * 2 * i) / 14 + Math.random() * 0.4,
        R = 50 + Math.random() * 50;
      d.style.cssText = `position:fixed;z-index:70;pointer-events:none;left:${cx}px;top:${cy}px;width:${i % 3 ? "7px" : "9px"};height:${i % 3 ? "7px" : "4px"};border-radius:${i % 3 ? "50%" : "2px"};background:${C[i % C.length]};`;
      document.body.append(d);
      d.animate(
        [
          { transform: "translate(0,0)", opacity: 1 },
          { transform: `translate(${Math.cos(a) * R}px,${Math.sin(a) * R}px)`, opacity: 0 },
        ],
        { duration: 720, easing: "cubic-bezier(.2,.7,.3,1)" },
      );
      setTimeout(() => d.remove(), 750);
    }
  } catch {
    /* fx optional */
  }
}

/** nhFx — flash đúng/sai trên 1 element (dùng WAAPI, không cần class CSS). */
export function nhFx(el: HTMLElement | null, ok: boolean): void {
  if (!el) return;
  try {
    if (ok) {
      nhBurst(el);
      el.animate(
        [{ boxShadow: "0 0 0 0 rgba(46,125,79,.55)" }, { boxShadow: "0 0 0 12px rgba(46,125,79,0)" }],
        { duration: 550, easing: "ease-out" },
      );
    } else {
      el.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-7px)" },
          { transform: "translateX(6px)" },
          { transform: "translateX(-4px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 380, easing: "ease-out" },
      );
      el.animate([{ backgroundColor: "#FFF3EC" }, { backgroundColor: "transparent" }], { duration: 650 });
    }
  } catch {
    /* fx optional */
  }
}

export function gtConfetti(): void {
  if (REDUCE) return;
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;inset:0;z-index:70;pointer-events:none;overflow:hidden";
  document.body.append(box);
  for (let i = 0; i < 60; i++) {
    const p = document.createElement("i"),
      dx = (Math.random() - 0.5) * 120,
      rot = Math.random() * 360;
    p.style.cssText = `position:absolute;top:-14px;left:${Math.random() * 100}vw;width:8px;height:12px;border-radius:2px;background:${["#EA0000", "#F5A623", "#2E9E5B", "#050349", "#1F5FB0"][i % 5]};`;
    box.append(p);
    p.animate(
      [
        { transform: `translate(0,0) rotate(${rot}deg)` },
        { transform: `translate(${dx}px,${window.innerHeight + 40}px) rotate(${rot + 540}deg)` },
      ],
      { duration: 2200 + Math.random() * 800, delay: Math.random() * 600, easing: "cubic-bezier(.3,.4,.7,1)", fill: "forwards" },
    );
  }
  setTimeout(() => box.remove(), 3200);
}

/* ---------- nhStars (roleplay `rpStars`) ---------- */
export function NhStars({ k }: { k: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <NhIcon key={i} k="star" cls={i < k ? "on" : ""} size={15} />
      ))}
    </span>
  );
}

/** Convenience for a component that needs a MsPopState slot. */
export function useMsPop(): [MsPopState | null, (w: string, e: MouseEvent<HTMLButtonElement>) => void, () => void] {
  const [pop, setPop] = useState<MsPopState | null>(null);
  const show = (w: string, e: MouseEvent<HTMLButtonElement>) => {
    const p = msPopFor(w, e);
    if (p) setPop(p);
  };
  return [pop, show, () => setPop(null)];
}
