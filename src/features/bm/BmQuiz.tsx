/**
 * Ôn tập cuối buổi (bm.js bmMakeQuiz/bmQuiz): per-word trắc nghiệm —
 * nghĩa ("vi"), nghe-chọn-từ ("listen"), ghép-bộ-thủ ("comp").
 * Finishing awards `bm:on:<lv>:<date>` score*2+5.
 */
import { useEffect, useRef, useState } from "react";
import { speak } from "@/services/tts";
import { usePlayer } from "@/stores/player";
import { useUi } from "@/stores/ui";
import { dstr } from "@/lib/helpers";
import { Hz, pyOf } from "../ui-bits";
import type { BmQuestion } from "./model";
import { BM_BIG, BM_CARD, BM_ROW, BM_TIP, BM_VI, BTN_CTA, BTN_GHOST, BTN_OPT, OPT_BAD, OPT_OK } from "./model";

export function BmQuiz({
  qs,
  lv,
  onRestart,
  onShowList,
}: {
  qs: BmQuestion[];
  lv: number;
  onRestart: () => void;
  onShowList: () => void;
}) {
  const [k, setK] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [got, setGot] = useState(false);
  const awarded = useRef(false);
  const award = usePlayer((s) => s.award);
  const closeRoom = useUi((s) => s.closeRoom);
  const done = k >= qs.length;
  const pts = score * 2 + 5;
  const q = done ? null : qs[k];

  useEffect(() => {
    if (!q || q.type !== "listen") return;
    const t = window.setTimeout(() => speak(q.ask), 250);
    return () => window.clearTimeout(t);
  }, [k, q]);

  useEffect(() => {
    if (done && !awarded.current) {
      awarded.current = true;
      setGot(award(`bm:on:${lv}:${dstr()}`, pts, "ôn tập cuối buổi"));
    }
  }, [done, award, lv, pts]);

  if (done) {
    return (
      <div className={BM_CARD}>
        <div className={BM_BIG}>{`${score}/${qs.length}`}</div>
        <div className={BM_VI}>câu đúng – Hoàn thành bài học hôm nay!</div>
        {got ? <div className={BM_TIP}>{`+${pts} điểm`}</div> : null}
        <div className={BM_ROW}>
          <button type="button" className={BTN_GHOST} onClick={onShowList}>
            Xem danh sách từ
          </button>
          <button type="button" className={BTN_GHOST} onClick={onRestart}>
            Học lại từ đầu
          </button>
          <button type="button" className={BTN_CTA} onClick={closeRoom}>
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const pick = (o: string) => {
    if (picked != null || !q) return;
    setPicked(o);
    if (o === q.ans) setScore((x) => x + 1);
    window.setTimeout(() => {
      setPicked(null);
      setK((x) => x + 1);
    }, 1100);
  };

  const optCls = (o: string) => {
    if (picked == null) return BTN_OPT;
    if (o === q!.ans) return `${BTN_OPT} ${OPT_OK}`;
    if (o === picked) return `${BTN_OPT} ${OPT_BAD}`;
    return BTN_OPT;
  };

  return (
    <>
      <div className="mb-[0.4rem] flex items-center justify-between gap-2 text-[0.85rem] text-[#5B5A7A]">
        <span>{`Ôn tập – Câu ${k + 1}/${qs.length}`}</span>
        <span>{`Đúng ${score}`}</span>
      </div>
      <div className={BM_CARD}>
        <div className={BM_VI}>{q!.say}</div>
        {q!.type === "vi" ? <Hz t={q!.ask} py={q!.py} className={`${BM_BIG}`} /> : null}
        {q!.type === "listen" ? (
          <button type="button" className={`${BTN_CTA} w-full`} onClick={() => speak(q!.ask)}>
            🔊 Nghe
          </button>
        ) : null}
        {q!.type === "comp" ? <div className={BM_BIG}>{q!.ask}</div> : null}
        <div className="grid w-full grid-cols-2 gap-[0.6rem]">
          {q!.opts.map((o, oi) =>
            q!.type === "vi" ? (
              <button key={oi} type="button" disabled={picked != null} className={optCls(o)} onClick={() => pick(o)}>
                {o}
              </button>
            ) : (
              <button key={oi} type="button" disabled={picked != null} data-t={o} className={optCls(o)} onClick={() => pick(o)}>
                <span className="block leading-[1.15]">{o}</span>
                {pyOf(o) ? <span className="mt-[3px] block whitespace-nowrap text-[13px] font-medium leading-[1.2] text-[#5B5A7A]">{pyOf(o)}</span> : null}
              </button>
            ),
          )}
        </div>
      </div>
    </>
  );
}
