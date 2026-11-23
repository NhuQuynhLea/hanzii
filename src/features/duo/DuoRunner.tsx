/**
 * duo.js session UI — DuoRunner mounts one challenge/review session inside the
 * room dialog. The original `duo` object becomes React state; each exercise
 * renders the same UI duoNext() built imperatively, duoResult() becomes the
 * result footer, duoEnd() the end screen.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { GT_LESSONS, gtLabel } from "@/data/gt-data";
import { gtState, gtSave } from "@/stores/gt";
import { usePlayer, ledger } from "@/stores/player";
import { useWm } from "@/stores/wm";
import { useGm } from "@/stores/gm";
import { useUi } from "@/stores/ui";
import { callHook } from "@/services/hooks";
import { speak } from "@/services/tts";
import { sfx } from "@/services/sfx";
import { ls } from "@/lib/storage";
import { dstr, shuffle } from "@/lib/helpers";
import type { Word, Tri } from "@/types/lesson";
import {
  gtBSteps,
  gtSeen,
  gtCheckDone,
  gtStarCheck,
  gtStarTxt,
  gtStars,
  gtNS,
  gtUnlocked,
  setGt,
  classOf,
} from "@/features/gt/scene/core";
import { DuoTile, HzP, GtHzButton } from "@/features/gt/scene/bits";
import {
  duoTok,
  duoPlain,
  gtPy,
  pickPraise,
  libToneVars,
  setDuoSession,
  type DuoEx,
  type DuoSessionData,
} from "./engine";
import { nhFx, nhBurst } from "./fx";

export type DuoInit = DuoSessionData;

interface DuoState extends DuoInit {
  queue: DuoEx[];
  total: number;
  done: number;
  wrong: number;
  combo: number;
  best: number;
  retried: Set<DuoEx>;
  t0: number;
  listenOk: number;
  cur: DuoEx | null;
  answered: boolean;
  /** increments every advance — remounts the exercise body (clears picks on retries) */
  turn: number;
}

interface Result {
  ok: boolean;
  right?: string | null;
  extra?: string;
  praise: string;
}

interface Refs {
  check: HTMLButtonElement | null;
  opts: (HTMLButtonElement | null)[];
  fx: HTMLElement | null;
  main: HTMLElement | null;
  bar: HTMLElement | null;
}

interface Ctx {
  refs: MutableRefObject<Refs>;
  S: DuoState;
  resolve: (ok: boolean, right?: string | null, extra?: string) => void;
  advance: (cont?: boolean) => void;
  bumpListen: () => void;
  footEl: HTMLElement | null;
  res: Result | null;
}

const pool = () => Object.values(GT_LESSONS).flatMap((L) => L.words);

function others(w: Word, k: number, key: number): Word[] {
  return shuffle(pool().filter((x) => x[key] !== w[key] && x[0] !== w[0]))
    .filter((x, i, a) => a.findIndex((y) => y[key] === x[key]) === i)
    .slice(0, k);
}

/* read-along sequence: highlight + speak items one after another */
function useReadSeq(zhs: string[], dep: unknown): number {
  const [idx, setIdx] = useState(-1);
  useEffect(() => {
    setIdx(-1);
    const timers: number[] = [];
    zhs.forEach((zh, j) => {
      timers.push(
        window.setTimeout(() => {
          setIdx(j);
          speak(zh);
          if (j === zhs.length - 1)
            timers.push(window.setTimeout(() => setIdx(-1), 1400));
        }, 300 + j * 1500),
      );
    });
    return () => timers.forEach((t) => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep]);
  return idx;
}

/* ---------- shared atoms ---------- */
function Opts({
  ctx,
  opts,
  sel,
  onPick,
  render,
}: {
  ctx: Ctx;
  opts: unknown[];
  sel: unknown;
  onPick: (o: never, el: HTMLButtonElement) => void;
  render: (o: never) => ReactNode;
}) {
  return (
    <div className="grid gap-2.5">
      {opts.map((o, i) => (
        <button
          key={i}
          type="button"
          disabled={ctx.S.answered}
          ref={(el) => {
            ctx.refs.current.opts[i] = el;
          }}
          onClick={(e) => {
            if (ctx.S.answered) return;
            ctx.refs.current.fx = e.currentTarget;
            onPick(o as never, e.currentTarget);
          }}
          className={`flex min-h-[56px] items-center gap-3 rounded-[10px] border-2 border-[#E3E6EF] bg-white px-4 py-3 text-left text-[17px] text-[#14163A] transition hover:border-[#14163A] disabled:cursor-default ${
            sel === o ? "border-[#1C1A6B] bg-[#EEF0FB]" : ""
          }`}
        >
          <span
            className={`grid h-7 w-7 flex-none place-items-center rounded-lg border-2 text-[13px] font-bold ${
              sel === o ? "border-[#1C1A6B] text-[#1C1A6B]" : "border-[#E3E6EF] text-[#6B7085]"
            }`}
          >
            {i + 1}
          </span>
          {render(o as never)}
        </button>
      ))}
    </div>
  );
}

function Foot({
  ctx,
  can,
  onCheck,
  skipTxt,
  onSkip,
  label,
}: {
  ctx: Ctx;
  can: boolean;
  onCheck: () => void;
  skipTxt?: string;
  onSkip?: () => void;
  label?: string;
}) {
  return (
    <>
      {skipTxt ? (
        <button
          type="button"
          onClick={onSkip}
          className="rounded-xl border-2 border-[#E3E6EF] px-4 py-3 text-[14px] font-bold text-[#6B7085]"
        >
          {skipTxt}
        </button>
      ) : null}
      <button
        type="button"
        ref={(el) => {
          ctx.refs.current.check = el;
        }}
        disabled={!can}
        onClick={onCheck}
        className="ml-auto min-w-[150px] rounded-2xl bg-[#EA0000] px-6 py-3.5 text-[16px] font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_#A61E22] disabled:bg-[#E3E6EF] disabled:text-[#6B7085] disabled:shadow-[0_4px_0_#C9CEDC]"
      >
        {label || "Kiểm tra"}
      </button>
    </>
  );
}

function ContBtn({ ctx, label }: { ctx: Ctx; label?: string }) {
  return (
    <button
      type="button"
      autoFocus
      ref={(el) => {
        ctx.refs.current.check = el;
      }}
      onClick={() => ctx.advance(true)}
      className="ml-auto min-w-[150px] rounded-2xl bg-[#EA0000] px-6 py-3.5 text-[16px] font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_#A61E22]"
    >
      {label || "Tiếp tục"}
    </button>
  );
}

function PlayBtn({ zh, small }: { zh: string; small?: boolean }) {
  return (
    <button
      type="button"
      aria-label="Nghe lại"
      onClick={() => speak(zh)}
      className={`grid place-items-center self-center rounded-3xl border-0 bg-[#1C1A6B] text-white shadow-[0_5px_0_#050349] ${
        small ? "h-14 w-14 text-2xl" : "h-24 w-24 text-[42px]"
      }`}
    >
      🔊
    </button>
  );
}

function WordCard({ w, sent }: { w: [string, string]; sent?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => speak(w[0])}
      className="relative flex min-w-[180px] flex-col items-center gap-1 self-center rounded-2xl border-2 border-[#E3E6EF] px-7 py-4 text-[#14163A]"
    >
      <span
        className={`font-['Noto_Serif_SC',serif] leading-[1.15] ${sent ? "text-[28px]" : "text-[48px]"}`}
        lang="zh-CN"
      >
        {w[0]}
      </span>
      <span className="text-[15px] text-[#6B7085]">{w[1]}</span>
      <span className="absolute right-2.5 top-2 text-base">🔊</span>
    </button>
  );
}

