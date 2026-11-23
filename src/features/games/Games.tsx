/**
 * Fair-booth minigames (games.js/td.js): Nối từ, Ghép chữ, Xếp câu, Nghe thanh điệu.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { LEVELS, unlocked } from "@/lib/curriculum";
import { LVN, LVS } from "@/game/world/geometry";
import { shuffle, dstr } from "@/lib/helpers";
import { toneOf, baseOf, markTone } from "@/lib/pinyin";
import { speak } from "@/services/tts";
import { usePlayer } from "@/stores/player";
import { callHook } from "@/services/hooks";
import { Hz, HzButton, ResultBox, ChipRow } from "../ui-bits";
import { GAMES, BUILD_CH, PARTS, SENTENCES } from "@/data/games-data";
import { ls } from "@/lib/storage";

function gameDone(id: string, score: number, total: number): void {
  const G = GAMES[id];
  const onDone = callHook<({ ok, total, ms }: { ok: number; total: number; ms: number }) => void>("tdDone", id, score, total);
  if (total && (G.key === "tone" || G.key === "order")) {
    try {
      const A = JSON.parse(ls.get("nh:acc") || "{}");
      const r = A[G.key] || [0, 0];
      A[G.key] = [r[0] + score, r[1] + total];
      ls.set("nh:acc", JSON.stringify(A));
    } catch {
      /* noop */
    }
  }
  usePlayer.getState().bump((S) => {
    S.wins[G.key] = (S.wins[G.key] || 0) + 1;
    if (total && score === total) S.perfect[G.key] = 1;
  });
  usePlayer.getState().award(`game:${G.key}:${dstr()}`, 5, `chơi ${G.name}`);
  void onDone;
}

const tdProg = (k: number, score: number) => callHook("tdProg", k, score);

export function GameDialog({ id }: { id: string }) {
  const G = GAMES[id];
  const cl = usePlayer((s) => (s.meSeq, s.me.cl));
  const [lv, setLv] = useState(cl || 1);
  const [run, setRun] = useState(0);

  if (!G) return null;
  const start = () => setRun((x) => x + 1);
  const again = () => setRun((x) => x + 1);
  const board = () => callHook("openBoard");

  return (
    <div>
      <div className="mb-3 flex items-center justify-between rounded-xl bg-[#F6F4EF] px-3 py-2">
        <span className="text-[12px] text-[#5B5A7A]">Chơi một mình, hoặc rủ bạn đấu cùng bộ câu</span>
        <button type="button" onClick={() => callHook("tdPanel", id, lv)} className="rounded-lg bg-[#EA0000] px-2.5 py-1 text-[12px] font-bold text-white">
          ⚔ Thách đấu
        </button>
      </div>
      {G.lv && (
        <ChipRow items={LVS().map((l): [string, string] => [String(l), LVN(l)])} active={String(lv)} onPick={(k) => { setLv(+k); start(); }} />
      )}
      <div key={run}>
        <GameOnly id={id} lv={lv} again={again} board={board} />
      </div>
    </div>
  );
}

/** Bare game mount for the thách đấu room (td.js `tdStart` re-invoking a game). */
export function GameOnly({ id, lv, again, board }: { id: string; lv: number; again: () => void; board: () => void }) {
  return (
    <>
      {id === "g1" && <MatchGame lv={lv} again={again} board={board} />}
      {id === "g2" && <BuildGame again={again} board={board} />}
      {id === "g3" && <OrderGame lv={lv} again={again} board={board} />}
      {id === "g4" && <ToneGame lv={lv} again={again} board={board} />}
    </>
  );
}

