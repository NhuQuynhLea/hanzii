/**
 * gtWarmup (gt-class.js) — Thầy Vương khởi động: 3 vocabulary questions from
 * the most recently completed lesson before starting a new one.
 */
import { useEffect, useMemo, useState } from "react";
import { GT_CLASS } from "@/game/world/geometry";
import { GT_LESSONS, gtLabel } from "@/data/gt-data";
import { keys, setTarget } from "@/game/engine/state";
import { useUi } from "@/stores/ui";
import { usePlayer } from "@/stores/player";
import { useGm } from "@/stores/gm";
import { gtState } from "@/stores/gt";
import { callHook } from "@/services/hooks";
import { speak } from "@/services/tts";
import { sfx } from "@/services/sfx";
import { ls } from "@/lib/storage";
import { dstr, shuffle } from "@/lib/helpers";
import type { Word } from "@/types/lesson";

export function gtWarmup(lv: number): boolean {
  const st = gtState();
  const c = GT_CLASS[lv];
  if (!c) return false;
  let prev = 0;
  for (let i = c.from; i <= c.to; i++) if (st.done[i] && GT_LESSONS[i]) prev = i;
  if (!prev || ls.get("nh:warm") === dstr() + ":" + lv) return false;
  keys.clear();
  setTarget(null);
  useUi.getState().openRoom({
    mark: "师",
    title: "Thầy Vương khởi động",
    sub: `3 từ của ${gtLabel(prev)} trước khi vào bài mới`,
    variant: "default",
    body: <Warmup lv={lv} prev={prev} />,
  });
  return true;
}

function Warmup({ lv, prev }: { lv: number; prev: number }) {
  const qs = useMemo(() => shuffle(GT_LESSONS[prev].words.slice()).slice(0, 3), [prev]);
  const all = useMemo(() => Object.values(GT_LESSONS).flatMap((L) => L.words), []);
  const [k, setK] = useState(0);
  const [ok, setOk] = useState(0);
  const [picked, setPicked] = useState<Word | null>(null);
  const done = k >= qs.length;
  const w: Word | undefined = qs[k];

  const opts = useMemo(
    () => (w ? shuffle([w, ...shuffle(all.filter((x) => x[2] !== w[2])).slice(0, 3)]) : []),
    [w, all],
  );

  useEffect(() => {
    if (done) {
      ls.set("nh:warm", dstr() + ":" + lv);
      return;
    }
    setPicked(null);
    const t = setTimeout(() => speak(w![0]), 150);
    return () => clearTimeout(t);
  }, [k, done, w, lv]);

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <b className="text-[18px] text-[#050349]">{`Đúng ${ok}/3. Khởi động xong!`}</b>
        <span className="text-[13.5px] text-[#5B5A7A]">Giờ mình vào bài mới nhé.</span>
        <button
          type="button"
          autoFocus
          className="mt-2 rounded-xl bg-[#EA0000] px-5 py-2.5 text-[14px] font-bold text-white"
          onClick={() => {
            useUi.getState().closeRoom();
            callHook("openLesson");
          }}
        >
          Vào bài →
        </button>
      </div>
    );
  }

  const pick = (o: Word) => {
    if (picked) return;
    setPicked(o);
    const r = o === w;
    if (r) {
      setOk((x) => x + 1);
      sfx("ok");
      useGm.getState().cardOwn(w![0]);
      usePlayer.getState().award(`warm:${dstr()}:${lv}:${k}`, 2, "khởi động đúng");
    } else {
      sfx("bad");
    }
    setTimeout(() => setK((x) => x + 1), 900);
  };

  return (
    <div>
      <p className="mb-2 text-[14px] font-semibold text-[#3D3E5C]">{`Câu ${k + 1}/3 – Từ này nghĩa là gì?`}</p>
      <div className="mb-3 flex flex-col items-center rounded-2xl border-2 border-[#E3E6EF] py-4">
        <span className="font-['Noto_Serif_SC',serif] text-[40px] leading-[1.15] text-[#14163A]" lang="zh-CN">
          {w![0]}
        </span>
        <span className="mt-1 text-[15px] text-[#6B7085]">{w![1]}</span>
      </div>
      <div className="grid gap-2">
        {opts.map((o) => {
          let cls = "border-[#E3E6EF] hover:border-[#1C1A6B]";
          if (picked) {
            if (o === w) cls = "border-[#0F766E] bg-[#E4F2EE] text-[#0B5A54]";
            else if (o === picked) cls = "border-[#C8102E] bg-[#FDECEE] text-[#8E0B20]";
            else cls = "border-[#E3E6EF] opacity-60";
          }
          return (
            <button
              key={o[0] + o[2]}
              type="button"
              disabled={!!picked}
              onClick={() => pick(o)}
              className={`rounded-xl border-2 px-4 py-2.5 text-left text-[15px] text-[#14163A] ${cls}`}
            >
              {o[2]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