/* ---------- exercise components (duoNext branches) ---------- */
function FootIn({ ctx, children }: { ctx: Ctx; children: ReactNode }) {
  if (!ctx.footEl || ctx.res) return null;
  return createPortal(children, ctx.footEl);
}

function ExScene({ e, ctx }: { e: DuoEx; ctx: Ctx }) {
  const d = e.d!;
  const idx = useReadSeq(d.lines.map((l) => l[2]), e);
  return (
    <>
      <p className="text-center text-[14px] text-[#6B7085]">{d.scene}</p>
      <div className="grid gap-2">
        {d.lines.map((l, i) => (
          <button
            key={i}
            type="button"
            onClick={() => speak(l[2])}
            className={`grid grid-cols-[auto_1fr] items-center gap-x-2.5 rounded-xl border-2 border-[#E3E6EF] bg-white px-3 py-2 text-left ${
              l[1] === "a" ? "border-l-4 border-l-[#1C1A6B]" : ""
            } ${idx === i ? "border-[#1C1A6B] bg-[#EEF0FB]" : ""}`}
          >
            <span className="row-span-2 font-['Noto_Serif_SC',serif] text-[18px] text-[#C8102E]">
              {l[0]}
            </span>
            <HzP t={l[2]} py={gtPy(l[2])} align="start" className="text-[20px]" />
            <small className="col-start-2 text-[12.5px] text-[#6B7085]">{l[4]}</small>
          </button>
        ))}
      </div>
      <FootIn ctx={ctx}>
        <ContBtn ctx={ctx} />
      </FootIn>
    </>
  );
}