/* ---------- g1: Nối từ ---------- */
function MatchGame({ lv, again, board }: { lv: number; again: () => void; board: () => void }) {
  const td = !!callHook("tdActive");
  const pool = useMemo(
    () => shuffle(LEVELS[lv].slice(0, td ? 30 : Math.max(10, unlocked(lv)))).slice(0, 6),
    [lv, td],
  );
  const [sel, setSel] = useState<{ i: number; s: "L" | "R" } | null>(null);
  const [doneSet, setDoneSet] = useState<Set<number>>(new Set());
  const [badSet, setBadSet] = useState<Set<string>>(new Set());
  const [left, setLeft] = useState(pool.length);
  const [miss, setMiss] = useState(0);
  const [sec, setSec] = useState(0);
  const [finished, setFinished] = useState(false);
  const t0 = useRef(performance.now());

  useEffect(() => {
    const t = setInterval(() => setSec(Math.floor((performance.now() - t0.current) / 1000)), 500);
    return () => clearInterval(t);
  }, []);

  const pick = (i: number, s: "L" | "R") => {
    if (doneSet.has(i) || finished) return;
    if (sel && sel.s !== s) {
      const a = sel;
      setSel(null);
      if (a.i === i) {
        const nd = new Set(doneSet);
        nd.add(i);
        setDoneSet(nd);
        speak(pool[i][0]);
        const nl = left - 1;
        setLeft(nl);
        tdProg(pool.length - nl, pool.length - nl);
        if (!nl) {
          setFinished(true);
          gameDone("g1", Math.max(0, pool.length - miss), pool.length);
        }
      } else {
        setMiss((m) => m + 1);
        setBadSet(new Set([`${a.s}${a.i}`, `${s}${i}`]));
        setTimeout(() => setBadSet(new Set()), 450);
      }
    } else setSel(sel && sel.i === i && sel.s === s ? null : { i, s });
  };

  const leftIdx = useMemo(() => shuffle(pool.map((_, i) => i)), [pool]);
  const rightIdx = useMemo(() => shuffle(pool.map((_, i) => i)), [pool]);

  if (finished)
    return <ResultBox big={`${sec} giây`} small={miss ? `Hoàn thành, nhầm ${miss} lần` : "Hoàn thành, không nhầm lần nào"} onAgain={again} onBoard={board} />;

  const cell = (i: number, s: "L" | "R") => {
    const isDone = doneSet.has(i);
    const isBad = badSet.has(s + i);
    const isSel = sel?.i === i && sel?.s === s;
    return (
      <button
        key={s + i}
        type="button"
        disabled={isDone}
        onClick={() => pick(i, s)}
        className={`w-full rounded-xl border-2 px-2 py-2 text-[14px] font-semibold transition ${
          isDone
            ? "border-transparent bg-[#F0F7F1] text-[#2E7D4F] opacity-60"
            : isBad
              ? "border-[#C8102E] bg-[#FFF3EC]"
              : isSel
                ? "border-[#EA0000] bg-[#FFF3EC]"
                : "border-[#E4E5F0] bg-white hover:border-[#EA0000]"
        }`}
      >
        {s === "L" ? <Hz t={pool[i][0]} py={pool[i][1]} className="text-[17px]" /> : pool[i][2]}
      </button>
    );
  };

  return (
    <div>
      <div className="mb-2 flex justify-between text-[12px] font-semibold text-[#5B5A7A]">
        <span>Còn {left} cặp</span>
        <span>{sec} giây</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">{leftIdx.map((i) => cell(i, "L"))}</div>
        <div className="space-y-1.5">{rightIdx.map((i) => cell(i, "R"))}</div>
      </div>
    </div>
  );
}

