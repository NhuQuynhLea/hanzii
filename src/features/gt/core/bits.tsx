/**
 * Shared small components for the GT feature — ports of gt-core.js atoms
 * (gtHzBtn / cta / pg-go / gt-rule / gt-try / gt-pages) plus the script
 * loader the write pad needs (bm.js `bmLoadHW`).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { speak, findVoice } from "@/services/tts";
import { sfx } from "@/services/sfx";
import { callHook } from "@/services/hooks";
import { shuffle } from "@/lib/helpers";
import { WordRow } from "@/features/ui-bits";
import type { Tri, Word } from "@/types/lesson";
import type { GtDialogScene, GtQuizItem } from "@/types/gt";

/* ---------------- buttons ---------------- */

export function Cta({
  children,
  navy,
  ghost,
  onClick,
  disabled,
  className = "",
}: {
  children: ReactNode;
  navy?: boolean;
  ghost?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const v = ghost
    ? "border-[1.5px] border-[#E4E5F0] bg-transparent text-[#14213D] hover:border-[#05034959]"
    : navy
      ? "bg-[#050349] text-white hover:bg-[#1a1770]"
      : "bg-[#EA0000] text-white hover:bg-[#c50000] shadow-[0_10px_20px_-12px_rgba(234,0,0,.75)]";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`mt-2 rounded-xl px-4 py-2.5 text-[14px] font-bold transition disabled:cursor-default disabled:opacity-55 ${v} ${className}`}
    >
      {children}
    </button>
  );
}

