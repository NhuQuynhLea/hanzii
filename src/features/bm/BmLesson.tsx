/**
 * Bài mới — the 6-step lesson wizard body (bm.js bmRender + nav).
 * Steps: Nghe và nhìn → Xem viết từng nét → Ghép thành chữ → Viết theo nét →
 * Nói và ghi âm → Câu ví dụ, then a per-word ôn tập quiz.
 * Finishing a word awards `bm:tu:<zh>:<date>` +3.
 */
import { useEffect, useState } from "react";
import type { BmDbEntry } from "@/types/lesson";
import { BM } from "@/data/bm-data";
import { usePlayer } from "@/stores/player";
import { dstr } from "@/lib/helpers";
import { StepAnimate } from "./StepAnimate";
import { StepWrite } from "./StepWrite";
import { StepSay } from "./StepSay";
import { StepBuild, StepLook, StepSentence } from "./steps";
import { BmQuiz } from "./BmQuiz";
import { BM_CARD, BM_STEPS, BM_TIPS, bmMakeQuiz, type BmQuestion, BTN_CTA, BTN_GHOST } from "./model";

export function BmLesson({
  lv,
  words,
  onRestart,
  onShowList,
}: {
  lv: number;
  words: BmDbEntry[];
  onRestart: () => void;
  onShowList: () => void;
}) {
  const [w, setW] = useState(0);
  const [s, setS] = useState(0);
  const [qs, setQs] = useState<BmQuestion[] | null>(null);
  const award = usePlayer((s2) => s2.award);

  const W = words[w];
  const N = words.length;

  // dlg.scrollTop = 0 on every bmRender
  useEffect(() => {
    const el = document.querySelector("[data-room-body]");
    if (el) el.scrollTop = 0;
  }, [w, s, qs]);

  if (qs) {
    return <BmQuiz qs={qs} lv={lv} onRestart={onRestart} onShowList={onShowList} />;
  }
  if (!W) return null;

  const back = () => {
    if (s > 0) setS(s - 1);
    else if (w > 0) {
      setW(w - 1);
      setS(5);
    }
  };
  const next = () => {
    if (s < 5) {
      setS(s + 1);
      return;
    }
    award(`bm:tu:${W.zh}:${dstr()}`, 3, "học xong từ " + W.zh);
    if (w < N - 1) {
      setW(w + 1);
      setS(0);
    } else {
      setQs(bmMakeQuiz(words));
    }
  };

  return (
    <>
      <div className="mb-[0.4rem] flex items-center justify-between gap-2 text-[0.85rem] text-[#5B5A7A]">
        <span>{`Từ ${w + 1}/${N} – Bước ${s + 1}/6: ${BM_STEPS[s]}`}</span>
        <div className="flex gap-1">
          {BM_STEPS.map((_, i) => (
            <i
              key={i}
              className={`h-[6px] w-[22px] rounded-[3px] ${i < s ? "bg-[#F4C95D]" : i === s ? "bg-[#EA0000]" : "bg-[#E8DCC6]"}`}
            />
          ))}
        </div>
      </div>
      <div className="mb-[0.8rem] mt-[0.3rem] flex items-end gap-[0.6rem]">
        <img
          alt="Thầy Vương"
          src={"data:image/svg+xml;charset=utf-8," + encodeURIComponent(BM.tch)}
          className="w-11 flex-none"
        />
        <div className="rounded-[14px_14px_14px_4px] bg-[#050349] px-3 py-[0.55rem] text-left text-[0.9rem] leading-[1.45] text-white">
          {BM_TIPS[s]}
        </div>
      </div>
      <div className={BM_CARD}>
        {s === 0 ? <StepLook key={w} W={W} /> : null}
        {s === 1 ? <StepAnimate key={w} W={W} /> : null}
        {s === 2 ? <StepBuild key={w} W={W} /> : null}
        {s === 3 ? <StepWrite key={w} W={W} /> : null}
        {s === 4 ? <StepSay key={w} W={W} /> : null}
        {s === 5 ? <StepSentence key={w} W={W} /> : null}
      </div>
      <div className="mt-[0.9rem] flex items-stretch gap-[0.6rem]">
        <button type="button" className={`${BTN_GHOST} flex-1`} disabled={w === 0 && s === 0} onClick={back}>
          ← Quay lại
        </button>
        <button type="button" className={`${BTN_CTA} flex-1`} onClick={next}>
          {s < 5 ? "Tiếp →" : w < N - 1 ? "Từ tiếp theo →" : "Ôn tập cuối buổi →"}
        </button>
      </div>
    </>
  );
}