/* ---------- g2: Ghép chữ ---------- */
function BuildGame({ again, board }: { again: () => void; board: () => void }) {
  const qs = useMemo(() => shuffle(BUILD_CH).slice(0, 5), []);
  const [k, setK] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [verdict, setVerdict] = useState<boolean | null>(null);

  // td.js: report round start (k,score) to the duel progress bar
  useEffect(() => {
    tdProg(k, score);
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps

  // hooks must run before any early return (options for the current question,
  // clamped so the last-render index stays valid)
  const cur = qs[Math.min(k, qs.length - 1)];
  const opts = useMemo(
    () => shuffle([cur[3], cur[4], ...shuffle(PARTS.filter((x) => x !== cur[3] && x !== cur[4])).slice(0, 4)]),
    [cur],
  );

  if (k >= qs.length) return <ResultBox big={`${score}/${qs.length}`} small="chữ ghép đúng" onAgain={again} onBoard={board} />;

  const [ch, py, vi, a, b] = cur;

  const pick = (idx: number) => {
    if (picked.length >= 2 || verdict !== null || picked.includes(idx)) return;
    const np = [...picked, idx];
    setPicked(np);
    if (np.length === 2) {
      const ok = np.map((i) => opts[i]).sort().join() === [a, b].sort().join();
      setVerdict(ok);
      if (ok) setScore((x) => x + 1);
      speak(ch);
      const finScore = score + (ok ? 1 : 0);
      setTimeout(
        () => {
          if (k + 1 >= qs.length) gameDone("g2", finScore, qs.length);
          setK((x) => x + 1);
          setPicked([]);
          setVerdict(null);
        },
        ok ? 1100 : 2000,
      );
    }
  };

  return (
    <div>
      <div className="mb-2 flex justify-between text-[12px] font-semibold text-[#5B5A7A]">
        <span>
          Chữ {k + 1}/{qs.length}
        </span>
        <span>Đúng {score}</span>
      </div>
      <div className="mb-3 rounded-2xl bg-[#F6F4EF] p-4 text-center">
        <p className="text-[12px] text-[#5B5A7A]">Ghép thành chữ có nghĩa:</p>
        <b className="text-[18px] text-[#14213D]">{vi}</b>
        <div className="text-[13px] text-[#A61E22]">{py}</div>
      </div>
      <div className="mb-3 flex items-center justify-center gap-2 text-lg">
        <div className="grid h-14 w-14 place-items-center rounded-xl border-2 border-dashed border-[#E4E5F0] bg-white font-['Noto_Serif_SC',serif] text-2xl">{picked[0] != null ? opts[picked[0]] : ""}</div>
        <span className="font-bold text-[#8A8FA8]">+</span>
        <div className="grid h-14 w-14 place-items-center rounded-xl border-2 border-dashed border-[#E4E5F0] bg-white font-['Noto_Serif_SC',serif] text-2xl">{picked[1] != null ? opts[picked[1]] : ""}</div>
        <span className="font-bold text-[#8A8FA8]">=</span>
        <div className={`grid h-14 w-14 place-items-center rounded-xl border-2 font-['Noto_Serif_SC',serif] text-2xl font-bold ${verdict === null ? "border-[#E4E5F0] bg-white text-[#8A8FA8]" : verdict ? "border-[#2E7D4F] bg-[#F0F7F1] text-[#2E7D4F]" : "border-[#C8102E] bg-[#FFF3EC] text-[#C8102E]"}`}>
          {verdict === null ? "?" : ch}
        </div>
      </div>
      {verdict === false && <p className="mb-2 text-center text-[13px] text-[#C8102E]">Đáp án: {a} + {b} = {ch}</p>}
      <div className="grid grid-cols-3 gap-2">
        {opts.map((pt, i) => (
          <HzButton key={i} t={pt} disabled={picked.includes(i) || picked.length >= 2} onClick={() => pick(i)} className="h-14 justify-center text-2xl" />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setPicked([])}
        disabled={picked.length >= 2 || verdict !== null}
        className="mt-3 w-full rounded-xl border-2 border-[#E4E5F0] py-2 text-[13px] font-semibold text-[#3D3E5C] disabled:opacity-50"
      >
        Chọn lại
      </button>
    </div>
  );
}

/* ---------- g3: Xếp câu ---------- */
function OrderGame({ lv, again, board }: { lv: number; again: () => void; board: () => void }) {
  const qs = useMemo(() => shuffle(SENTENCES[lv] || []).slice(0, 5), [lv]);
  const [k, setK] = useState(0);
  const [score, setScore] = useState(0);
  const [ans, setAns] = useState<number[]>([]);
  const [verdict, setVerdict] = useState<boolean | null>(null);

  // td.js: report round start (k,score) to the duel progress bar
  useEffect(() => {
    tdProg(k, score);
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps

  // per-question shuffled order — stable for the whole question (keyed on k)
  const order = useMemo(() => {
    const t = (qs[k] || [[]])[0];
    let o = shuffle(t.map((_, i) => i));
    if (o.every((v, i) => v === i)) o = o.reverse();
    return o;
  }, [k, qs]);

  if (k >= qs.length) return <ResultBox big={`${score}/${qs.length}`} small="câu xếp đúng" onAgain={again} onBoard={board} />;

  const [toks, vi, alts] = qs[k];
  const target = toks.join("");
  const remaining = order.filter((i) => !ans.includes(i));

  const pick = (i: number) => {
    if (verdict !== null) return;
    const na = [...ans, i];
    setAns(na);
    if (na.length === toks.length) {
      const got = na.map((x) => toks[x]).join("");
      const ok = got === target || (alts || []).includes(got);
      setVerdict(ok);
      if (ok) setScore((x) => x + 1);
      speak(target);
      const finScore = score + (ok ? 1 : 0);
      setTimeout(
        () => {
          if (k + 1 >= qs.length) gameDone("g3", finScore, qs.length);
          setK((x) => x + 1);
          setAns([]);
          setVerdict(null);
        },
        ok ? 1300 : 2300,
      );
    }
  };

  return (
    <div>
      <div className="mb-2 flex justify-between text-[12px] font-semibold text-[#5B5A7A]">
        <span>
          Câu {k + 1}/{qs.length}
        </span>
        <span>Đúng {score}</span>
      </div>
      <p className="text-[12px] text-[#5B5A7A]">Xếp các từ thành câu có nghĩa:</p>
      <p className="mb-3 text-[14px] font-semibold text-[#14213D]">{vi}</p>
      <div className={`mb-3 flex min-h-[52px] flex-wrap items-center gap-1.5 rounded-xl border-2 p-2 ${verdict === null ? "border-dashed border-[#E4E5F0]" : verdict ? "border-[#2E7D4F] bg-[#F0F7F1]" : "border-[#C8102E] bg-[#FFF3EC]"}`}>
        {ans.map((i, j) => (
          <HzButton
            key={j}
            t={toks[i]}
            onClick={() => {
              if (verdict !== null) return;
              setAns(ans.filter((_, x) => x !== j));
            }}
            className="px-2.5 py-1 text-[16px]"
          />
        ))}
      </div>
      {verdict === false && <p className="mb-2 text-[13px] text-[#C8102E]">Đáp án: {toks.join(" ")}</p>}
      <div className="flex flex-wrap gap-1.5">
        {remaining.map((i) => (
          <HzButton key={i} t={toks[i]} onClick={() => pick(i)} className="px-2.5 py-1 text-[16px]" />
        ))}
      </div>
    </div>
  );
}

/* ---------- g4: Nghe thanh điệu ---------- */
function ToneGame({ lv, again, board }: { lv: number; again: () => void; board: () => void }) {
  const qs = useMemo(() => {
    let pool: [string, string, string][] = [];
    for (let l = 1; l <= lv; l++) pool = pool.concat(LEVELS[l].filter((w) => w[0].length === 1 && toneOf(w[1])));
    return shuffle(pool).slice(0, 6);
  }, [lv]);
  const [k, setK] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    if (k < qs.length) {
      const t = setTimeout(() => speak(qs[k][0]), 300);
      return () => clearTimeout(t);
    }
  }, [k, qs]);

  if (k >= qs.length) return <ResultBox big={`${score}/${qs.length}`} small="thanh điệu nghe đúng" onAgain={again} onBoard={board} />;

  const [zh, py, vi] = qs[k];
  const t = toneOf(py);
  const base = baseOf(py);

  return (
    <div>
      <div className="mb-2 flex justify-between text-[12px] font-semibold text-[#5B5A7A]">
        <span>
          Âm {k + 1}/{qs.length}
        </span>
        <span>Đúng {score}</span>
      </div>
      <div className="mb-3 flex items-center justify-center gap-3 rounded-2xl bg-[#F6F4EF] py-5">
        <button type="button" onClick={() => speak(zh)} aria-label="Nghe lại" className="grid h-14 w-14 place-items-center rounded-full bg-[#EA0000] text-2xl text-white shadow-md">
          🔊
        </button>
        <div className="text-2xl font-bold text-[#050349]">{base}</div>
      </div>
      {picked !== null && (
        <p className="mb-2 text-center text-[14px] font-semibold text-[#14213D]">
          {zh} {py}: {vi}
        </p>
      )}
      <p className="mb-2 text-[13px] text-[#5B5A7A]">Âm này mang thanh mấy? Bấm loa để nghe lại.</p>
      <div className="grid gap-2">
        {[1, 2, 3, 4].map((n) => {
          const cls =
            picked === null
              ? "border-[#E4E5F0] hover:border-[#EA0000]"
              : n === t
                ? "border-[#2E7D4F] bg-[#F0F7F1] text-[#2E7D4F]"
                : picked === n
                  ? "border-[#C8102E] bg-[#FFF3EC] text-[#C8102E]"
                  : "border-[#E4E5F0] opacity-60";
          return (
            <button
              key={n}
              type="button"
              disabled={picked !== null}
              onClick={() => {
                setPicked(n);
                tdProg(k, score + (n === t ? 1 : 0));
                if (n === t) setScore((x) => x + 1);
                const finScore = score + (n === t ? 1 : 0);
                setTimeout(() => {
                  if (k + 1 >= qs.length) gameDone("g4", finScore, qs.length);
                  setPicked(null);
                  setK((x) => x + 1);
                }, 1500);
              }}
              className={`rounded-xl border-2 px-4 py-2.5 text-[14px] font-semibold ${cls}`}
            >
              {markTone(base, n)} (thanh {n})
            </button>
          );
        })}
      </div>
    </div>
  );
}