function ExTeach({ e, ctx }: { e: DuoEx; ctx: Ctx }) {
  const g = e.g as Word[];
  useEffect(() => {
    try {
      useWm.getState().seen(g.map((w) => w[0]));
    } catch {
      /* noop */
    }
    g.forEach((w) => {
      try {
        useGm.getState().cardSeen(w[0]);
      } catch {
        /* noop */
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e]);
  const idx = useReadSeq(g.map((w) => w[0]), e);
  return (
    <>
      <div className="grid gap-2.5">
        {g.map((w, i) => (
          <button
            key={i}
            type="button"
            onClick={() => speak(w[0])}
            className={`grid grid-cols-[auto_1fr] items-center gap-x-3.5 rounded-xl border-2 border-[#E3E6EF] bg-white px-4 py-3 text-left ${
              idx === i ? "border-[#1C1A6B] bg-[#EEF0FB]" : ""
            }`}
          >
            <span className="row-span-2 font-['Noto_Serif_SC',serif] text-[36px] leading-[1.15] text-[#14163A]" lang="zh-CN">
              {w[0]}
            </span>
            <span className="text-[14px] text-[#6B7085]">{w[1]}</span>
            <span className="font-bold text-[#14163A]">{w[2]}</span>
          </button>
        ))}
      </div>
      <p className="text-center text-[13.5px] text-[#6B7085]">Nghe và nhớ nghĩa, ngay sau đây sẽ dùng.</p>
      <FootIn ctx={ctx}>
        <ContBtn ctx={ctx} />
      </FootIn>
    </>
  );
}

function ExTone({ e, ctx }: { e: DuoEx; ctx: Ctx }) {
  const tones = e.tones!;
  const idx = useReadSeq(tones.map((t) => t[0]), e);
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        {tones.map((t, i) => (
          <button
            key={i}
            type="button"
            onClick={() => speak(t[0])}
            className={`grid grid-cols-[auto_1fr] items-center gap-x-3.5 rounded-xl border-2 border-[#E3E6EF] bg-white px-4 py-3 text-left ${
              idx === i ? "border-[#1C1A6B] bg-[#EEF0FB]" : ""
            }`}
          >
            <span className="row-span-2 font-['Noto_Serif_SC',serif] text-[36px] leading-[1.15] text-[#14163A]" lang="zh-CN">
              {t[0]}
            </span>
            <span className="text-[14px] text-[#6B7085]">{t[1]}</span>
            <span className="font-bold text-[#14163A]">{t[2]}</span>
            <small className="col-start-2 text-[12px] text-[#6B7085]">{t[3]}</small>
          </button>
        ))}
      </div>
      <p className="text-center text-[13.5px] text-[#6B7085]">Cùng một âm, đổi thanh là đổi nghĩa.</p>
      <FootIn ctx={ctx}>
        <ContBtn ctx={ctx} />
      </FootIn>
    </>
  );
}

function ExToneQ({ e, ctx }: { e: DuoEx; ctx: Ctx }) {
  const r = useMemo(() => e.tones![Math.floor(Math.random() * e.tones!.length)], [e]);
  const [pick, setPick] = useState<unknown>(null);
  useEffect(() => {
    const t = setTimeout(() => speak(r[0]), 200);
    return () => clearTimeout(t);
  }, [r]);
  return (
    <>
      <PlayBtn zh={r[0]} />
      <Opts
        ctx={ctx}
        opts={e.tones!}
        sel={pick}
        onPick={(o) => setPick(o)}
        render={(o: [string, string, string, string]) => <span>{o[2]}</span>}
      />
      <FootIn ctx={ctx}>
        <Foot
          ctx={ctx}
          can={pick != null}
          onCheck={() => ctx.resolve(pick === r, `${r[2]} – ${r[0]} ${r[1]}`)}
        />
      </FootIn>
    </>
  );
}

function ExToneW({ e, ctx }: { e: DuoEx; ctx: Ctx }) {
  const w = e.w!;
  const V = useMemo(() => libToneVars(w[1]) || [w[1]], [w]);
  const [pick, setPick] = useState<unknown>(null);
  useEffect(() => {
    const t = setTimeout(() => speak(w[0]), 200);
    return () => clearTimeout(t);
  }, [w]);
  return (
    <>
      <PlayBtn zh={w[0]} />
      <div className="flex justify-center font-['Noto_Serif_SC',serif] text-[30px] text-[#14163A]" lang="zh-CN">
        {w[0]}
      </div>
      <Opts
        ctx={ctx}
        opts={V}
        sel={pick}
        onPick={(o) => setPick(o)}
        render={(o: string) => <span>{o}</span>}
      />
      <FootIn ctx={ctx}>
        <Foot ctx={ctx} can={pick != null} onCheck={() => ctx.resolve(pick === w[1], `${w[1]} – ${w[2]}`)} />
      </FootIn>
    </>
  );
}

function ExRule({ e, ctx }: { e: DuoEx; ctx: Ctx }) {
  const r = e.r!;
  const ex = r.ex.slice(0, 4);
  const idx = useReadSeq(ex.map((x) => x[0].replace(/[，。！？]/g, " ")), e);
  return (
    <>
      <p className="text-[17px] leading-relaxed text-[#14163A]">{r.d}</p>
      <div className="flex flex-wrap gap-2">
        {ex.map((x, i) => (
          <span key={i} className={idx === i ? "rounded-xl ring-2 ring-[#1C1A6B] ring-offset-1" : ""}>
            <GtHzButton zh={x[0]} py={x[1] || gtPy(x[0])} extra={x[2]} />
          </span>
        ))}
      </div>
      <FootIn ctx={ctx}>
        <ContBtn ctx={ctx} />
      </FootIn>
    </>
  );
}

/* ruleq picks one random example — memoised per exercise object so the header
 * and the body agree on which item was picked. */
const ruleqPicks = new WeakMap<DuoEx, Tri>();
function ruleqItem(e: DuoEx): Tri | null {
  let r = ruleqPicks.get(e);
  if (r === undefined) {
    const E = e.r!.ex;
    const tw = E.filter((x) => /^→/.test(x[2] || ""));
    if (!tw.length && E.length < 2) return null;
    const src = tw.length ? tw : E;
    r = src[Math.floor(Math.random() * src.length)] || src[0];
    ruleqPicks.set(e, r);
  }
  return r;
}

function ExRuleQ({ e, ctx }: { e: DuoEx; ctx: Ctx }) {
  const E = e.r!.ex;
  const r = ruleqItem(e);
  const isTw = !!r && /^→/.test(r[2] || "");
  const [pick, setPick] = useState<unknown>(null);
  const opts = useMemo(
    () =>
      !r
        ? []
        : isTw
          ? shuffle([(r[2] || "").replace(/^→\s*/, ""), r[1]])
          : shuffle(E.slice(0, 4)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [e],
  );
  const z = r ? r[0].replace(/[，。！？]/g, " ") : "";
  useEffect(() => {
    if (r && !isTw) {
      const t = setTimeout(() => speak(z), 200);
      return () => clearTimeout(t);
    }
  }, [r, isTw, z]);
  useEffect(() => {
    if (!r) ctx.advance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r]);
  if (!r) return null;
  if (isTw) {
    const right = (r[2] || "").replace(/^→\s*/, "");
    return (
      <>
        <div className="flex justify-center font-['Noto_Serif_SC',serif] text-[30px] text-[#14163A]" lang="zh-CN">
          {r[0]}
        </div>
        <Opts ctx={ctx} opts={opts} sel={pick} onPick={(o) => setPick(o)} render={(o: string) => <span>{o}</span>} />
        <FootIn ctx={ctx}>
          <Foot
            ctx={ctx}
            can={pick != null}
            onCheck={() => {
              if (pick === right) speak(r[0]);
              ctx.resolve(pick === right, right);
            }}
          />
        </FootIn>
      </>
    );
  }
  return (
    <>
      <PlayBtn zh={z} />
      <Opts
        ctx={ctx}
        opts={opts}
        sel={pick}
        onPick={(o) => setPick(o)}
        render={(o: Tri) => <span className="font-['Noto_Serif_SC',serif]">{o[0]}</span>}
      />
      <FootIn ctx={ctx}>
        <Foot ctx={ctx} can={pick != null} onCheck={() => ctx.resolve(pick === r, `${r[0]} (${r[1]})`)} />
      </FootIn>
    </>
  );
}

function ExMean({ e, ctx }: { e: DuoEx; ctx: Ctx }) {
  const w = e.w!;
  const opts = useMemo(() => shuffle([w, ...others(w, 3, 2)]), [w]);
  const [pick, setPick] = useState<Word | null>(null);
  useEffect(() => {
    const t = setTimeout(() => speak(w[0]), 150);
    return () => clearTimeout(t);
  }, [w]);
  return (
    <>
      <WordCard w={[w[0], w[1]]} />
      <Opts
        ctx={ctx}
        opts={opts}
        sel={pick}
        onPick={(o: Word) => setPick(o)}
        render={(o: Word) => <span>{o[2]}</span>}
      />
      <FootIn ctx={ctx}>
        <Foot
          ctx={ctx}
          can={pick != null}
          onCheck={() => {
            const ok = pick === w;
            if (ok) {
              try {
                useGm.getState().cardOwn(w[0]);
              } catch {
                /* noop */
              }
            }
            ctx.resolve(ok, w[2]);
          }}
        />
      </FootIn>
    </>
  );
}

function ExListen({ e, ctx }: { e: DuoEx; ctx: Ctx }) {
  const w = e.w!;
  const opts = useMemo(() => shuffle([w, ...others(w, 2, 0)]), [w]);
  const [pick, setPick] = useState<Word | null>(null);
  useEffect(() => {
    const t = setTimeout(() => speak(w[0]), 150);
    return () => clearTimeout(t);
  }, [w]);
  return (
    <>
      <PlayBtn zh={w[0]} />
      <Opts
        ctx={ctx}
        opts={opts}
        sel={pick}
        onPick={(o: Word) => setPick(o)}
        render={(o: Word) => (
          <span className="font-['Noto_Serif_SC',serif] text-[22px]" lang="zh-CN">
            {o[0]}
          </span>
        )}
      />
      <FootIn ctx={ctx}>
        <Foot
          ctx={ctx}
          can={pick != null}
          onCheck={() => {
            const ok = pick === w;
            if (ok) {
              ctx.bumpListen();
              try {
                useGm.getState().cardOwn(w[0]);
              } catch {
                /* noop */
              }
            }
            ctx.resolve(ok, `${w[0]} (${w[1]})`, w[2]);
          }}
        />
      </FootIn>
    </>
  );
}

function ExMatch({ e, ctx }: { e: DuoEx; ctx: Ctx }) {
  const pairs = e.pairs!;
  const right = useMemo(() => shuffle(pairs.slice()), [pairs]);
  const [selL, setSelL] = useState<string | null>(null);
  const [selR, setSelR] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(() => new Set());
  const mist = useRef(0);

  const tryPair = (l: string | null, rk: string | null, rEl: HTMLButtonElement | null) => {
    if (l == null || rk == null) return;
    if (l === rk) {
      const nd = new Set(done);
      nd.add(l);
      setDone(nd);
      if (rEl) nhBurst(rEl);
      try {
        sfx("ok");
      } catch {
        /* noop */
      }
      speak(l);
      if (nd.size >= pairs.length) ctx.resolve(mist.current <= 1, null, mist.current ? `Sai ${mist.current} lần` : "");
    } else {
      mist.current++;
      try {
        sfx("bad");
      } catch {
        /* noop */
      }
    }
    setSelL(null);
    setSelR(null);
  };

  return (
    <>
      <div
        ref={(el) => {
          ctx.refs.current.fx = el;
        }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="grid content-start gap-2.5">
          {pairs.map((w) => (
            <DuoTile
              key={w[0]}
              z={w[0]}
              py={gtPy(w[0])}
              disabled={done.has(w[0]) || ctx.S.answered}
              onClick={() => {
                if (ctx.S.answered || done.has(w[0])) return;
                setSelL(w[0]);
                speak(w[0]);
                tryPair(w[0], selR, null);
              }}
              className={selL === w[0] ? "border-[#1C1A6B] bg-[#EEF0FB]" : ""}
            />
          ))}
        </div>
        <div className="grid content-start gap-2.5">
          {right.map((w) => (
            <DuoTile
              key={w[0]}
              disabled={done.has(w[0]) || ctx.S.answered}
              onClick={(e2) => {
                if (ctx.S.answered || done.has(w[0])) return;
                setSelR(w[0]);
                tryPair(selL, w[0], e2.currentTarget);
              }}
              className={selR === w[0] ? "border-[#1C1A6B] bg-[#EEF0FB]" : ""}
            >
              <span className="text-[15px]">{w[2]}</span>
            </DuoTile>
          ))}
        </div>
      </div>
      <FootIn ctx={ctx}>
        <p className="w-full text-center text-[13.5px] text-[#6B7085]">Chạm một chữ Hán rồi chạm nghĩa của nó</p>
      </FootIn>
    </>
  );
}

function ExTiles({ e, ctx }: { e: DuoEx; ctx: Ctx }) {
  const l = e.l!;
  const tgt = useMemo(() => duoTok(l[2]), [l]);
  const bank = useMemo(() => {
    const all = ctx.S.W.map((w) => w[0]);
    const extra = shuffle(all.filter((z) => !tgt.includes(z) && z.length <= 3)).slice(
      0,
      Math.max(2, 6 - tgt.length),
    );
    return shuffle([...tgt, ...extra]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e]);
  const [chosen, setChosen] = useState<number[]>([]);

  return (
    <>
      <div className="rounded-2xl bg-[#F4F5FA] px-4 py-3 text-[18px] text-[#14163A]">{l[4]}</div>
      <div
        ref={(el) => {
          ctx.refs.current.fx = el;
        }}
        className="flex min-h-[64px] flex-wrap content-start items-start gap-2 border-b-2 border-[#E3E6EF] pb-2"
      >
        {chosen.map((id) => (
          <DuoTile
            key={id}
            z={bank[id]}
            py={gtPy(bank[id])}
            onClick={() => {
              if (ctx.S.answered) return;
              setChosen((c) => c.filter((x) => x !== id));
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {bank.map((z, id) =>
          chosen.includes(id) ? (
            <span key={id} className="inline-flex min-h-[48px] items-center rounded-xl bg-[#E3E6EF] px-3.5" aria-hidden>
              <span className="invisible font-['Noto_Serif_SC',serif] text-[20px]">{z}</span>
            </span>
          ) : (
            <DuoTile
              key={id}
              z={z}
              py={gtPy(z)}
              onClick={() => {
                if (ctx.S.answered) return;
                setChosen((c) => [...c, id]);
                speak(z);
              }}
            />
          ),
        )}
      </div>
      <FootIn ctx={ctx}>
        <Foot
          ctx={ctx}
          can={chosen.length > 0}
          onCheck={() => {
            const ok = chosen.map((id) => bank[id]).join("") === tgt.join("");
            if (ok) speak(l[2]);
            ctx.resolve(ok, l[2], l[3]);
          }}
        />
      </FootIn>
    </>
  );
}

function ExTrans({ e, ctx }: { e: DuoEx; ctx: Ctx }) {
  const l = e.l!;
  const opts = useMemo(() => {
    const pool2 = Object.values(GT_LESSONS)
      .flatMap((L) => L.dialog.flatMap((x) => x.lines))
      .map((x) => x[4])
      .filter((v) => v !== l[4]);
    return shuffle([l[4], ...shuffle([...new Set(pool2)]).slice(0, 2)]);
  }, [l]);
  const [pick, setPick] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => speak(l[2]), 150);
    return () => clearTimeout(t);
  }, [l]);
  return (
    <>
      <WordCard w={[l[2], l[3]]} sent />
      <Opts ctx={ctx} opts={opts} sel={pick} onPick={(o: string) => setPick(o)} render={(o: string) => <span>{o}</span>} />
      <FootIn ctx={ctx}>
        <Foot ctx={ctx} can={pick != null} onCheck={() => ctx.resolve(pick === l[4], l[4])} />
      </FootIn>
    </>
  );
}

function ExBlank({ e, ctx }: { e: DuoEx; ctx: Ctx }) {
  const l = e.l!;
  const w = e.w!;
  const i = l[2].indexOf(w[0]);
  const opts = useMemo(
    () => shuffle([w, ...shuffle((e.W || []).filter((w2) => w2[0] !== w[0] && !l[2].includes(w2[0]))).slice(0, 3)]),
    [e, l, w],
  );
  const [pick, setPick] = useState<Word | null>(null);
  return (
    <>
      <div
        ref={(el) => {
          ctx.refs.current.fx = el;
        }}
        className="flex flex-wrap items-baseline justify-center gap-1 text-[28px] text-[#14163A]"
      >
        <span className="font-['Noto_Serif_SC',serif]">{l[2].slice(0, i)}</span>
        <span className="min-w-[2em] border-b-[3px] border-[#1C1A6B] text-center font-['Noto_Serif_SC',serif] text-[#1C1A6B]">
          {pick ? pick[0] : "＿＿"}
        </span>
        <span className="font-['Noto_Serif_SC',serif]">{l[2].slice(i + w[0].length)}</span>
      </div>
      <div className="rounded-2xl bg-[#F4F5FA] px-4 py-3 text-[18px] text-[#14163A]">{l[4]}</div>
      <Opts
        ctx={ctx}
        opts={opts}
        sel={pick}
        onPick={(o: Word) => setPick(o)}
        render={(o: Word) => <HzP t={o[0]} py={gtPy(o[0])} className="text-[20px]" />}
      />
      <FootIn ctx={ctx}>
        <Foot
          ctx={ctx}
          can={pick != null}
          onCheck={() => {
            const ok = pick === w;
            if (ok) speak(l[2]);
            ctx.resolve(ok, w[0]);
          }}
        />
      </FootIn>
    </>
  );
}

function ExQuiz({ e, ctx }: { e: DuoEx; ctx: Ctx }) {
  const [q, opts0, why] = e.q!;
  const opts = useMemo(() => shuffle(opts0.slice()), [opts0]);
  const [pick, setPick] = useState<string | null>(null);
  const hz = /đọc/.test(q) && /[一-鿿]/.test(q) ? q.match(/[一-鿿]+/)![0] : "";
  return (
    <>
      <p className="text-[18px] text-[#14163A]">{q}</p>
      {hz ? <PlayBtn zh={hz} small /> : null}
      <Opts
        ctx={ctx}
        opts={opts}
        sel={pick}
        onPick={(o: string) => setPick(o)}
        render={(o: string) =>
          /[一-鿿]/.test(o) ? <HzP t={o} py={gtPy(o)} className="text-[20px]" /> : <span>{o}</span>
        }
      />
      <FootIn ctx={ctx}>
        <Foot
          ctx={ctx}
          can={pick != null}
          onCheck={() => {
            const ok = pick === opts0[0];
            if (ok && !ctx.S.retried.has(e)) {
              const S0 = gtState();
              S0.quiz = S0.quiz || {};
              S0.quiz[ctx.S.n] = S0.quiz[ctx.S.n] || {};
              if (!S0.quiz[ctx.S.n][e.qi!]) {
                S0.quiz[ctx.S.n][e.qi!] = 1;
                gtSave(S0);
              }
              usePlayer.getState().award(`gt:q:${ctx.S.n}:${e.qi}`, 2, "trả lời đúng");
            }
            if (/[一-鿿]/.test(opts0[0])) speak(opts0[0].replace(/\(.*\)/, ""));
            ctx.resolve(ok, opts0[0], why);
          }}
        />
      </FootIn>
    </>
  );
}

interface SRCtor {
  new (): {
    lang: string;
    interimResults: boolean;
    onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
    start(): void;
  };
}

function ExSpeak({ e, ctx }: { e: DuoEx; ctx: Ctx }) {
  const p = e.p!;
  const SR =
    (window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor })
      .SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: SRCtor }).webkitSpeechRecognition;
  const [mic, setMic] = useState<"idle" | "on" | "retry">("idle");
  const [hint, setHint] = useState("");
  useEffect(() => {
    const t = setTimeout(() => speak(p[0]), 150);
    return () => clearTimeout(t);
  }, [p]);
  useEffect(() => {
    if (!SR) setHint("Trình duyệt này chưa nhận giọng nói. Hãy đọc to theo mẫu rồi bấm Tiếp tục.");
  }, [SR]);

  const startRec = () => {
    try {
      const r = new SR!();
      r.lang = "zh-CN";
      r.interimResults = false;
      setMic("on");
      setHint("");
      r.onresult = (ev) => {
        const heard = Array.from(ev.results)
          .map((x) => x[0].transcript)
          .join("");
        const want = duoPlain(p[0]);
        const got = duoPlain(heard);
        const hit = [...want].filter((c) => got.includes(c)).length / Math.max(1, want.length);
        const ok = hit >= 0.6;
        if (ok) {
          const L = ledger();
          L["say:" + p[0] + ":" + dstr()] = 1;
          ls.set("nh:ledger", JSON.stringify(L));
        }
        ctx.resolve(ok, p[0], `Máy nghe ra: ${heard || "(không rõ)"}`);
      };
      r.onerror = () => {
        setHint("Không nghe được. Kiểm tra micro hoặc bấm “Không nói được lúc này”.");
        setMic("retry");
      };
      r.onend = () => {
        setMic((m) => (ctx.S.answered ? m : m === "on" ? "retry" : m));
      };
      r.start();
    } catch {
      setHint("Không mở được micro.");
    }
  };

  return (
    <>
      <WordCard w={p} sent />
      <button
        type="button"
        disabled={!SR}
        onClick={startRec}
        className={`self-center rounded-2xl border-0 px-7 py-4 text-[18px] font-extrabold text-white disabled:opacity-50 ${
          mic === "on" ? "bg-[#C8102E] shadow-[0_5px_0_#8E0B20]" : "bg-[#1C1A6B] shadow-[0_5px_0_#050349]"
        }`}
      >
        {mic === "on" ? "🎙 Đang nghe…" : mic === "retry" ? "🎙 Thử lại" : "🎙 Nhấn để nói"}
      </button>
      {hint ? <p className="text-center text-[13.5px] text-[#6B7085]">{hint}</p> : null}
      <FootIn ctx={ctx}>
        <Foot
          ctx={ctx}
          can={!SR}
          onCheck={() => ctx.advance(true)}
          skipTxt="Không nói được lúc này"
          onSkip={() => ctx.advance(true)}
        />
      </FootIn>
    </>
  );
}

/* ---------- headers (duoShell title/badge per branch) ---------- */
function exHeader(e: DuoEx): { title: string; badge?: string } {
  switch (e.t) {
    case "scene":
      return { title: "Nghe hội thoại", badge: "ÔN" };
    case "tonew":
      return { title: "Nghe và chọn đúng thanh" };
    case "teach":
      return { title: "Từ mới", badge: "HỌC" };
    case "tone":
      return { title: "Bốn thanh điệu", badge: "PHÁT ÂM" };
    case "toneq":
      return { title: "Nghe và chọn đúng thanh" };
    case "rule":
      return { title: e.r!.t, badge: e.g ? "MẪU CÂU" : "PHÁT ÂM" };
    case "ruleq": {
      const r = ruleqItem(e);
      if (r && /^→/.test(r[2] || "")) return { title: `“${r[0]}” khi nói thật đọc là?` };
      return { title: "Nghe và chọn câu đúng" };
    }
    case "mean":
      return { title: "Chọn nghĩa đúng", badge: e.isNew ? "TỪ MỚI" : "" };
    case "listen":
      return { title: "Nghe và chọn chữ đúng", badge: e.isNew ? "TỪ MỚI" : "" };
    case "match":
      return { title: "Ghép cặp từ" };
    case "tiles":
      return { title: "Viết câu này bằng tiếng Trung" };
    case "trans":
      return { title: "Câu này nghĩa là gì?" };
    case "blank":
      return { title: "Điền vào chỗ trống" };
    case "quiz":
      return { title: "Chọn câu phù hợp" };
    case "speak":
      return { title: "Nói câu này" };
    default:
      return { title: "" };
  }
}

function ExBody({ e, ctx }: { e: DuoEx; ctx: Ctx }) {
  switch (e.t) {
    case "scene":
      return <ExScene e={e} ctx={ctx} />;
    case "tonew":
      return <ExToneW e={e} ctx={ctx} />;
    case "teach":
      return <ExTeach e={e} ctx={ctx} />;
    case "tone":
      return <ExTone e={e} ctx={ctx} />;
    case "toneq":
      return <ExToneQ e={e} ctx={ctx} />;
    case "rule":
      return <ExRule e={e} ctx={ctx} />;
    case "ruleq":
      return <ExRuleQ e={e} ctx={ctx} />;
    case "mean":
      return <ExMean e={e} ctx={ctx} />;
    case "listen":
      return <ExListen e={e} ctx={ctx} />;
    case "match":
      return <ExMatch e={e} ctx={ctx} />;
    case "tiles":
      return <ExTiles e={e} ctx={ctx} />;
    case "trans":
      return <ExTrans e={e} ctx={ctx} />;
    case "blank":
      return <ExBlank e={e} ctx={ctx} />;
    case "quiz":
      return <ExQuiz e={e} ctx={ctx} />;
    case "speak":
      return <ExSpeak e={e} ctx={ctx} />;
    default:
      return null;
  }
}

/* ---------- end screen (duoEnd / libEnd) ---------- */
interface EndInfo {
  xp: number;
  acc: number;
  sec: number;
  perfect: boolean;
  nb: number;
  nextN: number;
}

function DuoEnd({ ctx, info }: { ctx: Ctx; info: EndInfo }) {
  const { n, b } = ctx.S;
  const mid = callHook<string>("msIdFor", n, b);
  const MM = mid ? callHook<{ title: string }>("msGet", mid) : null;
  const streak = useGm.getState().streak();
  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col items-center justify-center gap-3.5 text-center">
      <div
        className="my-4 grid h-[110px] w-[110px] rotate-[-6deg] place-items-center rounded-xl border-[5px] border-double border-[#C8102E] bg-[#C8102E]/5 font-['Noto_Serif_SC',serif] text-[34px] font-black leading-[1.05] text-[#C8102E]"
        style={{ writingMode: "vertical-rl" }}
        lang="zh-CN"
      >
        {info.perfect ? "满分" : "完成"}
      </div>
      <h3 className="text-[24px] font-extrabold text-[#14163A]">{info.perfect ? "Hoàn hảo!" : "Hoàn thành buổi học!"}</h3>
      <div className="flex flex-wrap justify-center gap-3">
        {(
          [
            [`+${info.xp}`, "Điểm", "#FFC800"],
            [`${info.acc}%`, "Chính xác", "#0F766E"],
            [`${Math.floor(info.sec / 60)}:${String(info.sec % 60).padStart(2, "0")}`, "Thời gian", "#1C1A6B"],
          ] as [string, string, string][]
        ).map(([v, l, c]) => (
          <div key={l} className="w-[120px] overflow-hidden rounded-2xl border-2" style={{ borderColor: c }}>
            <small className="block px-1 py-1 text-[12px] font-extrabold uppercase text-white" style={{ background: c }}>
              {l}
            </small>
            <b className="block px-1 py-3 text-[22px] text-[#14163A]">{v}</b>
          </div>
        ))}
      </div>
      <p className="text-[13.5px] text-[#6B7085]">
        {`🔥 Chuỗi ${streak} ngày – ${gtStarTxt(gtStars(n))} ${gtLabel(n)}`}
      </p>
      <div className="mt-2 flex w-full flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setGt({ cur: n, buoi: b, buoiFor: n, step: "goal" });
            callHook("openGTClass", classOf(n));
          }}
          className="rounded-xl border-2 border-[#E3E6EF] px-4 py-3 text-[14px] font-bold text-[#6B7085]"
        >
          📚 Giáo trình
        </button>
        <button
          type="button"
          autoFocus
          onClick={() => {
            if (MM) callHook("msStart", mid);
            else if (info.nb) callHook("duoStart", n, info.nb);
            else if (info.nextN) callHook("duoStart", info.nextN, 1);
            else useUi.getState().closeRoom();
          }}
          className="ml-auto min-w-[150px] rounded-2xl bg-[#EA0000] px-6 py-3.5 text-[16px] font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_#A61E22]"
        >
          {MM ? `🎯 Vào nhiệm vụ: ${MM.title} →` : info.nb ? `Học Buổi ${info.nb} →` : info.nextN ? `Sang ${gtLabel(info.nextN)} →` : "Xong"}
        </button>
      </div>
    </div>
  );
}

function ReviewEnd({ ctx }: { ctx: Ctx }) {
  /* fallback end screen for review sessions when lib.js' libEnd isn't around */
  const sec = Math.round((Date.now() - ctx.S.t0) / 1000);
  const acc = Math.round((100 * (ctx.S.total - ctx.S.wrong)) / Math.max(1, ctx.S.total));
  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col items-center justify-center gap-3.5 text-center">
      <div
        className="my-4 grid h-[110px] w-[110px] rotate-[-6deg] place-items-center rounded-xl border-[5px] border-double border-[#C8102E] bg-[#C8102E]/5 font-['Noto_Serif_SC',serif] text-[34px] font-black leading-[1.05] text-[#C8102E]"
        style={{ writingMode: "vertical-rl" }}
        lang="zh-CN"
      >
        {acc >= 90 ? "好" : "练"}
      </div>
      <h3 className="text-[24px] font-extrabold text-[#14163A]">{`Xong – ${ctx.S.rvTitle || "Ôn tập"}`}</h3>
      <div className="flex flex-wrap justify-center gap-3">
        <div className="w-[120px] overflow-hidden rounded-2xl border-2 border-[#0F766E]">
          <small className="block bg-[#0F766E] px-1 py-1 text-[12px] font-extrabold uppercase text-white">Chính xác</small>
          <b className="block px-1 py-3 text-[22px] text-[#14163A]">{`${acc}%`}</b>
        </div>
        <div className="w-[120px] overflow-hidden rounded-2xl border-2 border-[#1C1A6B]">
          <small className="block bg-[#1C1A6B] px-1 py-1 text-[12px] font-extrabold uppercase text-white">Thời gian</small>
          <b className="block px-1 py-3 text-[22px] text-[#14163A]">{`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`}</b>
        </div>
      </div>
      <button
        type="button"
        autoFocus
        onClick={() => useUi.getState().closeRoom()}
        className="mt-2 min-w-[150px] rounded-2xl bg-[#EA0000] px-6 py-3.5 text-[16px] font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_#A61E22]"
      >
        Về thư viện
      </button>
    </div>
  );
}