/** .pg-go — small secondary button. */
export function PgGo({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-[40px] rounded-xl border border-[#E4E5F0] bg-transparent px-3.5 py-1.5 text-[13.5px] font-semibold text-[#3D3E5C] transition hover:border-[#EA0000] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------------- shared text classes ---------------- */

export const GT_H = "my-1 text-[19px] font-bold text-[#14213D]";
export const GT_P = "my-1 mb-2.5 text-[15px] text-[#5B5A7A]";
export const VI_SM = "text-[13px] text-[#5B5A7A]";

/* ---------------- gtHzBtn / rule box ---------------- */

/** gt-core `gtHzBtn`: hanzi + pinyin (+optional note) button that speaks. */
export function GtHzBtn({ zh, py, extra }: { zh: string; py?: string; extra?: string }) {
  return (
    <button
      type="button"
      onClick={() => speak(zh.replace(/[，。！？]/g, " "))}
      className="flex min-h-[44px] flex-col items-center rounded-[10px] border border-[#E4E5F0] bg-transparent px-2.5 py-1.5 text-[15px] text-[#14213D] transition hover:border-[#EA0000]"
    >
      <span className="font-['Noto_Serif_SC',serif] text-[1.15rem] leading-tight text-[#050349]" lang="zh-CN">
        {zh}
      </span>
      {py ? <span className="text-[12px] font-medium leading-tight text-[#5B5A7A]">{py}</span> : null}
      {extra ? <s className="text-[12.5px] font-semibold leading-tight text-[#C8102E] no-underline">{extra}</s> : null}
    </button>
  );
}

/** .gt-rule — one grammar/pronunciation rule with speaking examples. */
export function RuleBox({ t, d, ex }: { t: string; d: string; ex: Tri[] }) {
  return (
    <div className="my-2 rounded-[14px] border border-[#E4E5F0] bg-white px-3.5 py-2.5">
      <b className="mb-0.5 block text-[15px] text-[#14213D]">{t}</b>
      <span className="text-[14px] leading-relaxed text-[#5B5A7A]">{d}</span>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {ex.map((e, i) => (
          <GtHzBtn key={i} zh={e[0]} py={e[1]} extra={e[2]} />
        ))}
      </div>
    </div>
  );
}

/* ---------------- icons (icons.js `nhIcon` paths) ---------------- */

const NHI_PATHS: Record<string, string> = {
  alarm:
    '<circle cx="12" cy="13" r="7"/><path d="M12 9.5V13l2.5 2"/><path d="M4.5 5.5l2.5-2M19.5 5.5l-2.5-2"/>',
  unlock:
    '<rect x="5" y="11" width="14" height="9.5" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 6.8-1.2"/><circle cx="12" cy="15.6" r="1.4" fill="currentColor"/>',
};

export function NhIcon({ k, cls }: { k: string; cls?: string }) {
  const color = cls === "navy" ? "#050349" : cls === "red" ? "#EA0000" : "currentColor";
  return (
    <span aria-hidden="true" className="inline-flex" style={{ color }}>
      <svg
        viewBox="0 0 24 24"
        width={26}
        height={26}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: NHI_PATHS[k] || "" }}
      />
    </span>
  );
}

/* ---------------- misc ---------------- */

/** gtDlg "▶ Nghe cả hội thoại": queue every line (unlike speak(), no cancel between). */
export function speakAll(lines: string[]): void {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const v = findVoice();
  lines.forEach((t) => {
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "zh-CN";
    u.rate = 0.8;
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  });
}

/** fb.js `fbLine` — rendered by the feedback feature when available. */
export function FbLine({ src }: { src: string }) {
  const node = callHook<ReactNode>("fbLine", src);
  return node ? <>{node}</> : null;
}

/* ---------------- hanzi-writer loader (bm.js `bmLoadHW`) ---------------- */

export interface HwInstance {
  showCharacter(): void;
  animateCharacter(): void;
  quiz(o: { onComplete: () => void }): void;
}
interface HwFactory {
  create(el: HTMLElement, ch: string, opts: Record<string, unknown>): HwInstance;
}
declare global {
  interface Window {
    HanziWriter?: HwFactory;
  }
}

let hwLoading = false;
export function bmLoadHW(cb: (ok: boolean) => void): void {
  if (window.HanziWriter) return cb(true);
  let sc = document.getElementById("hwlib") as HTMLScriptElement | null;
  if (!sc) {
    sc = document.createElement("script");
    sc.id = "hwlib";
    sc.src = "https://cdn.jsdelivr.net/npm/hanzi-writer@3.7.2/dist/hanzi-writer.min.js";
    document.head.append(sc);
  }
  if (!hwLoading) {
    hwLoading = true;
    sc.addEventListener("load", () => cb(true));
    sc.addEventListener("error", () => cb(false));
  } else {
    sc.addEventListener("load", () => cb(true));
    sc.addEventListener("error", () => cb(false));
  }
  setTimeout(() => cb(!!window.HanziWriter), 4000);
}

/* ================= gtMkCheck / gtPaginate =================
 * The original splits a step's content into one "unit" per page and pins a
 * "✋ Thử ngay" mini-check to pages that hold knowledge (tones / ≥2 words /
 * ≥3 dialog lines / rules). Ported as data-driven blocks.
 */

export interface TryOption {
  /** value used for comparison + disabled tracking */
  v: string;
  node: ReactNode;
  right?: boolean;
}

export interface TrySpec {
  head: string;
  /** speaker button text inside the header (original `play`) */
  play?: string;
  /** text auto-spoken when the page shows (dataset.auto) */
  auto?: string;
  opts: TryOption[];
  /** speak this after a correct pick (original onOk → speak) */
  okSpeak?: string;
}

const rnd = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

const HzT = ({ t }: { t: string }) => (
  <span className="font-['Noto_Serif_SC',serif] text-[1.3rem] leading-tight text-[#050349]" lang="zh-CN">
    {t}
  </span>
);

/** gtMkCheck for a content block (null when the page is free). */
export function gtTrySpec(blk: GtBlock): TrySpec | null {
  if (blk.kind === "tones") {
    const T = blk.items.map(([zh, , t]) => ({ hz: zh, t }));
    const r = rnd(T);
    return {
      head: "✋ Thử ngay: nghe rồi chọn đúng thanh",
      play: r.hz,
      auto: r.hz,
      opts: T.map((o) => ({ v: o.t, node: o.t, right: o === r })),
    };
  }
  if (blk.kind === "words" && blk.words.length >= 2) {
    const W = blk.words.map(([zh, py, vi]) => ({ hz: zh, py: py || "", vi }));
    const r = rnd(W);
    const pick = shuffle(W.filter((x) => x !== r)).slice(0, 2).concat(r);
    if (Math.random() < 0.5) {
      return {
        head: "✋ Thử ngay: nghe rồi chọn chữ đúng",
        play: r.hz,
        auto: r.hz,
        opts: pick.map((o) => ({ v: o.hz, node: <HzT t={o.hz} />, right: o === r })),
      };
    }
    return {
      head: `✋ Thử ngay: chữ nào nghĩa là “${r.vi}”?`,
      okSpeak: r.hz,
      opts: pick.map((o) => ({
        v: o.hz,
        node: (
          <>
            <HzT t={o.hz} />
            {o.py ? <small className="text-[12px] text-[#5B5A7A]">{o.py}</small> : null}
          </>
        ),
        right: o === r,
      })),
    };
  }
  if (blk.kind === "dlg") {
    const D = (blk.scenes[0]?.lines || []).map((l) => ({ zh: l[2], vi: l[4] }));
    if (D.length < 3) return null;
    const r = rnd(D);
    const pick = shuffle(D.filter((x) => x.vi !== r.vi)).slice(0, 2).concat(r);
    return {
      head: "✋ Thử ngay: nghe một câu trong hội thoại, câu đó nghĩa là gì?",
      play: r.zh,
      auto: r.zh,
      opts: pick.map((o) => ({ v: o.vi, node: o.vi, right: o === r })),
    };
  }
  if (blk.kind === "rule") {
    const E = blk.ex.map(([hz, py, s]) => ({ hz, py: py || "", s: s || "" }));
    const tw = E.filter((e) => /^→/.test(e.s));
    if (tw.length) {
      const r = rnd(tw);
      const right = r.s.replace(/^→\s*/, "");
      return {
        head: `✋ Thử ngay: “${r.hz}” khi nói thật thì đọc là?`,
        okSpeak: r.hz,
        opts: [right, r.py].map((o) => ({ v: o, node: o, right: o === right })),
      };
    }
    if (E.length >= 2) {
      const r = rnd(E);
      const pick = shuffle(E.filter((x) => x !== r)).slice(0, 2).concat(r);
      return {
        head: "✋ Thử ngay: nghe rồi chọn câu đúng",
        play: r.hz,
        auto: r.hz,
        opts: pick.map((o) => ({ v: o.hz, node: <HzT t={o.hz} />, right: o === r })),
      };
    }
  }
  return null;
}

/** .gt-try — pinned mini-check at the bottom of a page. */
export function GtTry({ spec, onDone }: { spec: TrySpec; onDone: () => void }) {
  const opts = useMemo(() => shuffle(spec.opts.slice()), [spec]);
  const [miss, setMiss] = useState(0);
  const [ok, setOk] = useState(false);
  const [bad, setBad] = useState<Set<string>>(new Set());
  const [fb, setFb] = useState("");
  return (
    <div
      className={`mt-3.5 rounded-[14px] border-2 p-3 px-3.5 ${
        ok ? "border-[#58CC02] bg-[#58cc0214]" : "border-[#1CB0F6] bg-[#1cb0f612]"
      }`}
    >
      <p className="mb-2 flex flex-wrap items-center gap-2 font-extrabold text-[#14213D]">
        {spec.head}
        {spec.play ? (
          <button
            type="button"
            aria-label="Nghe lại"
            onClick={() => speak(spec.play!)}
            className="rounded-[10px] border-0 bg-[#1CB0F6] px-2.5 py-1 text-[16px] text-white"
          >
            🔊
          </button>
        ) : null}
      </p>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => {
          const isBad = bad.has(o.v);
          const cls = o.right && ok
            ? "border-[#58CC02] bg-[#58cc021f]"
            : o.right && miss >= 2
              ? "border-[#58CC02] bg-[#58cc021f]"
              : isBad
                ? "border-[#FF4B4B] bg-[#ff4b4b1a] opacity-70"
                : "border-[#D5D9E0] bg-white hover:border-[#1CB0F6]";
          return (
            <button
              key={o.v}
              type="button"
              disabled={isBad || ok}
              onClick={() => {
                if (ok) return;
                if (o.right) {
                  setOk(true);
                  sfx("ok");
                  setFb("✓ Đúng rồi!");
                  if (spec.okSpeak) speak(spec.okSpeak);
                  onDone();
                } else {
                  const m = miss + 1;
                  setMiss(m);
                  setBad((x) => new Set(x).add(o.v));
                  sfx("bad");
                  setFb(m >= 2 ? "Gợi ý: đáp án đúng đang sáng xanh." : "Chưa đúng, thử lại nhé.");
                }
              }}
              className={`flex min-h-[48px] min-w-[90px] flex-col items-center justify-center rounded-xl border-2 border-b-4 px-3.5 py-1.5 font-semibold transition ${cls}`}
            >
              {o.node}
            </button>
          );
        })}
      </div>
      <p className={`mt-1.5 min-h-[1em] text-[13.5px] font-bold ${ok ? "text-[#46A302]" : "text-[#3D3E5C]"}`}>{fb}</p>
    </div>
  );
}

