/**
 * Thử thách 60 giây — gm.js `gmBlitz`.
 * 60s word sprint over the unlocked-lesson pool; correct answers +1,
 * streaks combo, new words join the card collection.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { Word } from "@/types/lesson";
import { useUi } from "@/stores/ui";
import { usePlayer } from "@/stores/player";
import { keys, setTarget } from "@/game/engine/state";
import { callHook } from "@/services/hooks";
import { sfx } from "@/services/sfx";
import { ls } from "@/lib/storage";
import { dstr, shuffle } from "@/lib/helpers";
import { gmPool, gmCardOwn, gmPop } from "../state";

export function openBlitz(): void {
  keys.clear();
  setTarget(null);
  useUi.getState().openRoom({
    mark: "⚡",
    title: "Thử thách 60 giây",
    sub: "Trả lời càng nhiều càng tốt – từ của các bài đã mở",
    body: <Blitz />,
    variant: "default",
  });
}

interface Round {
  w: Word;
  rev: boolean;
  opts: Word[];
}

function Blitz() {
  const pool = useMemo(gmPool, []);
  const [best, setBest] = useState(() => +(ls.get("nh:blitz") || 0) || 0);
  const [phase, setPhase] = useState<"idle" | "run" | "done">("idle");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [left, setLeft] = useState(60);
  const [cur, setCur] = useState<Round | null>(null);
  const [picked, setPicked] = useState<Word | null>(null);
  const [newBest, setNewBest] = useState(false);
  const qRef = useRef(0);
  const scoreEl = useRef<HTMLElement>(null);
  const nextT = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(nextT.current), []);

  // score pop animation (gmPop on .gm-bs)
  useEffect(() => {
    if (score > 0) gmPop(scoreEl.current);
  }, [score]);

  const next = (qq: number) => {
    const w = pool[Math.floor(Math.random() * pool.length)];
    const rev = qq % 2 === 1;
    const opts = shuffle([w, ...shuffle(pool.filter((x) => x[0] !== w[0] && x[2] !== w[2])).slice(0, 3)]);
    setCur({ w, rev, opts });
    setPicked(null);
  };

  // 60s countdown while running (dlg close → unmount → cleanup)
  useEffect(() => {
    if (phase !== "run") return;
    const tm = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(tm);
  }, [phase]);
  useEffect(() => {
    if (phase === "run" && left <= 0) setPhase("done");
  }, [left, phase]);

  // end-of-run: best, sfx, award, confetti (once per done)
  useEffect(() => {
    if (phase !== "done") return;
    const nb = score > best;
    if (nb) {
      ls.set("nh:blitz", String(score));
      setBest(score);
    }
    setNewBest(nb);
    sfx("win");
    if (score > 0) usePlayer.getState().award(`blitz:${dstr()}`, Math.min(10, score), "thử thách 60 giây");
    if (nb) callHook("gtConfetti");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const start = () => {
    qRef.current = 0;
    setScore(0);
    setCombo(0);
    setLeft(60);
    setPhase("run");
    next(0);
  };

  const pick = (o: Word) => {
    if (left <= 0 || picked || !cur) return;
    setPicked(o);
    const ok = o === cur.w;
    const nc = ok ? combo + 1 : 0;
    if (ok) {
      setScore((s) => s + 1);
      setCombo(nc);
      gmCardOwn(cur.w[0]);
      sfx(nc >= 3 ? "combo" : "ok");
    } else {
      setCombo(0);
      sfx("bad");
    }
    nextT.current = setTimeout(() => {
      qRef.current++;
      next(qRef.current);
    }, ok ? 250 : 650);
  };

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline gap-2.5">
        <span>Điểm</span>
        <b ref={scoreEl} className="inline-block text-[32px] tabular-nums text-[#EA0000]">
          {score}
        </b>
        <span className={`inline-block rounded-full border px-3 py-0.5 text-[12px] font-bold ${combo >= 2 ? "border-[#F5A623] bg-[#FFF3E0] text-[#B45309]" : "border-[#E4E5F0] bg-[#F6F7FB] text-[#5B5A7A]"}`}>
          {combo >= 2 ? `🔥 x${combo}` : ""}
        </span>
        <small className="ml-auto text-[12px] text-[#5B5A7A]">Kỷ lục: {best}</small>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#E4E5F0]">
        <i className="block h-full rounded-full bg-[#EA0000] transition-[width] duration-1000 ease-linear" style={{ width: `${phase === "idle" ? 100 : (left / 60) * 100}%` }} />
      </div>

      {phase === "idle" && (
        <>
          <p className="my-1.5 mb-3 text-[13.5px] text-[#5B5A7A]">
            Có {pool.length} từ trong kho. Mỗi câu đúng +1, đúng liên tiếp có combo. Sai không bị trừ.
          </p>
          <button type="button" onClick={start} className="mt-2.5 w-full rounded-xl bg-[#EA0000] py-2.5 text-[14px] font-bold text-white">
            Bắt đầu ⚡
          </button>
        </>
      )}

      {phase === "run" && cur && (
        <>
          <div className="my-1 mb-4 text-center">
            {cur.rev ? (
              <b className="text-[20px]">{cur.w[2]}</b>
            ) : (
              <>
                <span className="block font-['Noto_Serif_SC',serif] text-[54px] leading-[1.2] text-[#EA0000]">{cur.w[0]}</span>
                <span className="text-[14px] text-[#5B5A7A]">{cur.w[1]}</span>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {cur.opts.map((o) => {
              const isPick = picked === o;
              const cls =
                picked === null
                  ? "border-[#E4E5F0] hover:bg-black/5"
                  : isPick
                    ? o === cur.w
                      ? "border-[#3BB273] bg-[#E3F5E9] text-[#14532D]"
                      : "border-[#EA0000] bg-[#FDE8E8] text-[#7F1D1D]"
                    : "border-[#E4E5F0]";
              return (
                <button
                  key={o[0] + o[2]}
                  type="button"
                  disabled={picked !== null}
                  onClick={() => pick(o)}
                  className={`min-h-[54px] rounded-[14px] border-[1.5px] p-3 font-medium ${cls}`}
                >
                  {cur.rev ? <span className="font-['Noto_Serif_SC',serif] text-[22px]">{o[0]}</span> : o[2]}
                </button>
              );
            })}
          </div>
        </>
      )}

      {phase === "done" && (
        <>
          <div className="mt-4 rounded-2xl bg-[#2E9E5B]/10 p-4 text-center">
            <b className="block text-[17px]">
              ⏱ Hết giờ! {score} câu đúng{newBest ? " – Kỷ lục mới!" : ""}
            </b>
            <span className="text-[13px] text-[#5B5A7A]">Mỗi từ trả lời đúng được thêm vào bộ sưu tập thẻ.</span>
          </div>
          <button type="button" onClick={() => setPhase("idle")} className="mt-2.5 w-full rounded-xl bg-[#EA0000] py-2.5 text-[14px] font-bold text-white">
            Chơi lại
          </button>
        </>
      )}
    </div>
  );
}