/* ---------- the runner ---------- */
export function DuoRunner({ D }: { D: DuoInit }) {
  const [S, setS] = useState<DuoState>(() => {
    const queue = D.ex.slice();
    const cur = queue.shift() ?? null;
    return {
      ...D,
      queue,
      total: D.ex.length,
      done: 0,
      wrong: 0,
      combo: 0,
      best: 0,
      retried: new Set<DuoEx>(),
      t0: Date.now(),
      listenOk: 0,
      cur,
      answered: false,
      turn: 0,
    };
  });
  const [res, setRes] = useState<Result | null>(null);
  const [footEl, setFootEl] = useState<HTMLDivElement | null>(null);
  const [endInfo, setEndInfo] = useState<EndInfo | null>(null);
  const refs = useRef<Refs>({ check: null, opts: [], fx: null, main: null, bar: null });
  const sRef = useRef(S);
  sRef.current = S;
  const ended = !S.cur;

  const advance = useCallback((cont = false) => {
    setRes(null);
    refs.current.opts = [];
    refs.current.fx = null;
    setS((s) => {
      const done = s.done + (cont ? 1 : 0);
      if (!s.queue.length) return { ...s, done, cur: null, answered: false };
      const queue = s.queue.slice();
      const cur = queue.shift()!;
      return { ...s, done, queue, cur, answered: false, turn: s.turn + 1 };
    });
  }, []);

  const bumpListen = useCallback(() => setS((s) => ({ ...s, listenOk: s.listenOk + 1 })), []);

  const resolve = useCallback((ok: boolean, right?: string | null, extra?: string) => {
    const s0 = sRef.current;
    const c = s0.cur;
    if (!c || s0.answered) return;
    const z: string[] =
      c.w && c.t !== "blank" && c.t !== "tonew"
        ? [c.w[0]]
        : c.t === "blank" && c.w
          ? [c.w[0]]
          : c.t === "match" && c.pairs
            ? c.pairs.map((w) => w[0])
            : c.t === "tonew" && c.w
              ? [c.w[0]]
              : [];
    try {
      if (z.length) useWm.getState().hit(z, ok);
    } catch {
      /* noop */
    }
    nhFx(refs.current.fx, ok, { main: refs.current.main, bar: refs.current.bar });
    setS((s) => {
      if (s.answered) return s;
      if (ok) {
        const combo = s.combo + 1;
        try {
          sfx(combo >= 3 ? "combo" : "ok");
        } catch {
          /* noop */
        }
        return { ...s, answered: true, done: s.done + 1, combo, best: Math.max(s.best, combo) };
      }
      try {
        sfx("bad");
      } catch {
        /* noop */
      }
      let queue = s.queue;
      let total = s.total;
      let retried = s.retried;
      if (!retried.has(c)) {
        retried = new Set(retried);
        retried.add(c);
        queue = [...queue, c];
        total++;
      }
      return { ...s, answered: true, wrong: s.wrong + 1, combo: 0, queue, total, retried };
    });
    setRes({ ok, right, extra, praise: pickPraise() });
  }, []);

  const ctx: Ctx = { refs, S, resolve, advance, footEl, res, bumpListen };

  /* duoEnd side effects — once when the queue drains */
  useEffect(() => {
    if (!ended || endInfo) return;
    const s = sRef.current;
    const sec = Math.round((Date.now() - s.t0) / 1000);
    const acc = Math.round((100 * (s.total - s.wrong)) / Math.max(1, s.total));
    const perfect = s.wrong === 0;
    if (s.review) {
      const info = { t0: s.t0, sec, total: s.total, wrong: s.wrong, review: s.review, rvTitle: s.rvTitle };
      setDuoSession(info);
      callHook("libEnd", info);
      setEndInfo({ xp: 0, acc, sec, perfect, nb: 0, nextN: 0 });
      return;
    }
    const { n, b } = s;
    const NB = gtNS(n);
    setDuoSession({ t0: s.t0, sec, total: s.total, wrong: s.wrong, rvTitle: s.rvTitle });
    setGt({ buoi: b, buoiFor: n });
    gtBSteps(n, b).forEach((k) => gtSeen(n, k));
    gtCheckDone(n);
    try {
      callHook("chMark", n, b);
    } catch {
      /* noop */
    }
    if (s.listenOk >= 3) {
      const st = gtState();
      st.listen = st.listen || {};
      if (!st.listen[n]) {
        st.listen[n] = 1;
        gtSave(st);
      }
    }
    const xp = 10 + (perfect ? 5 : 0) + (s.best >= 5 ? 3 : 0);
    usePlayer.getState().award(`duo:${n}:${b}:${dstr()}`, xp, `xong Buổi ${b} – ${gtLabel(n)}`);
    gtStarCheck(n);
    const nb = b < NB ? b + 1 : 0;
    const nextN = !nb && gtUnlocked(n + 1) ? n + 1 : 0;
    try {
      callHook("fbNudge", "buoi-dau", "Bạn vừa xong buổi học đầu tiên! Nhắn NowHanzi để được giáo viên tư vấn lộ trình 1-1 miễn phí.");
    } catch {
      /* noop */
    }
    try {
      if (perfect || !nb) callHook("gtConfetti");
      sfx("win");
    } catch {
      /* noop */
    }
    setEndInfo({ xp, acc, sec, perfect, nb, nextN });
  }, [ended, endInfo]);

  /* keyboard: Enter → main button, digits → options */
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const s = sRef.current;
      if (!s || s.answered) {
        if (ev.key === "Enter") {
          const f = refs.current.check;
          if (f && !f.disabled) {
            ev.preventDefault();
            f.click();
          }
        }
        return;
      }
      if (ev.key === "Enter") {
        const f = refs.current.check;
        if (f && !f.disabled) {
          ev.preventDefault();
          f.click();
        }
        return;
      }
      if (/^[1-9]$/.test(ev.key)) {
        const o = refs.current.opts[+ev.key - 1];
        if (o) {
          ev.preventDefault();
          o.click();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* cleanup module-level flags on unmount (dlg close handler) */
  useEffect(() => () => {
    refs.current.opts = [];
  }, []);

  if (ended) {
    if (!endInfo) return null;
    return S.review ? <ReviewEnd ctx={ctx} /> : <DuoEnd ctx={ctx} info={endInfo} />;
  }
  const e = S.cur!;
  const { title, badge } = exHeader(e);
  return (
    <div className="mx-auto flex min-h-[min(640px,calc(100dvh-160px))] w-full max-w-[640px] flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-[#E3E6EF]">
          <i
            ref={(el) => {
              refs.current.bar = el;
            }}
            className="block h-full rounded-full bg-[#C8102E] shadow-[inset_0_4px_0_rgba(255,255,255,.3)] transition-[width] duration-300"
            style={{ width: `${(S.done / Math.max(1, S.total)) * 100}%` }}
          />
        </div>
        <span className={`min-w-[46px] text-right font-extrabold text-[#FF9600] transition-opacity ${S.combo >= 3 ? "opacity-100" : "opacity-0"}`}>
          {`连对 ×${S.combo}`}
        </span>
      </div>
      {badge ? (
        <span className="self-start rounded-md border-[1.5px] border-[#C8102E] px-2 py-0.5 text-[12px] font-extrabold tracking-[.12em] text-[#C8102E]">
          {badge}
        </span>
      ) : null}
      <h3 className="border-l-4 border-[#C8102E] pl-3 text-[24px] font-extrabold leading-tight text-[#14163A]">
        {title}
      </h3>
      <div
        ref={(el) => {
          refs.current.main = el;
        }}
        className="flex flex-1 flex-col items-stretch gap-3.5"
      >
        <ExBody key={S.turn} e={e} ctx={ctx} />
      </div>
      <div
        ref={setFootEl}
        className={`sticky bottom-0 -mx-4 -mb-4 mt-auto flex items-center justify-between gap-3 border-t-2 bg-white px-4 pb-4 pt-4 ${
          res ? (res.ok ? "border-transparent bg-[#E4F2EE]" : "border-transparent bg-[#FDECEE]") : "border-[#E3E6EF]"
        }`}
      >
        {res ? (
          <>
            <div className="flex min-w-[200px] flex-1 flex-col gap-0.5">
              <b className={`text-[22px] ${res.ok ? "text-[#0B5A54]" : "text-[#8E0B20]"}`}>
                {res.ok ? res.praise : "再试试 – Chưa đúng"}
              </b>
              {!res.ok && res.right ? (
                <span className="text-[#8E0B20]">
                  Đáp án đúng: <b>{res.right}</b>
                </span>
              ) : null}
              {res.extra ? <small className="text-[#14163A]/80">{res.extra}</small> : null}
            </div>
            <button
              type="button"
              autoFocus
              ref={(el) => {
                refs.current.check = el;
              }}
              onClick={() => advance()}
              className={`ml-auto min-w-[150px] rounded-2xl px-6 py-3.5 text-[16px] font-extrabold uppercase tracking-wide text-white ${
                res.ok ? "bg-[#0F766E] shadow-[0_4px_0_#0B5A54]" : "bg-[#C8102E] shadow-[0_4px_0_#8E0B20]"
              }`}
            >
              {res.ok ? "Tiếp tục" : "Đã hiểu"}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