/* ---------------- gtPaginate ---------------- */

/** One "unit" of knowledge content (gtPaginate splits `ul.words` into 5s). */
export type GtBlock =
  | { kind: "h"; t: string }
  | { kind: "p"; t: string }
  | { kind: "rule"; t: string; d: string; ex: Tri[] }
  | { kind: "tones"; items: [string, string, string, string][] }
  | { kind: "words"; words: Word[] }
  | { kind: "dlg"; scenes: GtDialogScene[] }
  | { kind: "quiz"; item: GtQuizItem }
  | { kind: "node"; node: ReactNode };

interface GtPage {
  head?: string;
  blk: GtBlock;
  spec: TrySpec | null;
  need: boolean;
}

function isUnit(b: GtBlock): boolean {
  return b.kind === "rule" || b.kind === "tones" || b.kind === "words" || b.kind === "quiz" || b.kind === "dlg";
}

/** Split blocks into pages like gtPaginate: heading carried into its unit. */
function buildPages(blocks: GtBlock[]): GtPage[] {
  const expanded: GtBlock[] = [];
  blocks.forEach((b) => {
    if (b.kind === "words" && b.words.length > 5) {
      for (let i = 0; i < b.words.length; i += 5) expanded.push({ kind: "words", words: b.words.slice(i, i + 5) });
    } else if (b.kind === "dlg") {
      b.scenes.forEach((sc) => expanded.push({ kind: "dlg", scenes: [sc] }));
    } else expanded.push(b);
  });
  const pages: GtPage[] = [];
  let head: string | undefined;
  let pend: GtBlock[] = [];
  expanded.forEach((b) => {
    if (b.kind === "h") {
      head = b.t;
      pend = [b];
      return;
    }
    if (isUnit(b)) {
      const spec = gtTrySpec(b);
      pages.push({ head, blk: b, spec, need: !!spec || b.kind === "quiz" });
      head = undefined;
      pend = [];
      return;
    }
    if (pend.length || !pages.length) pend.push(b);
  });
  return pages;
}

