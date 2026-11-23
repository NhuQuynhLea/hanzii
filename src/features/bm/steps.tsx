/**
 * Simple wizard steps (bm.js bmRender branches):
 *  s=0 Nghe và nhìn, s=2 Ghép thành chữ, s=5 Câu ví dụ.
 */
import { Fragment, useEffect } from "react";
import type { BmDbEntry } from "@/types/lesson";
import { speak } from "@/services/tts";
import { Hz, pyOf } from "../ui-bits";
import { CharSvg } from "./CharSvg";
import { BM_PY, BM_ROW, BM_TIP, BM_VI, BTN_GHOST } from "./model";

/** "🔊 Nghe" ghost button (bm.js speakBtn). */
export function SpeakBtn({ zh, label = "🔊 Nghe" }: { zh: string; label?: string }) {
  return (
    <button type="button" className={BTN_GHOST} onClick={() => speak(zh)}>
      {label}
    </button>
  );
}

/** Bước 1/6 – Nghe và nhìn. */
export function StepLook({ W }: { W: BmDbEntry }) {
  const sz = W.chars.length > 2 ? 96 : W.chars.length > 1 ? 120 : 150;
  useEffect(() => {
    const t = window.setTimeout(() => speak(W.zh), 250);
    return () => window.clearTimeout(t);
  }, [W.zh]);
  return (
    <>
      <div className={BM_ROW}>
        {W.chars.map((ch, i) => (
          <CharSvg key={i} ch={ch.c} hi={-1} size={sz} />
        ))}
        {W.chars.length > 0 && W.zh.length > W.chars.length ? <CharSvg ch={W.chars[0].c} hi={-1} size={sz} /> : null}
      </div>
      <div className={BM_PY}>{W.py}</div>
      <div className={BM_VI}>{W.vi}</div>
      <div className={BM_ROW}>
        <SpeakBtn zh={W.zh} />
      </div>
    </>
  );
}

/** Bước 3/6 – Ghép thành chữ. */
export function StepBuild({ W }: { W: BmDbEntry }) {
  return (
    <>
      {W.chars.map((ch, ci) => (
        <div key={ci} className="flex w-full flex-col items-center gap-[0.6rem]">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {ch.comps.map((cp, i) => (
              <Fragment key={i}>
                {i > 0 ? <span className="text-[1.4rem] font-bold text-[#9A8F7A]">+</span> : null}
                <div className="min-w-[84px] rounded-[14px] border border-[#EADFCB] px-[0.7rem] py-2">
                  <div className="font-['Noto_Serif_SC',serif] text-[40px] font-semibold leading-[1.1] text-[#050349]">{cp[0]}</div>
                  <div className="text-[0.8rem] text-[#5B5A7A]">{cp[1]}</div>
                  <div className="max-w-[120px] text-[0.8rem]">{cp[2]}</div>
                </div>
              </Fragment>
            ))}
            {ch.comps.length > 1 || ch.comps[0][0] !== ch.c ? (
              <>
                <span className="text-[1.4rem] font-bold text-[#9A8F7A]">=</span>
                <div className="min-w-[84px] rounded-[14px] border border-[#EADFCB] px-[0.7rem] py-2">
                  <div className="font-['Noto_Serif_SC',serif] text-[40px] font-semibold leading-[1.1] text-[#EA0000]">{ch.c}</div>
                  <div className="text-[0.8rem] text-[#5B5A7A]">{pyOf(ch.c) || ""}</div>
                  <div className="max-w-[120px] text-[0.8rem]">{ch.mean || ""}</div>
                </div>
              </>
            ) : null}
          </div>
          <div className="text-[0.98rem] leading-[1.55]">{ch.expl}</div>
          {ch.tip ? <div className={BM_TIP}>{"💡 " + ch.tip}</div> : null}
        </div>
      ))}
      {W.word ? <div className={BM_TIP}>{"🧩 " + W.word}</div> : null}
    </>
  );
}

/** Bước 6/6 – Câu ví dụ. */
export function StepSentence({ W }: { W: BmDbEntry }) {
  const [toks, vi] = W.ex;
  const full = toks.map((x) => x[0]).join("");
  useEffect(() => {
    const t = window.setTimeout(() => speak(full), 250);
    return () => window.clearTimeout(t);
  }, [full]);
  return (
    <>
      <div className="flex flex-wrap items-start justify-center gap-2">
        {toks.map(([t, p], i) =>
          p ? (
            <Hz key={i} t={t} py={p} className="text-[30px] font-semibold text-[#050349]" />
          ) : (
            <span key={i} className="block font-['Noto_Serif_SC',serif] text-[30px] font-semibold leading-[1.15] text-[#050349]" lang="zh-CN">
              {t}
            </span>
          ),
        )}
      </div>
      <div className={BM_VI}>{vi}</div>
      <div className={BM_ROW}>
        <SpeakBtn zh={full} label="🔊 Nghe câu" />
      </div>
    </>
  );
}
