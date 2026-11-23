/**
 * Cổng thử thách — gm.js `openGate`. Đấu với Thầy Vương:
 * 10 hiệp (4 từ + 4 tình huống + 2 nghe); hạ Thầy xuống ≤2 sức bền là thắng.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { Word } from "@/types/lesson";
import type { GtQuizItem } from "@/types/gt";
import { useUi } from "@/stores/ui";
import { usePlayer } from "@/stores/player";
import { keys, setTarget } from "@/game/engine/state";
import { avatarSvgUri } from "@/game/entities/avatar-svg";
import { callHook } from "@/services/hooks";
import { speak } from "@/services/tts";
import { sfx } from "@/services/sfx";
import { ls } from "@/lib/storage";
import { dstr, shuffle } from "@/lib/helpers";
import { GT_LESSONS, GT_TITLES, gtLabel } from "@/data/gt-data";
import { Hz } from "@/features/ui-bits";
import { gmGet, gmSave } from "@/stores/gm";
import { gmGateRange, gmGateName, gmGatePassed, gmGates, gmCardOwn } from "../state";

const HANZI = /[一-鿿]/;
const HP = 10;
const WIN = 8;

type GateQ = { t: "w"; w: Word } | { t: "q"; x: GtQuizItem } | { t: "l"; w: [string, string] };

export function openGate(g: number): void {
  const [a, b] = gmGateRange(g);
  // no lesson data in range → an empty round area would soft-lock the dialog
  let hasData = false;
  for (let i = a; i <= b; i++) if (GT_LESSONS[i]) hasData = true;
  if (!hasData) {
    useUi.getState().toast(`${gmGateName(g)} chưa mở – nội dung bài học chưa có.`);
    return;
  }
  keys.clear();
  setTarget(null);
  useUi.getState().openRoom({
    mark: "⚔",
    title: gmGateName(g),
    sub: `Đấu với Thầy Vương – câu hỏi từ ${gtLabel(a)} đến ${gtLabel(b)}`,
    body: <Gate g={g} />,
    variant: "default",
  });
}

function Gate({ g }: { g: number }) {
  const [a, b] = gmGateRange(g);
  const { Q, ws, say } = useMemo(() => {
    const ws: Word[] = [],
      qz: GtQuizItem[] = [],
      say: [string, string][] = [];
    for (let i = a; i <= b; i++) {
      const L = GT_LESSONS[i];
      if (!L) continue;
      ws.push(...L.words);
      qz.push(...L.quiz);
      say.push(...L.say);
    }
    const Q: GateQ[] = shuffle([
      ...shuffle(ws).slice(0, 4).map((w): GateQ => ({ t: "w", w })),
      ...shuffle(qz).slice(0, 4).map((x): GateQ => ({ t: "q", x })),
      ...shuffle(say).slice(0, 2).map((w): GateQ => ({ t: "l", w })),
    ]);
    return { Q, ws, say };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g]);

  const [phase, setPhase] = useState<"intro" | "q" | "end">("intro");
  const [k, setK] = useState(0);
  const [ok, setOk] = useState(0);
  const [missed, setMissed] = useState<[string, string][]>([]);
  const [say1, setSay1] = useState({ zh: "想过去？先回答我的问题！", vi: "Muốn qua cổng à? Trả lời câu hỏi của thầy trước đã!" });
  const [picked, setPicked] = useState<string | null>(null);
  const [win, setWin] = useState(false);
  const [first, setFirst] = useState(false);
  const [hit, setHit] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const tmr = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(tmr.current), []);

  // arena hit shake (duoShake .3s)
  useEffect(() => {
    if (!hit) return;
    imgRef.current?.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-5px)", offset: 0.25 }, { transform: "translateX(5px)", offset: 0.75 }, { transform: "translateX(0)" }],
      { duration: 300 },
    );
  }, [hit]);

  const round = useMemo(() => {
    const it = Q[k];
    if (!it) return null;
    if (it.t === "w") {
      const right = it.w[2];
      const opts = shuffle([right, ...shuffle(ws.filter((x) => x[2] !== right).map((x) => x[2])).slice(0, 3)]);
      return { it, kind: "w" as const, right, qtxt: it.w[0], opts, talk: { zh: "这个是什么意思？", vi: "Chữ này nghĩa là gì?" } };
    }
    if (it.t === "q") {
      const right = it.x[1][0];
      const opts = shuffle(it.x[1].slice());
      return { it, kind: "q" as const, right, qtxt: it.x[0], opts, talk: { zh: "你怎么说？", vi: "Em sẽ nói thế nào?" } };
    }
    const right = it.w[0];
    const opts = shuffle([right, ...shuffle(say.filter((x) => x[0] !== right).map((x) => x[0])).slice(0, 2)]);
    return { it, kind: "l" as const, right, qtxt: "🔊 (câu nghe)", opts, talk: { zh: "听！我说什么？", vi: "Nghe này! Thầy nói gì?" } };
  }, [k, Q, ws, say]);

  // per-round: Thầy speaks the prompt line; listen rounds auto-play
  useEffect(() => {
    if (phase !== "q" || !round) return;
    setSay1(round.talk);
    if (round.kind === "l") {
      const t = setTimeout(() => speak(round.right), 200);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, phase]);

  const finish = (nok: number) => {
    setPhase("end");
    const pass = nok >= WIN;
    if (pass) {
      const G = gmGates();
      const fr = !G[g];
      G[g] = dstr();
      ls.set("nh:gates", JSON.stringify(G));
      setWin(true);
      setFirst(fr);
      sfx("win");
      callHook("gtConfetti");
      setSay1({ zh: "好！你赢了！", vi: "Giỏi lắm, thầy chịu thua! Cổng mở rồi đấy." });
      if (fr) {
        usePlayer.getState().award(`gate:${g}`, 30, "thắng " + gmGateName(g));
        const gm = { ...gmGet(), titles: [...(gmGet().titles || [])] };
        gm.bonus += 100;
        gm.titles = [...(gm.titles || []), gmGateName(g)];
        gmSave(gm);
      }
    } else {
      setSay1({ zh: "差一点儿！再来！", vi: "Suýt nữa rồi! Ôn mấy chỗ này rồi đấu lại nhé." });
    }
  };

  // defensive: question list ran out (or was empty) → end the match instead
  // of rendering a dead round area the player can't leave
  useEffect(() => {
    if (phase === "q" && !round) finish(ok);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round]);

  const pick = (o: string) => {
    if (picked !== null || !round) return;
    setPicked(o);
    const r = o === round.right;
    const nok = ok + (r ? 1 : 0);
    if (r) {
      setOk(nok);
      sfx("ok");
      setHit((h) => h + 1);
      if (round.it.t === "w") gmCardOwn(round.it.w[0]);
    } else {
      sfx("bad");
      setMissed((m) => [...m, [round.qtxt, round.right]]);
    }
    tmr.current = setTimeout(() => {
      setPicked(null);
      if (k + 1 >= Q.length) finish(nok);
      else setK(k + 1);
    }, r ? 500 : 1200);
  };

  const left = HP - ok;
  const passedBefore = gmGatePassed(g);

  return (
    <div>
      <div className="mb-3 flex flex-col items-center gap-3.5 rounded-2xl bg-gradient-to-b from-[#1C1A6B] to-[#050349] p-3 text-[#FFF8EC] sm:flex-row">
        <div className="flex min-w-[130px] flex-col items-center gap-1">
          <img
            ref={imgRef}
            alt="Thầy Vương"
            src={avatarSvgUri(1, 9, 0)}
            className="h-[84px]"
            style={win ? { opacity: 0.6, transform: "rotate(-8deg)" } : undefined}
          />
          <b>Thầy Vương 王老师</b>
          <div className="h-2.5 w-[120px] overflow-hidden rounded-[9px] bg-white/20">
            <i className="block h-full bg-[#EA0000] transition-[width] duration-300" style={{ width: `${(left / HP) * 100}%` }} />
          </div>
          <small className="text-[12px] opacity-80">
            Sức bền {left}/{HP} – hạ còn {HP - WIN} là thắng
          </small>
        </div>
        <div className="flex flex-1 flex-col gap-0.5 self-stretch rounded-[14px] bg-[#FFF8EC] px-3.5 py-2.5 text-[#050349] sm:self-auto">
          <span className="font-['Noto_Serif_SC',serif] text-[22px]">{say1.zh}</span>
          <small className="text-[#5B6782]">{say1.vi}</small>
        </div>
      </div>

      {phase === "intro" && (
        <>
          <p className="my-1 mb-3 text-[13.5px] text-[#5B5A7A]">
            {passedBefore
              ? "Bạn đã thắng trận này. Đấu lại để ôn."
              : "10 hiệp. Mỗi câu đúng làm Thầy mất 1 sức bền; hạ Thầy còn 2 là thắng. Thua cũng không sao, Thầy sẽ chỉ chỗ cần ôn."}
          </p>
          <button type="button" onClick={() => setPhase("q")} className="mt-2.5 w-full rounded-xl bg-[#EA0000] py-2.5 text-[14px] font-bold text-white">
            ⚔ Bắt đầu trận đấu
          </button>
        </>
      )}

      {phase === "q" && round && (
        <>
          <p className="my-1 mb-3 text-[13.5px] text-[#5B5A7A]">Hiệp {k + 1}/10</p>
          {round.it.t === "w" && (
            <div className="my-1 mb-4 text-center">
              <span className="block font-['Noto_Serif_SC',serif] text-[54px] leading-[1.2] text-[#EA0000]">{round.it.w[0]}</span>
              <span className="text-[14px] text-[#5B5A7A]">{round.it.w[1]}</span>
            </div>
          )}
          {round.it.t === "q" && <p className="my-1 mb-3 text-[16px] font-bold">{round.it.x[0]}</p>}
          {round.it.t === "l" && (
            <div className="my-1 mb-4 text-center">
              <button type="button" onClick={() => speak((round.it as { t: "l"; w: [string, string] }).w[0])} className="rounded-xl bg-[#050349] px-5 py-2.5 text-[14px] font-bold text-white">
                🔊 Nghe câu này
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            {round.opts.map((o) => {
              const isPick = picked === o;
              const cls =
                picked === null
                  ? "border-[#E4E5F0] hover:bg-black/5"
                  : o === round.right
                    ? "border-[#3BB273] bg-[#E3F5E9] text-[#14532D]"
                    : isPick
                      ? "border-[#EA0000] bg-[#FDE8E8] text-[#7F1D1D]"
                      : "border-[#E4E5F0]";
              return (
                <button key={o} type="button" disabled={picked !== null} onClick={() => pick(o)} className={`min-h-[54px] rounded-[14px] border-[1.5px] p-3 font-medium ${cls}`}>
                  {HANZI.test(o) ? <Hz t={o} /> : <span>{o}</span>}
                </button>
              );
            })}
          </div>
        </>
      )}

      {phase === "end" && win && (
        <div className="mt-4 rounded-2xl bg-[#2E9E5B]/10 p-4 text-center">
          <b className="block text-[17px]">
            Thắng {gmGateName(g)}! ({ok}/10)
          </b>
          <span className="text-[13px] text-[#5B5A7A]">
            {first
              ? "+30 điểm – +100 xu – danh hiệu mới trong hồ sơ." + (GT_TITLES[g + 1] ? ` Đường sang ${gtLabel(g + 1)} đã mở.` : "")
              : "Bạn đã thắng trận này rồi, ôn lại rất tốt!"}
          </span>
        </div>
      )}

      {phase === "end" && !win && (
        <>
          <div className="mb-2.5 rounded-[14px] border-2 border-[#E2B14A] bg-[#E2B14A]/10 p-3">
            <b>
              Thầy Vương còn {left} sức bền – cần hạ xuống {HP - WIN}
            </b>
            <small className="mt-1.5 block">Những câu em còn lẫn:</small>
            <ul className="mt-1.5 list-disc pl-5">
              {missed.map(([q, r], i) => (
                <li key={i}>
                  <span>{q} → </span>
                  <b className={HANZI.test(r) ? "font-['Noto_Serif_SC',serif] text-[18px]" : ""}>{r}</b>
                </li>
              ))}
            </ul>
          </div>
          <button type="button" onClick={() => openGate(g)} className="mt-2.5 w-full rounded-xl bg-[#EA0000] py-2.5 text-[14px] font-bold text-white">
            ⚔ Đấu lại
          </button>
        </>
      )}
    </div>
  );
}