function BlockBody({ blk, reading }: { blk: GtBlock; reading: number }) {
  if (blk.kind === "h") return <h3 className={GT_H}>{blk.t}</h3>;
  if (blk.kind === "p") return <p className={GT_P}>{blk.t}</p>;
  if (blk.kind === "rule") return <RuleBox t={blk.t} d={blk.d} ex={blk.ex} />;
  if (blk.kind === "tones")
    return (
      <div className="my-1 mb-4 grid grid-cols-4 gap-1.5 max-[460px]:grid-cols-2">
        {blk.items.map(([zh, py, t, d], i) => (
          <button
            key={i}
            type="button"
            onClick={() => speak(zh)}
            className="flex flex-col items-center gap-0.5 rounded-xl border border-[#E4E5F0] bg-transparent px-0.5 py-2 text-[#14213D] transition hover:border-[#EA0000]"
          >
            <span className="font-['Noto_Serif_SC',serif] text-[1.6rem] leading-none text-[#EA0000]" lang="zh-CN">{zh}</span>
            <b className="text-[13px]">{py}</b>
            <small className="text-[11.5px] text-[#5B5A7A]">{t}</small>
            <small className="text-[11.5px] text-[#5B5A7A]">{d}</small>
          </button>
        ))}
      </div>
    );
  if (blk.kind === "words")
    return (
      <ul>
        {blk.words.map((w, i) => (
          <div key={w[0]} className={reading === i ? "rounded-[10px] bg-[#1cb0f61f]" : ""}>
            <WordRow w={w} />
          </div>
        ))}
      </ul>
    );
  if (blk.kind === "dlg")
    return (
      <>
        {blk.scenes.map((sc, i) => (
          <div key={i}>
            <p className="mb-1 mt-3 text-[13.5px] font-bold text-[#5B5A7A]">{sc.scene}</p>
            <ul className="mb-4 flex flex-col gap-2">
              {sc.lines.map((l, j) => (
                <li
                  key={j}
                  className={`grid grid-cols-[2.4rem_1fr_auto] items-start gap-2.5 rounded-[14px] p-2.5 px-3 ${
                    l[1] === "b" ? "bg-[#ea00000f]" : "bg-[#7f7f7f14]"
                  }`}
                >
                  <span
                    className={`grid h-[2.4rem] w-[2.4rem] place-items-center rounded-full font-['Noto_Serif_SC',serif] text-[14px] font-extrabold text-white ${
                      l[1] === "b" ? "bg-[#EA0000]" : "bg-[#050349]"
                    }`}
                    lang="zh-CN"
                  >
                    {l[0]}
                  </span>
                  <div>
                    <div className="font-['Noto_Serif_SC',serif] text-[1.25rem] leading-snug" lang="zh-CN">{l[2]}</div>
                    <div className="text-[13.5px] font-semibold text-[#B3261E]">{l[3]}</div>
                    <div className="text-[14px] text-[#3D3E5C]">{l[4]}</div>
                  </div>
                  <button
                    type="button"
                    aria-label={"Nghe " + l[3]}
                    onClick={() => speak(l[2])}
                    className="grid h-11 w-11 place-items-center rounded-full border border-[#E4E5F0] bg-transparent text-[16px] hover:bg-[#7f7f7f1f]"
                  >
                    🔊
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </>
    );
  if (blk.kind === "quiz") return <PageQuiz item={blk.item} />;
  return <>{blk.node}</>;
}

/** A .gt-q item inside a paged view; counts as the page's check. */
function PageQuiz({ item }: { item: GtQuizItem }) {
  const [q, opts0] = item;
  const opts = useMemo(() => shuffle(opts0.map((t, i) => [t, i] as [string, number])), [item]);
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="my-2 rounded-[14px] border border-[#E4E5F0] bg-white px-3.5 py-3" data-need="1">
      <p className="mb-2 font-semibold">{q}</p>
      <div className="grid gap-2">
        {opts.map(([t, i]) => {
          const cls =
            picked == null
              ? "border-[#E4E5F0] hover:bg-[#7f7f7f14]"
              : i === 0
                ? "border-[#3BB273] bg-[#E3F5E9] text-[#14532D]"
                : picked === i
                  ? "border-[#EA0000] bg-[#FDE8E8] text-[#7F1D1D]"
                  : "border-[#E4E5F0] opacity-60";
          return (
            <button
              key={i}
              type="button"
              disabled={picked != null}
              onClick={() => setPicked(i)}
              className={`rounded-[14px] border-[1.5px] p-3 text-left font-medium ${cls}`}
            >
              {/[一-鿿]/.test(t) ? <span className="font-['Noto_Serif_SC',serif]">{t}</span> : t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** gtPaginate — page through blocks, gating "Tiếp" behind the pinned check. */
export function GtPaged({ blocks }: { blocks: GtBlock[] }) {
  const pages = useMemo(() => buildPages(blocks), [blocks]);
  const [k, setK] = useState(0);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [reading, setReading] = useState(-1);
  const played = useRef<Record<string, boolean>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const reach = (() => {
    const f = pages.findIndex((p, i) => p.need && !done[i]);
    return f < 0 ? pages.length - 1 : f;
  })();
  const kk = Math.max(0, Math.min(reach, pages.length - 1, k));
  const pg = pages[kk];
  const need = !!pg && pg.need && !done[kk];
  const single = pages.length < 2;

  // auto-read word pages then auto-play the check prompt (gtPaginate `show`)
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setReading(-1);
    if (!pg) return;
    const ws = pg.blk.kind === "words" ? pg.blk.words : [];
    if (ws.length && !played.current[kk]) {
      played.current[kk] = true;
      ws.forEach((w, j) => {
        timers.current.push(
          setTimeout(() => {
            setReading(j);
            speak(w[0]);
            if (j === ws.length - 1)
              timers.current.push(
                setTimeout(() => {
                  setReading(-1);
                  if (need && pg.spec?.auto) speak(pg.spec.auto);
                }, 1500),
              );
          }, 400 + j * 1500),
        );
      });
    } else if (need && pg.spec?.auto && !played.current["a" + kk]) {
      played.current["a" + kk] = true;
      timers.current.push(setTimeout(() => speak(pg.spec!.auto!), 350));
    }
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kk, need]);

  if (!pages.length) return null;
  return (
    <div>
      {pages.map((p, i) => (
        <div key={i} hidden={i !== kk}>
          {p.head ? <h3 className={GT_H + " opacity-70"}>{p.head}</h3> : null}
          <BlockBody blk={p.blk} reading={i === kk ? reading : -1} />
          {p.blk.kind === "quiz" && !done[i] ? (
            <QuizGate onDone={() => setDone((d) => ({ ...d, [i]: true }))} />
          ) : null}
          {p.spec && !done[i] ? <GtTry spec={p.spec} onDone={() => setDone((d) => ({ ...d, [i]: true }))} /> : null}
        </div>
      ))}
      {!single ? (
        <div className="mb-1.5 mt-3.5 flex items-center justify-between gap-2.5">
          <PgGo disabled={!kk} onClick={() => setK(kk - 1)} className="min-w-[120px]">
            ← Trước
          </PgGo>
          <span className="flex flex-wrap justify-center gap-1.5" title={`${kk + 1}/${pages.length}`}>
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Trang ${i + 1}`}
                disabled={i > reach}
                onClick={() => setK(i)}
                className={`h-2.5 rounded-full border-0 p-0 disabled:cursor-default ${
                  i === kk ? "w-6 bg-[#EA0000]" : i < kk ? "w-2.5 bg-[#F3A1A1]" : "w-2.5 bg-[#D5D9E0]"
                }`}
              />
            ))}
          </span>
          <Cta
            disabled={need}
            onClick={() => setK(kk + 1)}
            className={`mt-0 min-w-[120px] ${kk < pages.length - 1 ? "" : "invisible"}`}
          >
            {need ? "Làm bài nhỏ để tiếp" : "Tiếp →"}
          </Cta>
        </div>
      ) : null}
    </div>
  );
}

/** Detects a pick inside a .gt-q page (original listens for .opt state). */
function QuizGate({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const t = setInterval(() => {
      if (el.querySelector("button[disabled]")) {
        onDone();
        clearInterval(t);
      }
    }, 120);
    return () => clearInterval(t);
  }, [onDone]);
  return <div ref={ref} hidden />;
}
